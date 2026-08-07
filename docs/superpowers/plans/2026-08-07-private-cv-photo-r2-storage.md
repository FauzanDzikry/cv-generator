# Private CV Photo with R2 Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyimpan satu profile photo private per CV pada R2 atau local fallback, mempertahankan flag include, dan hanya mengalirkan foto kepada pemilik CV melalui aplikasi.

**Architecture:** Metadata server (`photo_disk`, `photo_path`, `photo_mime`) tetap berada di `custom_fields`, tetapi dibuang dari props Inertia. `CVPhotoStorage` menjadi satu jalur untuk write/copy/read/delete dengan R2-first dan local fallback; controller mengatur authorization, transaksi, serta lifecycle CV. Frontend memakai multipart melalui helper bawaan Inertia dan hanya merender `photo_url` private.

**Tech Stack:** Laravel 12, PHP 8.2, Flysystem S3 v3, Cloudflare R2 S3 API, Inertia React 2, TypeScript, PHPUnit 11, Playwright Chromium.

## Global Constraints

- Foto hanya dapat diakses pemilik CV melalui route ber-middleware `auth` dan ownership check yang sudah ada.
- `R2_ENABLED` hanya memilih tujuan upload/copy baru; read/delete selalu memakai `photo_disk` yang tersimpan.
- R2 write gagal harus fallback ke disk private `local`; kegagalan kedua disk tidak boleh menyimpan metadata baru.
- `is_use_photo=false` hanya menyembunyikan file; penghapusan fisik hanya melalui tombol hapus, replace, delete CV, atau delete account.
- Upload hanya JPEG/PNG maksimal 5 MB dan nama/path dibuat server-side.
- CV duplicate harus mempunyai file terpisah.
- Base64 legacy dimigrasikan dengan command idempotent, bukan database migration.
- Pertahankan perubahan uncommitted duplicate CV yang sudah ada pada controller, route, dan index page.
- Tidak menambahkan tabel foto, queue, signed URL, CDN, image optimizer, atau abstraksi selain service bersama yang benar-benar dipakai banyak alur.

---

### Task 1: Konfigurasi R2 dan service storage bersama

**Files:**
- Modify: `composer.json`
- Modify: `composer.lock`
- Modify: `.env.example`
- Modify: `config/filesystems.php`
- Create: `app/Services/CVPhotoStorage.php`
- Create: `tests/Unit/CVPhotoStorageTest.php`

**Interfaces:**
- Consumes: `__construct(FilesystemManager $filesystems)`, `config('filesystems.cv_photos.r2_enabled')`, disk `r2`, disk `local`, dan metadata server pada `custom_fields`.
- Produces: `storeUpload(CVData $cv, UploadedFile $photo): array`, `storeBytes(CVData $cv, string $bytes, string $mime): array`, `copy(CVData $source, CVData $target): array`, `delete(array $metadata): void`, `response(CVData $cv): StreamedResponse`, `hasPhoto(CVData $cv): bool`, dan `metadata(CVData $cv): array`.

- [ ] **Step 1: Tambahkan failing unit tests untuk pemilihan disk dan metadata**

Test membuat dua filesystem mock/fake dengan perilaku konkret berikut:

Test mendefinisikan helper `serviceWithDisks(FilesystemOperator $r2, FilesystemOperator $local): CVPhotoStorage` yang membuat mock `FilesystemManager::disk()` untuk mengembalikan kedua operator tersebut, serta helper `cv(): CVData` dengan UUID tetap pada `$this->cvId`.

```php
public function test_r2_failure_falls_back_to_local_and_records_actual_disk(): void
{
    config(['filesystems.cv_photos.r2_enabled' => true]);
    // r2->put throws; local->put returns true.
    $metadata = $this->serviceWithDisks($r2, $local)
        ->storeBytes($this->cv(), 'image-bytes', 'image/png');

    $this->assertSame('local', $metadata['photo_disk']);
    $this->assertSame('image/png', $metadata['photo_mime']);
    $this->assertStringStartsWith('cv-photos/'.$this->cvId.'/', $metadata['photo_path']);
}
```

