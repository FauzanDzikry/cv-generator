# PDF Generation Progress Dialog Design

**Tanggal:** 12 Agustus 2026  
**Status:** Disetujui secara konseptual, menunggu tinjauan dokumen  
**Ruang lingkup:** Frontend halaman generate CV

## Tujuan

Menampilkan modal loading dengan persentase berbasis tahapan nyata ketika pengguna menekan **Generate PDF**, sehingga pengguna mengetahui proses masih berjalan dan tidak memulai generate kedua.

Persentase adalah penanda milestone proses, bukan estimasi durasi, byte, atau jumlah halaman. Desain tidak mengubah isi, layout, nama file, atau mekanisme download PDF yang sudah aktif.

## Kondisi Saat Ini

- `resources/js/pages/form-generate.tsx` menjalankan seluruh alur di `handleGeneratePDF()`.
- Alur aktif memvalidasi export element, menunggu font, menunggu dan decode gambar, menunggu layout stabil, memuat `html2pdf.js`, lalu menjalankan `.set().from().save()`.
- State `isGeneratingPDF` hanya menonaktifkan tombol dan mengganti teks tombol menjadi `Generating...`.
- `html2pdf.js` mempunyai progress tracking internal yang belum menyediakan callback persentase publik yang stabil. Karena itu, UI tidak boleh mengklaim progress render kontinu yang tidak dapat diukur.
- Terdapat cleanup DOM lama untuk elemen dengan ID `pdf-loading-overlay`, walaupun alur aktif tidak lagi membuat overlay tersebut.

## Keputusan Desain

### 1. Model progress

Gunakan satu state progress sebagai sumber status generate PDF. State bernilai `null` ketika tidak ada proses dan berisi tahap, persentase, serta pesan ketika proses berjalan.

| Persentase | Tahap | Kondisi untuk berpindah tahap |
|---:|---|---|
| 5% | Memulai proses PDF | Export element tersedia dan proses dimulai |
| 20% | Menyiapkan font | Penantian `document.fonts.ready` selesai atau ditoleransi sesuai perilaku saat ini |
| 40% | Memuat gambar | Seluruh gambar selesai load/decode atau error gambar sudah ditoleransi |
| 55% | Menyiapkan dokumen | Penantian stabilisasi layout selesai dan opsi PDF siap |
| 70% | Memuat generator PDF | Dynamic import `html2pdf.js` selesai |
| 90% | Membuat file PDF | Worker siap menjalankan `.set().from().save()` |
| 100% | PDF berhasil dibuat | Promise `.save()` selesai dan permintaan download berhasil dipicu |

Progress hanya bergerak maju. Status 100% ditampilkan singkat sekitar 300–500 ms agar hasil akhir terlihat, lalu modal ditutup otomatis.

### 2. Modal

Buat komponen presentasional khusus di `resources/js/components/pdf-generation-dialog.tsx`. Komponen menerima:

- `open: boolean`
- `percentage: number`
- `message: string`

Komponen menggunakan dialog Radix yang sudah terpasang melalui `resources/js/components/ui/dialog.tsx`; tidak ada dependency baru.

Isi modal:

- judul `Generating PDF`
- pesan tahap aktif
- spinner sebagai penanda aktivitas
- progress bar visual
- angka persentase

