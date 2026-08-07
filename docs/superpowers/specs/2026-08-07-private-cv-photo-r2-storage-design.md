# Private CV Photo Storage with R2 Fallback Design

**Tanggal:** 2026-08-07
**Status:** Disetujui untuk dilanjutkan ke implementation plan setelah review dokumen

## Tujuan

Memperbaiki penyimpanan profile photo CV agar pilihan `Include Profile Photo` dan file foto bertahan setelah CV disimpan, sekaligus memindahkan foto dari base64 di database ke file private yang dapat berada di Cloudflare R2 atau storage lokal.

Hanya pemilik CV yang boleh membaca foto melalui aplikasi. Perubahan nilai `R2_ENABLED` hanya memengaruhi upload baru dan tidak boleh memutus akses ke foto yang sudah tersimpan.

## Akar Masalah Saat Ini

Frontend sudah mengirim `custom_fields.is_use_photo` dan `custom_fields.photo_base64`. Namun, `CVDataRequest` hanya mempunyai nested validation rules untuk `custom_fields.enabled_sections`. Laravel mengembalikan hanya data tervalidasi kepada controller, sehingga nilai flag dan foto tidak ikut disimpan. Halaman show kemudian menerima `custom_fields` tanpa data foto dan merender CV seperti tanpa profile photo.

## Keputusan Utama

- Metadata foto tetap disimpan di `cv_data.custom_fields`; tidak ada tabel atau kolom foto baru.
- Storage lokal menggunakan disk private `local`, bukan disk `public`.
- R2 menggunakan disk private `r2` yang kompatibel dengan S3.
- Browser tidak menerima URL object, path storage, atau kredensial R2.
- Metadata internal foto dibuang dari props Inertia sebelum CV dikirim ke browser.
- Foto hanya dibaca melalui endpoint aplikasi yang memverifikasi autentikasi dan kepemilikan CV.
- `R2_ENABLED=true` membuat upload mencoba R2 terlebih dahulu dan otomatis fallback ke `local` jika R2 gagal.
- `R2_ENABLED=false` membuat upload baru langsung masuk ke `local`.
- Disk aktual selalu disimpan per foto sehingga perubahan konfigurasi tidak memengaruhi foto lama.
- Mematikan `Include Profile Photo` hanya menyembunyikan foto.
- Tombol `Hapus Foto` menghapus file secara permanen dan mengosongkan metadata.
- CV hasil duplikasi memperoleh salinan file tersendiri.
- Base64 lama dimigrasikan melalui perintah aplikasi yang aman dijalankan ulang, bukan melalui database migration.

## Konfigurasi

`.env.example` akan mendokumentasikan konfigurasi berikut:

```dotenv
R2_ENABLED=false
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
R2_REGION=auto
```

`config/filesystems.php` akan menambahkan disk `r2` dengan driver `s3`, visibility private, dan kredensial khusus R2. Nilai `R2_ENABLED` dibaca melalui config Laravel agar tetap kompatibel dengan config cache.

Laravel membutuhkan `league/flysystem-aws-s3-v3` sebagai adapter S3. Dependency ini ditambahkan karena belum menjadi dependency runtime aplikasi.

## Kontrak Metadata

`custom_fields` mempertahankan `enabled_sections` dan menggunakan metadata foto berikut:

```json
{
  "is_use_photo": true,
  "photo_disk": "r2",
  "photo_path": "cv-photos/<cv-uuid>/<random-name>.jpg",
  "photo_mime": "image/jpeg",
  "enabled_sections": {}
}
```

Aturan metadata:

- `photo_disk` hanya bernilai `local` atau `r2`.
- `photo_path` adalah path internal dan tidak diserialisasi sebagai URL publik.
- `photo_mime` hanya bernilai MIME upload yang diizinkan.
- `is_use_photo` mengatur render, bukan keberadaan file.
- Ketika tidak ada foto, seluruh `photo_*` bernilai tidak ada atau `null` dan `is_use_photo=false`.
- `photo_base64` hanya didukung sementara sebagai input migrasi data lama dan dihapus setelah migrasi record berhasil.

Metadata tersebut adalah kontrak persistence server, bukan kontrak response frontend. Sebelum model dikirim melalui Inertia, backend menghapus `photo_disk`, `photo_path`, `photo_mime`, dan `photo_base64` dari `custom_fields`. Frontend hanya menerima `is_use_photo`, `enabled_sections`, `has_photo`, dan `photo_url`, dengan `photo_url` selalu menunjuk route private aplikasi.

## Alur Upload dan Save

