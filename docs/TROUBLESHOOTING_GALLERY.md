# 🔧 Troubleshooting - Gallery Images Not Showing

## Masalah: Gambar tidak muncul di halaman public gallery

### ✅ Perubahan yang Sudah Dilakukan:

1. **Fixed `sanitizeImageUrl()` function** di `PublicGallery.tsx`
   - Sekarang mendukung base64 data URLs (`data:image/...`)
   - Sebelumnya hanya mengizinkan HTTP/HTTPS URLs

2. **Added debugging logs**
   - Backend: Log saat gallery dipanggil
   - Frontend: Log data gallery yang diterima
   - Frontend: Log setiap gambar yang di-render

3. **Improved error handling**
   - Fallback UI jika gambar tidak ada URL
   - Error callback di LazyImage component

---

## 🔍 Cara Debug:

### 1. Buka Browser Console (F12)

Setelah membuka halaman `http://localhost:5173/#/g/venajhjg-ml6o9`, cek console untuk:

#### A. Log dari `loadGalleryData`:
```
Gallery Data Loaded: {
  id: "...",
  title: "...",
  imageCount: 5,
  firstImage: {
    id: "...",
    hasUrl: true,
    hasThumbnail: true,
    urlPreview: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
  }
}
```

**Cek:**
- ✅ `imageCount` > 0?
- ✅ `hasUrl: true`?
- ✅ `urlPreview` dimulai dengan `data:image/`?

#### B. Log dari render images:
```
Image 1: {
  id: "...",
  hasUrl: true,
  hasThumbnail: true,
  urlType: "base64",
  urlLength: 123456
}
```

**Cek:**
- ✅ `urlType: "base64"`?
- ✅ `urlLength` > 0?

#### C. Log dari backend (Terminal backend):
```
Public Gallery Request: {
  publicId: "venajhjg-ml6o9",
  found: true,
  imageCount: 5
}
```

**Cek:**
- ✅ `found: true`?
- ✅ `imageCount` > 0?

---

### 2. Cek Network Tab

Di browser DevTools → Network tab:

1. Refresh halaman
2. Cari request ke `/api/galleries/public/venajhjg-ml6o9`
3. Klik request tersebut
4. Lihat **Response** tab

**Yang harus ada:**
```json
{
  "id": "...",
  "title": "...",
  "gallery_images": [
    {
      "id": "...",
      "url": "data:image/jpeg;base64,...",
      "thumbnail_url": "data:image/jpeg;base64,...",
      "caption": null,
      "uploaded_at": "2024-..."
    }
  ]
}
```

**Cek:**
- ✅ `gallery_images` adalah array?
- ✅ Ada minimal 1 item?
- ✅ `url` dimulai dengan `data:image/`?

---

### 3. Cek Database Langsung

Jika backend running, buka MySQL/database client dan jalankan:

```sql
-- Cek gallery
SELECT id, title, public_id, is_public 
FROM galleries 
WHERE public_id = 'venajhjg-ml6o9';

-- Cek images
SELECT 
  gi.id,
  gi.gallery_id,
  LENGTH(gi.url) as url_length,
  LENGTH(gi.thumbnail_url) as thumbnail_length,
  SUBSTRING(gi.url, 1, 50) as url_preview
FROM gallery_images gi
JOIN galleries g ON gi.gallery_id = g.id
WHERE g.public_id = 'venajhjg-ml6o9';
```

**Yang harus ada:**
- ✅ Gallery ditemukan dengan `is_public = 1`
- ✅ Ada rows di `gallery_images`
- ✅ `url_length` > 0 (misalnya 50000+)
- ✅ `url_preview` dimulai dengan `data:image/`

---

## 🐛 Kemungkinan Masalah & Solusi:

### Masalah 1: Gallery tidak ditemukan
**Gejala:** Error "Pricelist Tidak Ditemukan"

**Solusi:**
```bash
# Cek apakah gallery ada dan public
# Di MySQL:
SELECT * FROM galleries WHERE public_id = 'venajhjg-ml6o9';

# Pastikan is_public = 1
UPDATE galleries SET is_public = 1 WHERE public_id = 'venajhjg-ml6o9';
```

