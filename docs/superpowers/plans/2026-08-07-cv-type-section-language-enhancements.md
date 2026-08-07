# CV Type, Section Order, dan Language Certification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan dua tipe CV dengan urutan section, form, dan add-on yang konsisten; memperluas data Languages untuk sertifikasi formal; serta mempertahankan data lama dan data section yang disembunyikan.

**Architecture:** Simpan `cv_type` sebagai atribut utama CV, simpan status add-on aktif di `custom_fields.enabled_sections`, dan gunakan satu konfigurasi TypeScript bersama untuk urutan, label, section inti, serta add-on per tipe. Data section tetap memakai tabel relasional yang ada; section yang tidak aktif hanya disembunyikan dari form/preview/PDF dan tidak dihapus.

**Tech Stack:** Laravel, PHP, PostgreSQL schema `cv`, SQLite untuk test, Inertia.js, React 19, TypeScript, Tailwind CSS, PHPUnit, Playwright.

## Global Constraints

- Jangan mengubah key internal `work_experience`, nama tabel `work_experiences`, model, atau relasinya; perubahan menjadi `Professional Experience` hanya berlaku pada copy yang dilihat pengguna.
- Jangan menambah dependency baru.
- Form, daftar add-on, progress form, preview, halaman CV tersimpan, dan PDF harus memakai urutan section yang sama.
- Mematikan add-on atau mengganti tipe tidak boleh menghapus data section tanpa konfirmasi.
- CV dan localStorage lama tanpa `cv_type` harus dibaca sebagai `professional`.
- Languages tanpa bukti formal hanya mewajibkan nama bahasa; proficiency dan detail sertifikasi tidak wajib.
- Expiration Languages harus bekerja seperti expiration pada Licenses & Certifications: checkbox menyatakan bahwa sertifikasi memiliki expiration date; input expiration aktif dan wajib hanya ketika checkbox dicentang.
- Placeholder Additional Information harus persis: `Include any final professional details, such as work availability, relocation preferences, or technical publications.`
- Helper text yang wajib digunakan: `Use bullet points for better readability.`
- Jangan menjalankan migrasi produksi atau mengubah data nyata sebagai bagian verifikasi.

---

## 1. Ringkasan Perubahan

Implementasi mencakup:

1. Pilihan tipe `Professional` dan `Fresh Graduate / Career Switcher / Student`.
2. Urutan section yang berbeda berdasarkan tipe.
3. Urutan panel form dan daftar checkbox add-on yang ikut berubah berdasarkan tipe.
4. Status section aktif yang tetap tersimpan saat CV dibuka kembali.
5. Data section tersembunyi yang tetap disimpan.
6. Label `Professional Experience` yang konsisten di seluruh UI.
7. Languages dengan kondisi bersertifikat dan tanpa sertifikat.
8. Backward compatibility untuk database dan localStorage lama.
9. Placeholder Additional Information dan helper bullet points baru.

## 2. Kontrak Urutan Section

### 2.1 Professional

Urutan panel form, progress, preview, halaman CV tersimpan, dan PDF:

1. Personal Information
2. Summary
3. Professional Experience
4. Portfolio, jika aktif
5. Skills
6. Licenses & Certifications, jika aktif
7. Education
8. Organizations, jika aktif
9. Languages, jika aktif
10. Additional Information, jika aktif

Urutan checkbox add-on:

1. Portfolio
2. Licenses & Certifications
3. Organizations
4. Languages
5. Additional Information

`Accomplishments` tidak tersedia pada tipe Professional. Data Accomplishments yang sudah ada tetap disimpan tetapi tidak ditampilkan.

### 2.2 Fresh Graduate / Career Switcher / Student

Urutan panel form, progress, preview, halaman CV tersimpan, dan PDF:

1. Personal Information
2. Summary
3. Education
4. Organizations, jika aktif
5. Portfolio, jika aktif
6. Accomplishments, jika aktif
7. Skills
8. Licenses & Certifications, jika aktif
9. Languages, jika aktif
10. Additional Information, jika aktif

Urutan checkbox add-on:

1. Organizations
2. Portfolio
3. Accomplishments
4. Licenses & Certifications
5. Languages
6. Additional Information

`Professional Experience` tidak tersedia pada tipe Fresh Graduate. Data Professional Experience yang sudah ada tetap disimpan tetapi tidak ditampilkan.