Progress bar memiliki `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, dan `aria-valuenow` sesuai state. Judul dan deskripsi dialog tetap tersedia bagi pembaca layar.

Modal bersifat non-dismissible selama proses:

- tidak menampilkan tombol X
- klik backdrop tidak menutup modal
- tombol Escape tidak menutup modal
- focus trap tetap ditangani Radix

Untuk mendukung kebutuhan ini tanpa memengaruhi dialog lain, `DialogContent` memperoleh properti opsional `showCloseButton` dengan default `true`. Modal PDF mengirim `false`; seluruh pemakai lama mempertahankan perilaku sekarang.

### 3. Integrasi alur generate

Di `form-generate.tsx`:

- Ganti state boolean `isGeneratingPDF` dengan satu state progress atau turunkan nilai `isGeneratingPDF` dari keberadaan state progress. Jangan mempertahankan dua state yang dapat tidak sinkron.
- Perbarui progress tepat sebelum atau setelah setiap operasi asynchronous sesuai tabel milestone.
- Tombol **Generate PDF** disabled selama state progress tidak `null`.
- Render `PdfGenerationDialog` satu kali di React tree; jangan membuat atau menghapus modal melalui `document.createElement()`.
- Setelah sukses, set 100%, catat event Google Analytics seperti sekarang, tunggu sebentar, lalu reset state ke `null`.
- Hapus `cleanupAllOverlays()` dan cleanup ID `pdf-loading-overlay` yang tidak lagi memiliki produsen.

Validasi awal ketika `cvRef.current` tidak tersedia tetap memakai pesan yang ada dan tidak membuka modal karena proses belum dapat dimulai.

### 4. Penanganan kegagalan

Jika salah satu tahapan melempar error yang tidak ditoleransi:

1. Log error melalui `console.error` seperti perilaku sekarang.
2. Reset state progress agar modal ditutup dan tombol aktif kembali.
3. Tampilkan pesan kesalahan generate PDF yang sudah ada.
4. Jangan mengirim event analytics sukses.

Error font ready dan decode gambar tetap ditoleransi seperti implementasi aktif agar perubahan UI tidak mengubah kontrak generate PDF.

### 5. Pengujian

Perluas `tests/e2e/cv-preview-pagination.spec.ts` karena file tersebut sudah menguji alur download PDF yang sebenarnya.

Skenario sukses harus memverifikasi:

- klik **Generate PDF** membuka dialog `Generating PDF`
- dialog mempunyai progress bar dengan nilai antara 0 dan 100
- tombol generate disabled selama proses
- download tetap bernama `.pdf`, tidak kosong, dan ber-header `%PDF`
- setelah download dipicu, progress mencapai 100%
- modal akhirnya tertutup dan tombol kembali aktif
- jumlah halaman preview dan export tetap sama seperti kontrak sekarang

Skenario gagal harus memaksa kegagalan render PDF secara deterministik di browser test, lalu memverifikasi:

- modal ditutup
- pesan kesalahan tampil
- tombol generate aktif kembali
- tidak ada download sukses

Pengujian tidak perlu mengandalkan kecepatan timer untuk milestone antara 5% dan 90%; yang diuji adalah modal aktif selama pekerjaan, rentang progress valid, penyelesaian 100%, dan cleanup pada kedua jalur akhir.

## File yang Direncanakan

| File | Perubahan |
|---|---|
| `resources/js/pages/form-generate.tsx` | State milestone, integrasi modal, lifecycle sukses/gagal, dan penghapusan cleanup overlay lama |
| `resources/js/components/pdf-generation-dialog.tsx` | Komponen modal progress khusus PDF |
| `resources/js/components/ui/dialog.tsx` | Properti kompatibel `showCloseButton` |
| `tests/e2e/cv-preview-pagination.spec.ts` | Regression test jalur sukses dan gagal |

## Di Luar Ruang Lingkup

- Progress berbasis timer atau animasi persentase semu.
- Callback progress internal atau fork `html2pdf.js`.
- Perubahan backend, database, payload CV, pagination, layout, kualitas, atau filename PDF.
- Tombol cancel; proses `html2canvas`/`html2pdf.js` saat ini tidak mempunyai pembatalan aman yang dipakai aplikasi.
- Penyimpanan CV otomatis setelah download.
- Refactor umum `form-generate.tsx` di luar bagian generate PDF.

## Kriteria Penerimaan

1. Satu klik **Generate PDF** langsung membuka modal progress berbasis milestone nyata.
2. Modal mencegah penutupan dan generate ganda selama proses aktif.
3. Progress hanya naik dan mencapai 100% setelah `.save()` berhasil.
4. Jalur sukses tetap menghasilkan PDF valid dengan kontrak layout dan download yang sama.
5. Jalur gagal selalu menutup modal serta mengaktifkan kembali tombol.
6. Dialog lain tetap mempunyai tombol tutup dan perilaku lama.
7. Tidak ada dependency, perubahan backend, atau pembuatan overlay DOM manual baru.