Tambahkan kasus R2 sukses, R2 nonaktif langsung local, kedua disk gagal melempar exception, metadata invalid ditolak saat read/delete, dan base64 legacy valid dapat dibaca.

- [ ] **Step 2: Jalankan unit test dan pastikan RED**

Run: `php artisan test tests/Unit/CVPhotoStorageTest.php --no-ansi`

Expected: FAIL karena `App\Services\CVPhotoStorage` belum ada.

- [ ] **Step 3: Tambahkan adapter S3 dan konfigurasi private**

Run: `composer require league/flysystem-aws-s3-v3:^3.0 --no-interaction`

Tambahkan ke `.env.example`:

```dotenv
R2_ENABLED=false
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
R2_REGION=auto
```

Tambahkan disk `r2` dengan driver `s3`, key/secret/bucket/endpoint/region R2, `use_path_style_endpoint=false`, `visibility=private`, dan `throw=true`. Tambahkan config `cv_photos.r2_enabled=(bool) env('R2_ENABLED', false)`. Ubah disk `local` menjadi `throw=true` agar kegagalan tidak tersamarkan.

- [ ] **Step 4: Implementasikan service minimum**

Gunakan map MIME tetap:

```php
private const EXTENSIONS = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
];
```

Path selalu `cv-photos/{cv-id}/{uuid}.{ext}`. Jika R2 aktif, coba `r2` lalu `local`; jika tidak aktif, hanya `local`. Tangkap error per disk, log warning tanpa bytes/kredensial, dan kembalikan metadata disk yang benar-benar berhasil. `response()` hanya menerima disk `local|r2`, path dengan prefix CV terkait, serta MIME pada map; jika metadata path belum ada tetapi `photo_base64` valid, stream bytes legacy dengan route yang sama.

- [ ] **Step 5: Jalankan unit tests dan pastikan GREEN**

Run: `php artisan test tests/Unit/CVPhotoStorageTest.php --no-ansi`

Expected: PASS untuk disk selection, fallback, validation, dan legacy response.

- [ ] **Step 6: Commit Task 1**

```powershell
git add composer.json composer.lock .env.example config/filesystems.php app/Services/CVPhotoStorage.php tests/Unit/CVPhotoStorageTest.php
git commit -m "feat: add private CV photo storage"
```

### Task 2: Persistence, sanitasi props, serta endpoint read/delete private

**Files:**
- Modify: `app/Http/Requests/CVDataRequest.php`
- Modify: `app/Http/Controllers/CVDataController.php`
- Modify: `routes/web.php`
- Create: `tests/Feature/CVPhotoPersistenceTest.php`

**Interfaces:**
- Consumes: `CVPhotoStorage` Task 1 dan request fields `photo`, `custom_fields.is_use_photo`, `custom_fields.enabled_sections`.
- Produces: `GET /cvs/{cv}/photo` bernama `cvs.photo.show`, `DELETE /cvs/{cv}/photo` bernama `cvs.photo.destroy`, serta props CV dengan `has_photo` dan `photo_url` tanpa metadata internal.

- [ ] **Step 1: Buat failing feature tests untuk bug asli dan security boundary**

Gunakan `UploadedFile::fake()->image('profile.png', 300, 300)` dan fake disks untuk membuktikan:

```php
$response = $this->actingAs($owner)->post('/cvs', [
    ...$this->validPayload(),
    'photo' => UploadedFile::fake()->image('profile.png', 300, 300),
    'custom_fields' => [
        'is_use_photo' => true,
        'enabled_sections' => [],
    ],
]);

$cv = CVData::firstOrFail();
$this->assertTrue($cv->custom_fields['is_use_photo']);
$this->assertSame('local', $cv->custom_fields['photo_disk']);
```

Tambahkan assertion bahwa show/edit props mengandung `has_photo=true`, `photo_url`, dan tidak mengandung `photo_disk`, `photo_path`, `photo_mime`, atau `photo_base64`. Pemilik mendapat `200`; pengguna lain dan guest tidak dapat membaca foto.