### 2.3 Section inti dan add-on

| Tipe | Section inti | Add-on opsional |
|---|---|---|
| Professional | Personal Information, Summary, Professional Experience, Skills, Education | Portfolio, Licenses & Certifications, Organizations, Languages, Additional Information |
| Fresh Graduate | Personal Information, Summary, Education, Skills | Organizations, Portfolio, Accomplishments, Licenses & Certifications, Languages, Additional Information |

Usulan default: seluruh add-on pada CV baru dimulai dalam keadaan tidak aktif. CV lama mengaktifkan add-on yang memiliki data bermakna.

## 3. Struktur Data dan Interface TypeScript

Gunakan kontrak berikut di `resources/js/types/cv.ts`:

```ts
export type CVType = 'professional' | 'fresh_graduate';

export type CVSectionKey =
    | 'personal'
    | 'summary'
    | 'work_experience'
    | 'education'
    | 'organizations'
    | 'portfolios'
    | 'accomplishments'
    | 'skills'
    | 'certifications'
    | 'languages'
    | 'additional_info';

export type AddOnSectionKey =
    | 'portfolios'
    | 'certifications'
    | 'accomplishments'
    | 'organizations'
    | 'languages'
    | 'additional_info';

export type EnabledSections = Record<AddOnSectionKey, boolean>;

export interface Language {
    language: string;
    level?: string;
    has_certification: boolean;
    test_name?: string;
    issuing_organization?: string;
    score?: string;
    issue_date?: string;
    expiration_date?: string;
    is_time_limited: boolean;
}

export interface CVCustomFields {
    is_use_photo?: boolean;
    photo_base64?: string | null;
    enabled_sections?: Partial<EnabledSections>;
}
```

Tambahkan ke `CVData`:

```ts
cv_type?: CVType;
custom_fields?: CVCustomFields | null;
```

`level` dipertahankan hanya untuk kompatibilitas data lama. Entri Languages baru tidak wajib mengisinya.

## 4. Struktur File

### File baru

- `resources/js/lib/cv-sections.ts`: sumber tunggal urutan, label, section inti, add-on tersedia, dan default add-on.
- `database/migrations/2026_08_07_000001_add_cv_type_and_language_credentials.php`: menambah tipe CV dan field sertifikasi Languages.
- `tests/Feature/CVTypeAndLanguagePersistenceTest.php`: test persistence, validasi kondisional, fallback, dan retensi data.
- `tests/e2e/cv-type-and-language.spec.ts`: test urutan UI, perpindahan tipe, add-on, Languages, dan preview.

### File yang diubah

- `resources/js/types/cv.ts`
- `resources/js/pages/form-generate.tsx`
- `resources/js/components/cv-format.tsx`
- `resources/js/components/percentage.tsx`
- `resources/js/components/how-to-use.tsx`
- `resources/js/pages/cvs/show.tsx`
- `app/Models/CVData.php`
- `app/Models/CVLanguage.php`
- `app/Http/Requests/CVDataRequest.php`
- `app/Http/Controllers/CVDataController.php`
- Fixture dan test lama yang mengasumsikan satu urutan atau struktur `language + level` saja.

---

### Task 1: Kunci kontrak database dan persistence dengan test

**Files:**
- Create: `tests/Feature/CVTypeAndLanguagePersistenceTest.php`
- Reference: `tests/Feature/CVDataPersistenceTest.php`
- Reference: `tests/Feature/CVDataRelationalAggregateTest.php`

**Interfaces:**
- Consumes: endpoint `POST /cvs`, `PUT /cvs/{cv}`, dan payload aggregate CV yang sudah ada.
- Produces: kontrak test untuk `cv_type`, `custom_fields.enabled_sections`, dan field Languages baru.

- [ ] **Step 1: Tulis test persistence tipe dan Languages bersertifikat**

Payload test harus memuat:

```php
'cv_type' => 'fresh_graduate',
'languages' => [[
    'language' => 'English',
    'level' => null,
    'has_certification' => true,
    'test_name' => 'IELTS',
    'issuing_organization' => 'British Council',
    'score' => '8.0',
    'issue_date' => '2026-01',
    'expiration_date' => '2028-01',
    'is_time_limited' => true,
]],
'custom_fields' => [
    'is_use_photo' => false,
    'photo_base64' => null,
    'enabled_sections' => [
        'portfolios' => false,
        'certifications' => false,
        'accomplishments' => true,
        'organizations' => true,
        'languages' => true,
        'additional_info' => false,
    ],
],
```

