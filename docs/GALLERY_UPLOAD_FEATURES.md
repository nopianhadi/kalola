# 📸 Fitur Gallery Upload - Pricelist Management

## ✨ Fitur Baru yang Ditambahkan

### 1. **Kompresi Gambar Otomatis** 🗜️
- **Gambar utama**: Dikompres maksimal 1920px lebar dengan kualitas 80%
- **Thumbnail**: Dibuat otomatis 400px lebar dengan kualitas 70%
- **Manfaat**: 
  - Ukuran file lebih kecil (hemat storage database)
  - Loading lebih cepat
  - Performa lebih baik

### 2. **Kelola Gambar Individual** 🎨
- **Tombol "Kelola"** di setiap card gallery
- Fitur yang tersedia:
  - ✅ Preview semua gambar dalam grid
  - ✅ Hapus gambar individual
  - ✅ Reorder/urutkan gambar (pindah kiri/kanan)
  - ✅ Lihat nomor urutan gambar
  - ✅ Tambah gambar baru langsung dari modal kelola

### 3. **Lightbox/Image Viewer** 🖼️
- Klik gambar di modal "Kelola Gambar" untuk melihat full size
- Navigasi dengan tombol prev/next
- Tampilan counter (1/10, 2/10, dst)
- Tampilan caption jika ada
- Klik di luar gambar atau tombol X untuk tutup

### 4. **UI/UX Improvements** 💅
- Tombol "Upload" dan "Kelola" terpisah untuk clarity
- Grid layout yang lebih rapi untuk action buttons
- Hover effects yang lebih smooth
- Badge nomor urutan di setiap gambar
- Progress bar saat upload dengan animasi

## 🔧 Technical Details

### Service Layer (`src/services/galleries.ts`)
```typescript
// Fungsi kompresi gambar
compressImage(file: File, maxWidth: number, quality: number): Promise<string>

// Generate thumbnail
generateThumbnail(file: File, maxWidth: number, quality: number): Promise<string>

// Delete gambar individual
deleteGalleryImage(galleryId: string, imageId: string): Promise<void>

// Reorder gambar
reorderGalleryImages(galleryId: string, images: GalleryImage[]): Promise<Gallery>
```

### Component (`src/features/public/components/GalleryUpload.tsx`)
- State management untuk modal baru:
  - `isManageImagesModalOpen`
  - `isLightboxOpen`
  - `lightboxImageIndex`
- Handler functions:
  - `handleDeleteImage()`
  - `handleReorderImages()`
  - `moveImage()`
  - `openLightbox()`
  - `nextImage()` / `prevImage()`

## 📊 Performa

### Sebelum:
- Gambar 5MB → Upload 5MB ke database
- Tidak ada thumbnail
- Tidak bisa manage gambar setelah upload

### Sesudah:
- Gambar 5MB → Dikompres jadi ~800KB (main) + ~100KB (thumbnail)
- **Hemat ~80% storage**
- Full management capabilities

## 🎯 Cara Penggunaan

### Upload Gambar Baru:
1. Klik tombol **"Upload"** di card gallery
2. Pilih gambar (max 10MB per file)
3. Gambar otomatis dikompres saat upload
4. Progress bar menunjukkan status upload

### Kelola Gambar:
1. Klik tombol **"Kelola"** di card gallery (muncul jika ada gambar)
2. Di modal kelola:
   - **Klik gambar** → Lihat full size di lightbox
   - **Tombol panah** → Pindah urutan gambar
   - **Tombol trash** → Hapus gambar
   - **Tombol "Tambah Gambar"** → Upload gambar baru

### Lightbox:
- **Klik gambar** di modal kelola untuk buka lightbox
- **Tombol panah kiri/kanan** → Navigasi antar gambar
- **Tombol X** atau **klik di luar** → Tutup lightbox

## 🚀 Next Steps (Optional)

Jika ingin upgrade lebih lanjut:
1. **Cloud Storage Integration** (Cloudinary/Supabase Storage)
2. **Drag & Drop Reorder** (lebih intuitif dari tombol panah)
3. **Bulk Actions** (hapus/download multiple gambar sekaligus)
4. **Image Editing** (crop, rotate, filter)
5. **Caption Editor** (edit caption per gambar)

## 🐛 Troubleshooting

### Upload gagal?
- Pastikan backend running di `http://localhost:5000`
- Cek ukuran file tidak melebihi 10MB
- Cek format file adalah gambar (JPG, PNG, WebP)

### Gambar tidak muncul?
- Cek console browser untuk error
- Pastikan database connection OK
- Cek apakah gambar ter-save di database

### Kompresi terlalu agresif?
Edit di `src/services/galleries.ts`:
```typescript
// Ubah parameter quality (0.1 - 1.0)
const compressedBase64 = await compressImage(file, 1920, 0.9); // 90% quality
const thumbnailBase64 = await generateThumbnail(file, 400, 0.8); // 80% quality
```

## 📝 Notes

- Kompresi menggunakan Canvas API (browser native)
- Thumbnail dibuat otomatis untuk performa loading
- Reorder menggunakan array manipulation (tidak perlu drag & drop library)
- Lightbox menggunakan fixed positioning dengan z-index tinggi