---

### Masalah 2: Gallery ada tapi tidak ada gambar
**Gejala:** Halaman muncul tapi "Pricelist Kosong"

**Solusi:**
```bash
# Cek apakah ada images
SELECT COUNT(*) FROM gallery_images gi
JOIN galleries g ON gi.gallery_id = g.id
WHERE g.public_id = 'venajhjg-ml6o9';

# Jika 0, berarti belum ada gambar yang diupload
# Upload gambar melalui dashboard admin
```

---

### Masalah 3: Images ada tapi URL kosong/null
**Gejala:** Console log menunjukkan `hasUrl: false`

**Solusi:**
```sql
-- Cek URL di database
SELECT id, url IS NULL as url_null, LENGTH(url) as url_len
FROM gallery_images
WHERE gallery_id = (SELECT id FROM galleries WHERE public_id = 'venajhjg-ml6o9');

-- Jika url_null = 1 atau url_len = 0, data corrupt
-- Perlu re-upload gambar
```

---

### Masalah 4: URL ada tapi bukan base64
**Gejala:** Console log menunjukkan `urlType: "unknown"`

**Solusi:**
```sql
-- Cek format URL
SELECT 
  id,
  SUBSTRING(url, 1, 20) as url_start,
  SUBSTRING(thumbnail_url, 1, 20) as thumb_start
FROM gallery_images
WHERE gallery_id = (SELECT id FROM galleries WHERE public_id = 'venajhjg-ml6o9');

-- Harus dimulai dengan "data:image/"
-- Jika tidak, berarti upload gagal atau data corrupt
```

---

### Masalah 5: Base64 terlalu besar
**Gejala:** Gambar loading lama atau stuck

**Solusi:**
- Cek ukuran base64 di database
- Jika > 5MB per gambar, perlu kompresi lebih agresif
- Edit `src/services/galleries.ts`:

```typescript
// Turunkan quality atau max width
const compressedBase64 = await compressImage(file, 1280, 0.7); // dari 1920, 0.8
const thumbnailBase64 = await generateThumbnail(file, 300, 0.6); // dari 400, 0.7
```

---

### Masalah 6: CORS Error
**Gejala:** Console error "CORS policy blocked"

**Solusi:**
```typescript
// Di backend/src/index.ts
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

---

## 🚀 Quick Fix Checklist:

Jalankan ini satu per satu:

```bash
# 1. Restart backend
cd backend
npm run dev

# 2. Restart frontend
npm run dev

# 3. Clear browser cache
# Tekan Ctrl+Shift+Delete → Clear cache

# 4. Hard refresh
# Tekan Ctrl+Shift+R atau Cmd+Shift+R

# 5. Cek backend running
curl http://localhost:5000/api/galleries/public/venajhjg-ml6o9

# 6. Cek response
# Harus return JSON dengan gallery_images array
```

---

## 📝 Informasi untuk Developer:

Jika masih tidak bisa, berikan informasi ini:

1. **Console logs** (screenshot atau copy-paste)
2. **Network response** dari `/api/galleries/public/...`
3. **Database query result** dari SQL di atas
4. **Browser** yang digunakan (Chrome/Firefox/Safari)
5. **Error messages** jika ada

---

## ✅ Verifikasi Sukses:

Gambar berhasil muncul jika:
- ✅ Tidak ada error di console
- ✅ Gambar terlihat di halaman (bukan placeholder)
- ✅ Klik gambar membuka lightbox
- ✅ Gambar di lightbox jelas (tidak blur)

---

## 🔄 Jika Masih Gagal:

Coba upload gambar baru:

1. Buka `http://localhost:5173/#/gallery`
2. Klik "Kelola" di gallery yang bermasalah
3. Hapus semua gambar lama
4. Upload gambar baru (max 2-3MB per file)
5. Cek lagi halaman public

Jika masih gagal, kemungkinan perlu migrasi ke cloud storage (Cloudinary/Supabase).