Test harus memastikan nilai kembali melalui halaman show dan tersimpan pada tabel yang tepat.

- [ ] **Step 2: Tulis test Languages tanpa sertifikasi**

Kirim hanya:

```php
'languages' => [[
    'language' => 'English',
    'has_certification' => false,
    'is_time_limited' => false,
]],
```

Expected: request diterima tanpa `level`, nama tes, penerbit, skor, issue date, dan expiration date.

- [ ] **Step 3: Tulis test validasi kondisional**

Sediakan data provider untuk memastikan request ditolak ketika `has_certification=true` dan salah satu field berikut kosong:

- `test_name`
- `issuing_organization`
- `score`
- `issue_date`
- `expiration_date` ketika `is_time_limited=true`

Tambahkan kasus expiration lebih awal dari issue date dan pastikan `expiration_date` mendapat error validasi.

- [ ] **Step 4: Tulis test retensi section tersembunyi**

Buat CV Professional dengan Professional Experience terisi. Update menjadi Fresh Graduate dengan data Professional Experience yang sama tetapi metadata visibilitas tipe baru. Pastikan child row Professional Experience tetap ada setelah update.

- [ ] **Step 5: Jalankan test untuk membuktikan kondisi awal gagal**

Run:

```powershell
php artisan test --filter=CVTypeAndLanguagePersistenceTest
```

Expected: FAIL karena kolom dan validasi baru belum tersedia.

---

### Task 2: Tambahkan schema dan model minimal

**Files:**
- Create: `database/migrations/2026_08_07_000001_add_cv_type_and_language_credentials.php`
- Modify: `app/Models/CVData.php`
- Modify: `app/Models/CVLanguage.php`

**Interfaces:**
- Consumes: kontrak payload dari Task 1.
- Produces: atribut `CVData::cv_type` serta atribut sertifikasi pada `CVLanguage`.

- [ ] **Step 1: Buat migrasi `cv_data`**

Tambahkan string `cv_type` dengan default `professional`. Gunakan nama tabel `cv_data` pada SQLite dan `cv.cv_data` pada PostgreSQL sesuai pola migrasi yang sudah ada. Existing rows otomatis mendapat nilai `professional`.

- [ ] **Step 2: Buat migrasi `languages`**

Tambahkan:

```php
$table->boolean('has_certification')->default(false);
$table->string('test_name')->nullable();
$table->string('issuing_organization')->nullable();
$table->string('score', 100)->nullable();
$table->date('issue_date')->nullable();
$table->date('expiration_date')->nullable();
$table->boolean('is_time_limited')->default(false);
```

Method `down()` hanya menghapus kolom yang ditambahkan migrasi ini.

- [ ] **Step 3: Perbarui model**

Tambahkan `cv_type` ke `$fillable` pada `CVData`. Tambahkan seluruh field baru ke `$fillable` `CVLanguage`, lalu cast `has_certification` dan `is_time_limited` ke boolean.

- [ ] **Step 4: Jalankan test migrasi dan model terfokus**

Run:

```powershell
php artisan test --filter=CVTypeAndLanguagePersistenceTest
```

Expected: test tidak lagi gagal karena kolom tidak ditemukan; kasus validasi masih gagal sampai Task 3.

- [ ] **Step 5: Commit task**

```powershell
git add database/migrations/2026_08_07_000001_add_cv_type_and_language_credentials.php app/Models/CVData.php app/Models/CVLanguage.php tests/Feature/CVTypeAndLanguagePersistenceTest.php
git commit -m "feat: persist CV type and language credentials"
```

---

### Task 3: Implementasikan normalisasi, validasi, dan fallback backend

**Files:**
- Modify: `app/Http/Requests/CVDataRequest.php`
- Modify: `app/Http/Controllers/CVDataController.php`
- Test: `tests/Feature/CVTypeAndLanguagePersistenceTest.php`

**Interfaces:**
- Consumes: `CVType`, `EnabledSections`, serta format bulan `YYYY-MM` dari browser.
- Produces: data database tanggal `YYYY-MM-01` dan prop Inertia `addOnSections` yang stabil.

- [ ] **Step 1: Tambahkan normalisasi Languages**