- [ ] **Step 2: Jalankan test dan pastikan RED karena nested validation membuang foto**

Run: `php artisan test tests/Feature/CVPhotoPersistenceTest.php --no-ansi`

Expected: FAIL karena rules/endpoint/persistence foto belum ada.

- [ ] **Step 3: Perketat request validation**

Tambahkan rules berikut tanpa mengizinkan browser mengirim disk/path/MIME:

```php
'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'mimetypes:image/jpeg,image/png', 'max:5120'],
'custom_fields.is_use_photo' => ['required', 'boolean'],
```

Rules `enabled_sections` tetap ada. Server mengabaikan atau menolak keys metadata internal dari request.

- [ ] **Step 4: Integrasikan upload dan metadata merge pada store/update**

Controller menyuntikkan `CVPhotoStorage`. Pisahkan field parent dari delapan section dan `photo`. Whitelist custom fields client hanya `is_use_photo` serta `enabled_sections`. Pada update tanpa upload, merge metadata lama; pada upload baru, tulis file baru, update DB, lalu hapus file lama setelah commit. Jika transaksi gagal, hapus file baru dan lempar ulang.

- [ ] **Step 5: Sanitasi payload show/edit dan tambahkan endpoint private**

Buat satu helper controller yang mengubah model menjadi array, menghapus metadata internal/base64 dari `custom_fields`, lalu menambahkan:

```php
'has_photo' => $photos->hasPhoto($cv),
'photo_url' => $photos->hasPhoto($cv) ? route('cvs.photo.show', $cv) : null,
```

Route read/delete berada di group auth yang sama. Keduanya memanggil `authorizeOwnership()` sebelum service read/delete. Delete berjalan dalam DB transaction, menetapkan `is_use_photo=false`, menghapus seluruh `photo_*`/legacy base64, dan rollback jika storage delete gagal.

- [ ] **Step 6: Jalankan feature test dan suite CV**

Run: `php artisan test tests/Feature/CVPhotoPersistenceTest.php --no-ansi`

Expected: PASS.

Run: `php artisan test --filter=CVData --no-ansi`

Expected: seluruh regression CV PASS.

- [ ] **Step 7: Commit Task 2**

```powershell
git add app/Http/Requests/CVDataRequest.php app/Http/Controllers/CVDataController.php routes/web.php tests/Feature/CVPhotoPersistenceTest.php
git commit -m "fix: persist and protect CV profile photos"
```

### Task 3: Lifecycle duplicate, delete CV, dan delete account

**Files:**
- Modify: `app/Http/Controllers/CVDataController.php`
- Modify: `app/Http/Controllers/Settings/ProfileController.php`
- Modify: `tests/Feature/CVPhotoPersistenceTest.php`
- Modify: `tests/Feature/Settings/ProfileUpdateTest.php`

**Interfaces:**
- Consumes: metadata foto dan `CVPhotoStorage::copy/delete`.
- Produces: file independen pada duplicate dan cleanup yang membatalkan delete bila storage gagal.

- [ ] **Step 1: Tambahkan failing lifecycle tests**

Test harus membuktikan:

- duplicate mempunyai `photo_path` berbeda dan kedua file ada;
- delete foto/CV asli tidak menghapus file duplicate;
- delete CV menghapus file aktual;
- delete account membersihkan foto seluruh CV sebelum cascade;
- kegagalan storage delete mempertahankan CV/account agar dapat dicoba ulang.

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `php artisan test --filter="CVPhotoPersistenceTest|ProfileUpdateTest" --no-ansi`

Expected: FAIL pada copy/cleanup yang belum diintegrasikan.

- [ ] **Step 3: Integrasikan duplicate tanpa menimpa perubahan pengguna**

Pertahankan method dan route duplicate yang sudah uncommitted. Setelah record clone dibuat, panggil `CVPhotoStorage::copy($source, $newCv)`, merge metadata salinan ke `custom_fields`, dan simpan. Jika copy atau DB gagal, bersihkan file baru serta rollback record/sections.

- [ ] **Step 4: Integrasikan delete CV dan account**