Frontend mengirim file menggunakan multipart form data. JPEG dan PNG diterima dengan ukuran maksimal 5 MB. Backend memvalidasi MIME berdasarkan isi file, bukan hanya ekstensi.

Untuk CV baru, record CV harus tersedia agar path dapat memakai UUID CV. Backend lalu:

1. Memilih tujuan utama berdasarkan `R2_ENABLED`.
2. Menulis file ke R2 bila aktif.
3. Jika penulisan R2 gagal, menulis file yang sama ke `local`.
4. Menyimpan disk, path, MIME, dan flag pada `custom_fields` hanya setelah file berhasil ditulis.
5. Mengembalikan error bila R2 dan local sama-sama gagal; CV tidak boleh menyimpan metadata yang menunjuk file yang tidak ada.

Untuk update tanpa file baru, metadata foto lama dipertahankan. Nilai `is_use_photo` boleh berubah tanpa menyalin atau menghapus file.

Untuk update dengan file baru:

1. File baru ditulis terlebih dahulu.
2. Metadata CV diperbarui dalam transaksi database.
3. File lama dihapus setelah update database berhasil.
4. Jika database gagal, file baru dibersihkan dan file lama tetap dipertahankan.
5. Kegagalan menghapus file lama dilaporkan ke log tanpa membatalkan metadata baru yang sudah valid; file yatim dapat dibersihkan secara operasional.

Alur save baru, update, dan pending-save setelah login menggunakan kontrak multipart yang sama. Untuk guest, preview boleh tetap berada sebagai data URL di localStorage sampai login. Ketika pending-save dijalankan, data URL diubah kembali menjadi file multipart dan localStorage dibersihkan setelah save berhasil.

## Akses Foto Private

Endpoint read memakai route berautentikasi pada CV, misalnya `GET /cvs/{cv}/photo`.

Alurnya:

1. Route model binding memuat CV.
2. Backend memverifikasi CV adalah milik pengguna aktif.
3. Backend membaca `photo_disk` dan `photo_path` dari model, bukan dari query browser.
4. File dialirkan dari disk aktual dengan `Content-Type` yang tervalidasi dan header cache private.
5. CV milik pengguna lain, metadata tidak valid, atau file tidak ditemukan menghasilkan `404` tanpa membocorkan detail storage.

Untuk record legacy yang belum mempunyai `photo_path` tetapi masih mempunyai base64 valid, endpoint yang sama mendekode dan mengalirkan foto dari server. Base64 tidak pernah dikirim sebagai prop Inertia. Fallback legacy ini dihapus setelah seluruh data selesai dimigrasikan pada pekerjaan terpisah yang terverifikasi.

Halaman edit dan show hanya memakai `photo_url` private tersebut sebagai `src`. R2 bucket dan storage lokal tidak mempunyai URL publik untuk foto CV.

## Hide dan Hapus Foto

Mematikan checkbox `Include Profile Photo` hanya menyimpan `is_use_photo=false`. File dan metadata lokasi tetap ada agar pengguna dapat mengaktifkannya kembali tanpa upload ulang.

Tombol `Hapus Foto`:

- Meminta konfirmasi pengguna.
- Untuk foto yang belum disimpan, hanya membersihkan file/preview lokal.
- Untuk foto tersimpan, memanggil endpoint delete yang memverifikasi kepemilikan.
- Menghapus object dari disk aktual.
- Mengosongkan `photo_disk`, `photo_path`, `photo_mime`, dan `photo_base64`.
- Menetapkan `is_use_photo=false`.
- Jika penghapusan storage gagal, metadata tidak dihapus dan endpoint mengembalikan error agar referensi tidak hilang secara diam-diam.

## Duplikasi dan Penghapusan Entitas

Duplikasi CV menyalin file sumber ke path unik. Tujuan salinan mengikuti konfigurasi upload saat itu: R2 bila aktif, dengan fallback local. Metadata CV hasil duplikasi menunjuk salinan tersebut. Menghapus atau mengganti foto pada satu CV tidak memengaruhi CV lainnya.

Jika penyalinan file gagal pada kedua disk, proses duplikasi gagal dan record duplikat tidak dipertahankan. Jika record database gagal setelah salinan dibuat, salinan baru dibersihkan.

Saat CV dihapus, backend menghapus file foto pada disk aktual sebelum menghapus record. Jika file tidak dapat dihapus, penghapusan CV gagal agar object private tidak menjadi yatim tanpa referensi.

Saat akun dihapus, seluruh file foto CV milik pengguna dibersihkan sebelum database menjalankan cascade delete. Kegagalan salah satu penghapusan storage membatalkan penghapusan akun dan mempertahankan record agar operasi dapat dicoba ulang.

## Migrasi Base64 Lama