Gunakan helper pembersih yang sudah ada di `prepareForValidation()` untuk mengubah `issue_date` dan `expiration_date` dari `YYYY-MM` menjadi `YYYY-MM-01`. Normalisasi `has_certification` dan `is_time_limited` memakai `FILTER_VALIDATE_BOOLEAN` seperti boolean section lain.

- [ ] **Step 2: Tambahkan aturan request**

Aturan minimum:

```php
'cv_type' => ['required', 'in:professional,fresh_graduate'],
'languages.*.language' => ['nullable', 'string', 'max:255'],
'languages.*.level' => ['nullable', 'string', 'max:255'],
'languages.*.has_certification' => ['nullable', 'boolean'],
'languages.*.test_name' => ['nullable', 'required_if:languages.*.has_certification,true', 'string', 'max:255'],
'languages.*.issuing_organization' => ['nullable', 'required_if:languages.*.has_certification,true', 'string', 'max:255'],
'languages.*.score' => ['nullable', 'required_if:languages.*.has_certification,true', 'string', 'max:100'],
'languages.*.issue_date' => ['nullable', 'required_if:languages.*.has_certification,true', 'date'],
'languages.*.expiration_date' => ['nullable', 'date'],
'languages.*.is_time_limited' => ['nullable', 'boolean'],
'custom_fields.enabled_sections' => ['nullable', 'array'],
'custom_fields.enabled_sections.*' => ['boolean'],
```

Tambahkan validasi setelah aturan dasar untuk mewajibkan expiration ketika `has_certification` dan `is_time_limited` bernilai true serta memastikan expiration tidak lebih awal dari issue date.

- [ ] **Step 3: Pertahankan data tersembunyi**

Jangan menghapus relation berdasarkan tipe atau `enabled_sections`. `replaceAllSections()` tetap menyimpan seluruh array yang dikirim, termasuk section yang sedang disembunyikan.

- [ ] **Step 4: Tambahkan fallback CV lama**

Pada action `edit`, tentukan add-on dengan urutan:

1. Gunakan `custom_fields.enabled_sections` jika tersedia.
2. Jika tidak tersedia, aktifkan add-on hanya ketika memiliki data bermakna.
3. Gunakan `professional` ketika `cv_type` kosong.

Pemeriksaan data bermakna tidak boleh hanya memakai `isNotEmpty()` karena child row kosong bukan isi yang valid.

- [ ] **Step 5: Jalankan test backend terfokus**

Run:

```powershell
php artisan test --filter=CVTypeAndLanguagePersistenceTest
```

Expected: PASS.

- [ ] **Step 6: Jalankan regresi persistence**

Run:

```powershell
php artisan test --filter="CVDataPersistenceTest|CVDataRelationalAggregateTest|Phase12IntegrityAndRegressionTest"
```

Expected: PASS tanpa perubahan count atau urutan child row.

- [ ] **Step 7: Commit task**

```powershell
git add app/Http/Requests/CVDataRequest.php app/Http/Controllers/CVDataController.php tests/Feature/CVTypeAndLanguagePersistenceTest.php
git commit -m "feat: validate CV type and language certificates"
```

---

### Task 4: Buat konfigurasi section bersama dan normalisasi frontend

**Files:**
- Create: `resources/js/lib/cv-sections.ts`
- Modify: `resources/js/types/cv.ts`
- Modify: `resources/js/pages/form-generate.tsx`
- Modify: `resources/js/pages/cvs/show.tsx`

**Interfaces:**
- Consumes: `CVType`, `CVSectionKey`, `AddOnSectionKey`, dan `EnabledSections`.
- Produces: `SECTION_ORDER_BY_CV_TYPE`, `AVAILABLE_ADD_ONS_BY_CV_TYPE`, `DEFAULT_ENABLED_SECTIONS`, `getEnabledSections()`, dan `hasMeaningfulSectionData()`.

- [ ] **Step 1: Finalisasi tipe TypeScript**

Tambahkan tipe persis seperti bagian 3. Jangan mengganti nama `work_experience` atau properti section lama.

- [ ] **Step 2: Definisikan konfigurasi urutan**

```ts
export const SECTION_ORDER_BY_CV_TYPE: Record<CVType, CVSectionKey[]> = {
    professional: [
        'personal',
        'summary',
        'work_experience',
        'portfolios',
        'skills',
        'certifications',
        'education',
        'organizations',
        'languages',
        'additional_info',
    ],
    fresh_graduate: [
        'personal',
        'summary',
        'education',
        'organizations',
        'portfolios',
        'accomplishments',
        'skills',
        'certifications',
        'languages',
        'additional_info',
    ],
};
```