Pada destroy CV, jalankan file delete di dalam DB transaction sebelum `$cv->delete()` sehingga exception storage membatalkan record deletion. Pada account destroy, eager-load CV, hapus setiap file melalui service dalam transaction, baru logout/delete user setelah cleanup berhasil; session hanya diinvalidasi setelah operasi sukses.

- [ ] **Step 5: Jalankan lifecycle tests dan suite terkait**

Run: `php artisan test --filter="CVPhotoPersistenceTest|CVDataRelationalAggregateTest|ProfileUpdateTest|Phase12IntegrityAndRegressionTest" --no-ansi`

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```powershell
git add app/Http/Controllers/CVDataController.php app/Http/Controllers/Settings/ProfileController.php tests/Feature/CVPhotoPersistenceTest.php tests/Feature/Settings/ProfileUpdateTest.php resources/js/pages/cvs/index.tsx routes/web.php
git commit -m "feat: manage CV photo lifecycle"
```

### Task 4: Command migrasi base64 legacy

**Files:**
- Create: `app/Console/Commands/MigrateCVPhotoBase64.php`
- Create: `tests/Feature/MigrateCVPhotoBase64CommandTest.php`

**Interfaces:**
- Consumes: `CVPhotoStorage::storeBytes`, `custom_fields.photo_base64`.
- Produces: command `cv-photos:migrate-base64` dengan exit nonzero bila ada record gagal dan ringkasan migrated/skipped/failed.

- [ ] **Step 1: Buat failing command tests**

Test tiga record: base64 PNG valid, metadata path sudah ada, dan base64 invalid. Assert record valid mendapat disk/path/MIME dan kehilangan base64; record selesai dilewati; record invalid tetap utuh serta command gagal. Jalankan ulang setelah memperbaiki invalid record dan pastikan hanya record tersisa diproses.

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `php artisan test tests/Feature/MigrateCVPhotoBase64CommandTest.php --no-ansi`

Expected: FAIL karena command belum ada.

- [ ] **Step 3: Implementasikan command idempotent**

Gunakan `CVData::query()->whereNotNull('custom_fields')->orderBy('id')->chunkById(100, ...)`. Filter JSON di PHP agar kompatibel SQLite/PostgreSQL. Decode format `data:image/(png|jpeg);base64,...` dengan strict base64, batas decoded bytes 5 MB, dan lanjutkan record lain ketika satu gagal. Simpan metadata hanya sesudah storage write berhasil; jika DB save gagal, hapus file baru.

- [ ] **Step 4: Jalankan test dan pastikan GREEN**

Run: `php artisan test tests/Feature/MigrateCVPhotoBase64CommandTest.php --no-ansi`

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```powershell
git add app/Console/Commands/MigrateCVPhotoBase64.php tests/Feature/MigrateCVPhotoBase64CommandTest.php
git commit -m "feat: migrate legacy CV photo data"
```

### Task 5: Frontend multipart, private preview, dan tombol hapus

**Files:**
- Modify: `resources/js/types/cv.ts`
- Modify: `resources/js/pages/form-generate.tsx`
- Modify: `resources/js/pages/cvs/show.tsx`
- Modify: `tests/e2e/cv-phase12-regression-matrix.spec.ts`

**Interfaces:**
- Consumes: `cv.has_photo`, `cv.photo_url`, private delete route, dan backend multipart contract.
- Produces: save create/update/pending-login yang mengirim `File`, preview endpoint private untuk persisted photo, dan tombol `Hapus Foto`.

- [ ] **Step 1: Tambahkan failing browser assertion pada alur foto**

Perbarui fixture/test agar foto preview berasal dari `cvPhotoPreview` untuk guest dan tambahkan authenticated save scenario yang mengunggah fixture PNG, mencentang include, menyimpan, lalu memastikan image `src` mengarah ke `/cvs/{uuid}/photo` dan berhasil dirender. Tambahkan assertion bahwa response page tidak memuat `photo_path` atau `photo_base64`.

- [ ] **Step 2: Jalankan test terarah dan pastikan RED**

