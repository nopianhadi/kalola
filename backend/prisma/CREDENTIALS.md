# 🔐 Kredensial Mock Data untuk Testing

## Password Default
Semua user menggunakan password yang sama untuk kemudahan testing:

**Password:** `password123`

---

## 👥 Daftar User & Kredensial

### 1. **Admin/Owner**
- **Email:** `admin@weddingphotography.com`
- **Password:** `password123`
- **Role:** Admin
- **Nama:** Budi Santoso
- **Permissions:** Full access (all)

### 2. **Photographer**
- **Email:** `photographer1@weddingphotography.com`
- **Password:** `password123`
- **Role:** Member
- **Nama:** Andi Wijaya
- **Permissions:** view_projects, edit_projects, view_clients

### 3. **Videographer**
- **Email:** `videographer1@weddingphotography.com`
- **Password:** `password123`
- **Role:** Member
- **Nama:** Siti Nurhaliza
- **Permissions:** view_projects, view_calendar

### 4. **Editor**
- **Email:** `editor@weddingphotography.com`
- **Password:** `password123`
- **Role:** Member
- **Nama:** Rudi Hartono
- **Permissions:** view_projects, edit_galleries

### 5. **Finance Manager**
- **Email:** `finance@weddingphotography.com`
- **Password:** `password123`
- **Role:** Finance
- **Nama:** Dewi Lestari
- **Permissions:** view_projects, view_finance, edit_finance, view_transactions

---

## 🔧 Cara Generate Password Hash

Jika Anda ingin mengubah password, gunakan script berikut:

```javascript
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
}

generateHash();
```

Atau gunakan online tool: https://bcrypt-generator.com/

**Rounds:** 10

---

## ⚠️ Catatan Keamanan

- **JANGAN** gunakan password ini untuk production!
- File ini hanya untuk development dan testing
- Pastikan file ini ada di `.gitignore`
- Untuk production, gunakan password yang kuat dan unik untuk setiap user
- Implementasikan password reset dan 2FA untuk keamanan tambahan

---

## 📝 Update Password di Database

Jika ingin update password setelah import:

```sql
-- Update password untuk user tertentu
UPDATE users 
SET password = '$2b$10$YOUR_NEW_HASH_HERE' 
WHERE email = 'admin@weddingphotography.com';
```

---

## 🧪 Testing Login

Contoh request login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@weddingphotography.com",
    "password": "password123"
  }'
```

Atau gunakan Postman/Insomnia dengan body:
```json
{
  "email": "admin@weddingphotography.com",
  "password": "password123"
}
```