Definisikan daftar add-on dalam urutan yang sama dengan bagian 2.

- [ ] **Step 3: Definisikan default add-on**

Seluruh key `EnabledSections` memiliki default `false`. Helper harus menggabungkan default, data localStorage lama, dan metadata server tanpa membuang key yang tidak dikenal secara diam-diam.

- [ ] **Step 4: Normalisasi data localStorage dan server**

Pada `getInitialFormData()` dan `formDataFromCv()`:

- fallback `cv_type` ke `professional`;
- merge setiap item Languages dengan nilai default field baru;
- ubah tanggal database menjadi `YYYY-MM` untuk input month;
- pertahankan `level` lama;
- baca `cvAddOnSections` lama jika metadata baru belum tersedia.

- [ ] **Step 5: Pastikan save menggabungkan metadata**

Payload `custom_fields` harus berisi foto dan `enabled_sections` dalam object yang sama:

```ts
custom_fields: {
    ...(formData.custom_fields ?? {}),
    is_use_photo: formData.is_use_photo,
    photo_base64: photoPreview ?? null,
    enabled_sections: addOnSections,
}
```

- [ ] **Step 6: Jalankan pemeriksaan TypeScript**

Run:

```powershell
pnpm types
```

Expected: PASS tanpa `any` baru untuk data Languages atau konfigurasi section.

- [ ] **Step 7: Commit task**

```powershell
git add resources/js/lib/cv-sections.ts resources/js/types/cv.ts resources/js/pages/form-generate.tsx resources/js/pages/cvs/show.tsx
git commit -m "feat: centralize CV section presets"
```

---

### Task 5: Sesuaikan pemilihan tipe, form, add-on, dan retensi data

**Files:**
- Modify: `resources/js/pages/form-generate.tsx`
- Modify: `resources/js/components/percentage.tsx`
- Test: `tests/e2e/cv-type-and-language.spec.ts`

**Interfaces:**
- Consumes: konfigurasi Task 4.
- Produces: form yang mengikuti tipe serta add-on tanpa menghapus data.

- [ ] **Step 1: Tulis E2E urutan form dan add-on**

Test Professional harus membaca heading/panel form dalam urutan bagian 2.1 dan label checkbox add-on dalam urutan Professional. Test Fresh Graduate harus melakukan hal yang sama menggunakan urutan bagian 2.2.

- [ ] **Step 2: Tulis E2E pergantian tipe dan retensi data**

Skenario:

1. Pilih Professional.
2. Isi satu Professional Experience.
3. Ganti ke Fresh Graduate.
4. Pastikan dialog menyatakan data akan disembunyikan tetapi dipertahankan.
5. Pilih Cancel dan pastikan tipe tidak berubah.
6. Ganti kembali lalu konfirmasi.
7. Kembali ke Professional dan pastikan isi sebelumnya masih ada.

- [ ] **Step 3: Jalankan E2E untuk membuktikan kondisi awal gagal**

Run:

```powershell
pnpm exec playwright test tests/e2e/cv-type-and-language.spec.ts
```

Expected: FAIL karena pemilih tipe dan urutan dinamis belum tersedia.

- [ ] **Step 4: Tambahkan pemilih tipe**

Tempatkan setelah CV Name dan sebelum Personal Information. Gunakan native radio input dengan label:

- `Professional — I have professional work experience`
- `Fresh Graduate / Career Switcher / Student — I do not want to feature professional experience`

- [ ] **Step 5: Tambahkan dialog konfirmasi bersyarat**

Dialog hanya tampil bila pergantian tipe akan menyembunyikan section yang memiliki data bermakna. Tombol `Cancel` tidak mengubah state. Tombol `Change Type` hanya mengubah tipe dan visibilitas; jangan mengubah array data.

- [ ] **Step 6: Hentikan pengosongan data oleh toggle add-on**

Hapus seluruh cabang reset data dari `handleAddOnChange`. Handler hanya mengubah boolean `addOnSections[name]`.

- [ ] **Step 7: Render daftar add-on sesuai tipe**

Map `AVAILABLE_ADD_ONS_BY_CV_TYPE[formData.cv_type]`. Dengan ini urutan checkbox mengikuti tipe dan add-on yang tidak didukung tidak muncul.