Run: `pnpm.cmd exec playwright test tests/e2e/cv-phase12-regression-matrix.spec.ts --project=chromium`

Expected: scenario save/private photo FAIL sebelum frontend multipart diterapkan.

- [ ] **Step 3: Perbarui types dan sumber preview persisted**

Tambahkan `has_photo?: boolean` dan `photo_url?: string|null`; hapus kontrak runtime `photo_base64` dari response baru tetapi pertahankan parsing localStorage legacy. Edit/show menginisialisasi `photoPreview` dari `photo_url`.

- [ ] **Step 4: Gunakan multipart bawaan Inertia**

Import `objectToFormData` dari `@inertiajs/core`. Satu helper `buildSavePayload()` menghasilkan object nested yang sama untuk create/update/pending-save dan menyertakan `photo` hanya jika `File` baru tersedia. `fetch` create memakai `objectToFormData(payload)` tanpa header `Content-Type`; update memakai POST multipart dengan `_method=put`. Pending base64 guest dikonversi menjadi `File` sebelum dikirim.

- [ ] **Step 5: Tambahkan tombol hapus**

Jika hanya file baru, tombol membersihkan `photo`, preview, dan localStorage. Jika foto persisted, konfirmasi lalu panggil `DELETE cvs.photo.destroy`; setelah sukses set `has_photo=false`, preview null, file null, dan `is_use_photo=false`. Tampilkan error yang ada tanpa menghapus state jika request gagal.

- [ ] **Step 6: Jalankan format, types, build, dan browser test**

Run: `pnpm.cmd exec prettier --write resources/js/types/cv.ts resources/js/pages/form-generate.tsx resources/js/pages/cvs/show.tsx tests/e2e/cv-phase12-regression-matrix.spec.ts`

Run: `pnpm.cmd run types`

Run: `pnpm.cmd run build`

Run: `pnpm.cmd exec playwright test tests/e2e/cv-phase12-regression-matrix.spec.ts --project=chromium`

Expected: seluruh command exit 0.

- [ ] **Step 7: Commit Task 5**

```powershell
git add resources/js/types/cv.ts resources/js/pages/form-generate.tsx resources/js/pages/cvs/show.tsx tests/e2e/cv-phase12-regression-matrix.spec.ts
git commit -m "feat: upload private CV photos"
```

### Task 6: Final verification dan deployment handoff

**Files:**
- Verify: seluruh file di atas
- Modify: plan ini untuk menandai checkbox selesai

**Interfaces:**
- Consumes: seluruh task.
- Produces: bukti test lengkap dan instruksi deployment R2/private storage.

- [ ] **Step 1: Jalankan pemeriksaan backend lengkap**

Run: `php artisan test --no-ansi`

Run: `php vendor/bin/pint --test`

Expected: seluruh test PASS dan Pint exit 0 pada diff yang disentuh.

- [ ] **Step 2: Jalankan pemeriksaan frontend lengkap**

Run: `pnpm.cmd run types`

Run: `pnpm.cmd run build`

Run: `pnpm.cmd exec playwright test --project=chromium`

Expected: seluruh command exit 0; jika browser runtime tidak tersedia, laporkan command dan error persis tanpa mengklaim E2E lulus.

- [ ] **Step 3: Audit requirement dan keamanan**

Run: `rg -n "photo_base64|photo_disk|photo_path|photo_mime|R2_ENABLED|cvs.photo" app config resources routes tests .env.example`

Pastikan metadata internal hanya berada pada backend persistence/test, tidak diserialisasi pada page props, dan tidak ada direct R2/public URL di frontend.

- [ ] **Step 4: Dokumentasikan deployment**

Handoff wajib menyebut `composer install`, konfigurasi R2, `php artisan config:clear` atau rebuild config cache, permission `storage/app/private`, dan eksekusi `php artisan cv-photos:migrate-base64` setelah backup database/storage.

- [ ] **Step 5: Commit checklist plan bila ada perubahan checkbox**

```powershell
git add docs/superpowers/plans/2026-08-07-private-cv-photo-r2-storage.md
git commit -m "docs: finalize private CV photo plan"
```
