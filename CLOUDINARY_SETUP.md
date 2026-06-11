# Setup Cloudinary untuk Imagenic

## 1. Daftar Cloudinary (Gratis)

1. Buka https://cloudinary.com/
2. Klik **Sign Up** → isi form → verifikasi email
3. Masuk ke **Dashboard**

## 2. Ambil API Credentials

Di Dashboard Cloudinary:
- **Cloud Name** → terlihat di pojok kiri atas
- **API Key** & **API Secret** → Settings > API Keys

## 3. Isi .env Backend

Buka `d:\imagenic\backend\.env` dan ganti placeholder:

```env
CLOUDINARY_CLOUD_NAME=dq56qbxoi
CLOUDINARY_API_KEY=434913686837792
CLOUDINARY_API_SECRET=<lihat di backend/.env>
```

## 4. Endpoint yang Tersedia

| Endpoint | Method | Kegunaan |
|----------|--------|---------|
| `/api/upload/avatar?context=client` | POST | Avatar klien |
| `/api/upload/avatar?context=team` | POST | Avatar anggota tim |
| `/api/upload/avatar?context=profile` | POST | Avatar profil vendor |
| `/api/upload/image?context=package` | POST | Cover paket |
| `/api/upload/image?context=project` | POST | Gambar project |
| `/api/upload/logo` | POST | Logo perusahaan |
| `/api/upload/gallery` | POST | Multiple foto galeri (maks 20) |
| `/api/upload/:publicId` | DELETE | Hapus gambar |

Semua endpoint butuh `Authorization: Bearer <token>` (sudah dihandle apiClient).

## 5. Cara Pakai di Frontend

### Avatar klien/tim (ganti AvatarUpload → CloudinaryAvatarUpload)

```tsx
import { CloudinaryAvatarUpload } from '@/shared/ui';

// Sebelum (base64):
<AvatarUpload
  value={client.avatar}
  onChange={async (base64) => {
    await updateClient(client.id, { avatar: base64 });
  }}
  name={client.name}
/>

// Sesudah (Cloudinary URL):
<CloudinaryAvatarUpload
  value={client.avatar}     // sekarang berisi URL Cloudinary
  context="client"
  onChange={async (url) => {
    await updateClient(client.id, { avatar: url });
  }}
  name={client.name}
/>
```

### Upload gambar dari kode (tanpa komponen)

```ts
import { uploadImage, uploadLogo } from '@/services/upload';

// Upload cover paket
const result = await uploadImage(file, 'package');
await updatePackage(id, { cover_image: result.url });

// Upload logo
const logo = await uploadLogo(file);
await updateProfile(id, { logo_base64: logo.url }); // simpan URL di kolom yang sama
```

## 6. Struktur Folder di Cloudinary

Setiap vendor tersimpan di folder terpisah:
```
imagenic/
  {vendorId}/
    client/      ← avatar klien
    team/        ← avatar anggota tim  
    profile/     ← avatar profil vendor
    logo/        ← logo perusahaan
    package/     ← cover paket
    project/     ← gambar project
    gallery/     ← foto galeri
```

## 7. Backwards Compatibility

Kolom DB tidak perlu diubah. `clients.avatar`, `team_members.avatar`, dll
bisa menyimpan:
- Base64 string (data lama) — tetap bekerja
- URL Cloudinary (data baru) — format `https://res.cloudinary.com/...`

Komponen `AvatarDisplay` dan `CloudinaryAvatarDisplay` keduanya support kedua format.