- [ ] **Step 8: Render panel form sesuai urutan tipe**

Pisahkan Summary dari panel Personal Information. Gunakan urutan konfigurasi untuk menentukan posisi panel, termasuk panel add-on di tengah section inti. DOM harus sama dengan urutan visual agar urutan keyboard benar.

- [ ] **Step 9: Sesuaikan progress form**

`FormProgress` hanya menghitung section inti tipe aktif dan add-on aktif, lalu menampilkan detail dalam urutan konfigurasi. Languages hanya menghitung `language` untuk entri tanpa sertifikasi dan menghitung field sertifikasi wajib ketika `has_certification=true`.

- [ ] **Step 10: Jalankan E2E terfokus**

Run:

```powershell
pnpm exec playwright test tests/e2e/cv-type-and-language.spec.ts
```

Expected: test urutan, dialog, dan retensi data PASS.

- [ ] **Step 11: Commit task**

```powershell
git add resources/js/pages/form-generate.tsx resources/js/components/percentage.tsx tests/e2e/cv-type-and-language.spec.ts
git commit -m "feat: adapt CV form sections by type"
```

---

### Task 6: Implementasikan form Languages kondisional

**Files:**
- Modify: `resources/js/pages/form-generate.tsx`
- Test: `tests/e2e/cv-type-and-language.spec.ts`

**Interfaces:**
- Consumes: interface `Language` dari Task 4 dan validasi backend Task 3.
- Produces: payload Languages dengan sertifikasi opsional dan expiration yang mengikuti pola certificate.

- [ ] **Step 1: Tambahkan E2E tanpa sertifikasi**

Isi `Language = English`, biarkan checkbox sertifikasi tidak aktif, lalu pastikan form dapat disimpan/dipreview tanpa proficiency dan detail formal.

- [ ] **Step 2: Tambahkan E2E dengan sertifikasi**

Aktifkan checkbox sertifikasi dan pastikan field berikut muncul:

- Test or Certification Name
- Issuing Organization
- Score
- Issue Date
- Expiration Date
- This test or certification has an expiration date

- [ ] **Step 3: Implementasikan kondisi form**

Setiap Language selalu menampilkan nama bahasa dan checkbox `I have a test result or certification for this language`. Field formal hanya dirender ketika `has_certification=true`.

- [ ] **Step 4: Samakan expiration dengan Licenses & Certifications**

Gunakan:

```tsx
<input type="month" name="issue_date" />
<input
    type="month"
    name="expiration_date"
    disabled={!language.is_time_limited}
/>
```

Checkbox `is_time_limited` menggunakan label `This test or certification has an expiration date`. Expiration wajib di UI hanya ketika checkbox aktif.

- [ ] **Step 5: Pertahankan nilai tersembunyi di state**

Mematikan `has_certification` atau `is_time_limited` tidak mengosongkan field terkait. Renderer dan validator mengabaikan nilai tersebut selama kondisinya tidak aktif; mengaktifkan kembali checkbox memulihkan input sebelumnya.

- [ ] **Step 6: Jalankan E2E Languages**

Run:

```powershell
pnpm exec playwright test tests/e2e/cv-type-and-language.spec.ts --grep "Languages"
```

Expected: seluruh skenario Languages PASS.

- [ ] **Step 7: Commit task**

```powershell
git add resources/js/pages/form-generate.tsx tests/e2e/cv-type-and-language.spec.ts
git commit -m "feat: add optional language credentials"
```

---

### Task 7: Sesuaikan preview, halaman tersimpan, PDF, dan seluruh copy

**Files:**
- Modify: `resources/js/components/cv-format.tsx`
- Modify: `resources/js/pages/cvs/show.tsx`
- Modify: `resources/js/pages/form-generate.tsx`
- Modify: `resources/js/components/how-to-use.tsx`
- Test: `tests/e2e/cv-type-and-language.spec.ts`
- Test: `tests/e2e/cv-preview-pagination.spec.ts`

**Interfaces:**
- Consumes: urutan section, `cv_type`, `enabled_sections`, dan data Languages.
- Produces: semantic blocks dalam urutan yang sama untuk preview dan PDF.

- [ ] **Step 1: Tambahkan assertion urutan preview**