Perintah aplikasi khusus memproses record yang masih mempunyai `custom_fields.photo_base64`:

1. Record diproses dalam batch agar penggunaan memori terkendali.
2. Data URL didekode dengan validasi base64, MIME JPEG/PNG, dan batas ukuran 5 MB.
3. File ditulis ke R2 bila aktif, dengan fallback local.
4. Metadata disk/path/MIME disimpan dan `photo_base64` dihapus hanya setelah penulisan berhasil.
5. Record invalid atau gagal ditulis tidak diubah dan dilaporkan dengan ID CV serta alasan.
6. Record yang sudah mempunyai `photo_path` dilewati sehingga perintah idempotent dan aman dijalankan ulang.

Tidak ada akses publik sementara untuk base64 lama. Sebelum berhasil dimigrasikan, data tersebut hanya dialirkan melalui endpoint foto private kepada pemilik CV dan tidak ikut dalam props halaman.

## Batas Komponen

Satu service storage foto CV menjadi jalur bersama untuk:

- menentukan disk utama dan fallback;
- menyimpan upload atau data hasil decode;
- menyalin foto ketika CV diduplikasi;
- menghapus foto;
- membaca stream foto.

Service dibenarkan karena dipakai oleh save/update, endpoint read/delete, duplicate, penghapusan CV/akun, dan command migrasi. Controller tetap bertanggung jawab atas authorization dan orchestration; service tidak menerima pilihan disk/path dari browser.

## Penanganan Error dan Observability

- Kegagalan R2 dicatat sebelum fallback local dilakukan.
- Fallback yang berhasil dicatat bersama CV ID dan disk aktual tanpa mencatat isi file atau kredensial.
- Error ke browser tidak menyebut bucket, endpoint, path internal, atau kredensial.
- Operasi cleanup yang gagal dicatat dengan CV ID, disk, dan path internal untuk penanganan operator.
- Storage memakai mode exception agar kegagalan write/delete dapat dibedakan dari hasil sukses.

## Strategi Pengujian

Feature tests menggunakan fake disk atau fake service yang terkontrol untuk membuktikan:

- upload masuk local ketika R2 nonaktif;
- upload masuk R2 ketika aktif;
- kegagalan R2 otomatis fallback local;
- kegagalan kedua disk tidak menyimpan metadata rusak;
- pemilik dapat membaca foto dan pengguna lain menerima `404`;
- props Inertia tidak membocorkan disk, path, MIME internal, atau base64;
- endpoint private dapat membaca base64 legacy tanpa mengirim base64 pada props;
- perubahan `R2_ENABLED` tidak memengaruhi pembacaan foto yang sudah ada;
- toggle off menyembunyikan tanpa menghapus file;
- tombol hapus membersihkan file dan metadata;
- replace mempertahankan foto lama pada kegagalan dan menghapusnya setelah sukses;
- delete CV dan delete user membersihkan file;
- duplicate membuat path dan file terpisah;
- command migrasi berhasil, melewati record selesai, dan mempertahankan record gagal;
- nested validation menyimpan `is_use_photo` serta metadata foto yang sah.

Satu browser test mencakup alur utama: pilih foto, aktifkan include, simpan CV, buka halaman CV, dan pastikan foto tampil melalui endpoint private. Regression test memastikan save/show CV tanpa foto tetap berfungsi.

## Batas Scope

- Satu CV hanya memiliki satu foto aktif.
- Tidak ada histori foto, gallery, image CDN publik, signed URL langsung, image optimization service, atau background queue.
- Tidak ada sinkronisasi otomatis file lama antar-disk ketika `R2_ENABLED` berubah.
- Tidak ada fallback saat membaca foto: pembacaan selalu memakai `photo_disk` yang tersimpan agar kegagalan tidak ditutupi oleh object berbeda.
- Tidak ada perubahan pada gambar avatar akun Google karena fitur tersebut berada di luar scope profile photo CV.

## Kriteria Selesai

- Foto dan nilai include bertahan setelah save/update.
- Foto tampil pada edit, show, preview, dan PDF ketika `is_use_photo=true`.
- Foto tidak tampil tetapi tetap tersimpan ketika `is_use_photo=false`.
- Foto hanya dapat dibaca oleh pemilik CV melalui aplikasi.
- Upload baru mengikuti R2 aktif dengan fallback local.
- Foto lama tetap dapat dibaca setelah `R2_ENABLED` berubah.
- Hapus, replace, duplicate, delete CV, delete user, dan migrasi base64 menjaga konsistensi file serta metadata.
- Seluruh test terarah lulus tanpa mengubah perilaku CV tanpa foto.