Untuk masing-masing tipe, ambil heading preview dari DOM dan bandingkan dengan urutan aktif yang ditetapkan pada bagian 2. Section tidak aktif dan section yang tidak didukung tipe tidak boleh muncul.

- [ ] **Step 2: Render semantic block berdasarkan konfigurasi**

Ubah `buildSemanticBlocks()` agar setiap section memiliki builder, kemudian panggil builder berdasarkan `SECTION_ORDER_BY_CV_TYPE[data.cv_type ?? 'professional']`. Jangan menduplikasi seluruh renderer untuk dua tipe.

- [ ] **Step 3: Terapkan visibilitas section**

Preview form menerima `addOnSections`; halaman show membaca `custom_fields.enabled_sections`. Section inti mengikuti tipe, sementara add-on hanya dibangun saat aktif.

- [ ] **Step 4: Perbaiki gate array**

Gunakan item hasil filter yang memiliki isi, bukan syarat `data.section[0]`. Item pertama kosong tidak boleh menyembunyikan item berikutnya yang valid.

- [ ] **Step 5: Render Languages**

Aturan tampilan:

- Tanpa sertifikasi dan tanpa legacy level: `English`.
- Tanpa sertifikasi dengan legacy level: `English — Full professional proficiency` atau label level lama yang setara.
- Dengan sertifikasi: nama bahasa, nama tes, issuing organization, score, issue month/year, dan expiration month/year.
- Jika `is_time_limited=false`, tampilkan `No Expiration Date`.

- [ ] **Step 6: Konsistenkan label**

Ganti seluruh copy pengguna:

- `Work Experience` menjadi `Professional Experience`.
- `Certifications` menjadi `Licenses & Certifications` untuk heading section.
- `Additional Info` menjadi `Additional Information`.

Key internal, class model, tabel, dan relasi tidak diubah.

- [ ] **Step 7: Perbarui placeholder dan helper**

Gunakan placeholder Additional Information persis:

```text
Include any final professional details, such as work availability, relocation preferences, or technical publications.
```

Tambahkan helper berikut pada Education, Portfolio, Accomplishments, Organizations, dan Additional Information:

```text
Use bullet points for better readability.
```

Untuk Additional Information, gunakan helper terpisah agar placeholder tetap persis. Untuk empat section lain, gabungkan ke placeholder deskripsi yang ada dengan tanda titik dan spasi agar tidak berulang.

- [ ] **Step 8: Jalankan test preview dan pagination**

Run:

```powershell
pnpm exec playwright test tests/e2e/cv-type-and-language.spec.ts tests/e2e/cv-preview-pagination.spec.ts
```

Expected: urutan, visibilitas, Languages, satu halaman, dan multipage PASS.

- [ ] **Step 9: Commit task**

```powershell
git add resources/js/components/cv-format.tsx resources/js/pages/cvs/show.tsx resources/js/pages/form-generate.tsx resources/js/components/how-to-use.tsx tests/e2e/cv-type-and-language.spec.ts tests/e2e/cv-preview-pagination.spec.ts
git commit -m "feat: render CV sections by selected type"
```

---

### Task 8: Verifikasi akhir dan regression matrix

**Files:**
- Modify only if a verified failure requires a scoped correction.
- Test: seluruh test backend dan frontend yang relevan.

**Interfaces:**
- Consumes: seluruh hasil Task 1-7.
- Produces: bukti bahwa kontrak rencana terpenuhi tanpa regresi yang diketahui.

- [ ] **Step 1: Jalankan TypeScript dan format check**

```powershell
pnpm types
pnpm format:check
```

Expected: kedua perintah exit code 0.

- [ ] **Step 2: Jalankan seluruh backend test**

```powershell
php artisan test
```

Expected: 0 failed.

- [ ] **Step 3: Jalankan E2E terfokus**

```powershell
pnpm exec playwright test tests/e2e/cv-type-and-language.spec.ts tests/e2e/cv-preview-pagination.spec.ts tests/e2e/cv-phase12-regression-matrix.spec.ts
```

Expected: 0 failed.

- [ ] **Step 4: Verifikasi manual data retention**

Gunakan CV test, bukan data pengguna nyata:

1. Isi seluruh section Professional.
2. Matikan satu add-on dan aktifkan kembali.
3. Pastikan nilai kembali tanpa perubahan.
4. Ganti ke Fresh Graduate dan konfirmasi.
5. Simpan lalu buka ulang.
6. Kembali ke Professional.
7. Pastikan Professional Experience dan add-on lama tetap ada.

- [ ] **Step 5: Verifikasi manual Languages**

Periksa tiga kasus:

1. Nama bahasa saja.
2. Data lama dengan proficiency.
3. Sertifikasi dengan expiration serta tanpa expiration.

Pastikan form, preview, halaman show, dan PDF konsisten.

- [ ] **Step 6: Audit copy lama**

Run:

```powershell
rg -n -i --glob '!public/**' --glob '!node_modules/**' --glob '!vendor/**' "work experience|additional info|certifications" resources/js
```

Expected: tidak ada copy pengguna yang masih memakai label lama; nama key internal dan referensi teknis boleh tetap muncul.

- [ ] **Step 7: Commit koreksi verifikasi jika ada**

Commit hanya file yang memang diperbaiki berdasarkan kegagalan terverifikasi, dengan pesan yang menjelaskan regresi spesifik.

---

## 5. Strategi Backward Compatibility

### Database lama

- Existing CV mendapat `cv_type=professional` melalui default/backfill migrasi.
- Kolom Languages baru nullable atau default false.
- Nilai `language` dan `level` lama tidak diubah.
- Tidak ada child row yang dihapus oleh migrasi.

### localStorage lama

- Tidak ada `cv_type` berarti `professional`.
- Tidak ada field Languages baru berarti string kosong atau false.
- `cvAddOnSections` lama tetap dibaca.
- Save berikutnya menulis `custom_fields.enabled_sections` tanpa membutuhkan migrasi localStorage khusus.
- JSON rusak kembali ke default form yang aman.

### CV tersimpan tanpa metadata visibilitas

- Inferensikan add-on aktif dari data bermakna.
- Jangan menganggap row kosong sebagai add-on aktif.
- Metadata eksplisit ditulis pada save berikutnya.

## 6. Risiko dan Edge Case

1. Handler add-on saat ini mengosongkan data; perubahan retensi harus selesai sebelum pergantian tipe dirilis.
2. `custom_fields` saat ini dibentuk ulang saat save; metadata foto dan visibilitas harus digabung agar tidak saling menimpa.
3. Backend mengganti seluruh child row saat update; payload harus tetap membawa section tersembunyi.
4. Item pertama array dapat kosong sementara item berikutnya valid; preview harus memfilter seluruh array.
5. Pergantian tipe berulang tidak boleh menggandakan atau mengurutkan ulang item di dalam section.
6. Tanggal database `YYYY-MM-DD` harus diubah menjadi `YYYY-MM` untuk native month input.
7. Nilai expiration boleh tetap berada di state ketika checkbox dimatikan, tetapi validator dan preview harus mengabaikannya.
8. CV lama dengan `level` harus tetap terbaca walaupun field proficiency tidak diwajibkan untuk data baru.
9. Detail Languages dapat menambah tinggi section dan memengaruhi pagination; regression test multipage wajib dijalankan.
10. Urutan DOM harus sama dengan urutan visual agar navigasi keyboard dan screen reader benar.

## 7. Approval Gate Sebelum Implementasi

Konfirmasi keputusan berikut sebelum Task 1 dimulai:

1. Seluruh add-on CV baru default tidak aktif.
2. Organizations pada Fresh Graduate tetap add-on opsional, bukan section inti.
3. Accomplishments tidak tersedia pada Professional.
4. Professional Experience tidak tersedia sebagai add-on pada Fresh Graduate.
5. Proficiency tidak diwajibkan dan tidak ditampilkan untuk entri Languages baru; nilai lama tetap ditampilkan di preview.
6. Dialog konfirmasi hanya muncul ketika pergantian tipe menyembunyikan section yang memiliki data.

## 8. Definition of Done

- Kedua tipe dapat dipilih dan disimpan.
- Urutan checkbox add-on, panel form, progress, preview, halaman show, dan PDF sesuai kontrak tipe.
- Mengganti tipe atau mematikan add-on tidak menghapus data.
- Label Professional Experience konsisten pada seluruh copy pengguna.
- Languages mendukung nama saja dan sertifikasi formal.
- Expiration Languages mengikuti perilaku Licenses & Certifications.
- Placeholder dan helper bullet points sesuai teks yang disepakati.
- Data database dan localStorage lama tetap dapat dibuka.
- TypeScript, backend test, dan E2E relevan lulus.

