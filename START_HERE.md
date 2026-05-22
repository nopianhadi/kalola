# 🚀 MULAI DI SINI - Migrasi UUID ke Integer ID

## 📌 Situasi Anda Saat Ini

Anda mengalami error:
```
[POST /cards] Error: Argument `card_holder_name` is missing
```

**Penyebab:** Backend masih generate UUID manual, tapi schema sudah expect INT AUTO_INCREMENT.

**Solusi:** Migrasi database dari UUID ke Integer ID secara bertahap.

---

## 📁 Dokumen yang Sudah Disiapkan

### 1. **MIGRATION_SUMMARY.md** ⭐ BACA INI DULU
   - Ringkasan lengkap apa yang sudah disiapkan
   - Cara menjalankan migrasi
   - Testing dan rollback

### 2. **BACKEND_CODE_CHANGES.md** ⭐ PENTING
   - Cara fix error yang Anda alami
   - Perubahan code yang diperlukan
   - Contoh before/after

### 3. **MIGRATION_EXECUTION_GUIDE.md**
   - Panduan step-by-step eksekusi
   - Testing procedures
   - Troubleshooting

### 4. **MIGRATION_UUID_TO_INT_PLAN.md**
   - Strategi migrasi lengkap
   - Analisis semua tabel
   - Timeline estimasi

### 5. **MIGRATION_README.md**
   - Overview project
   - Quick start guide
   - Status tracking

---

## 🎯 Langkah Cepat (Quick Start)

### Step 1: Backup Database ⚠️
```bash
mysqldump -u root -p imagenic_db > backup_full_$(date +%Y%m%d).sql
```

### Step 2: Jalankan Migrasi Fase 1

#### Windows:
```powershell
cd backend
.\migrate-phase1.ps1
```

#### Linux/Mac:
```bash
cd backend
chmod +x migrate-phase1.sh
./migrate-phase1.sh
```

#### Manual:
```bash
cd backend
mysql -u root -p imagenic_db < prisma/migrations/20260505230417_migrate_uuid_to_int_phase1/migration.sql
npx prisma generate
npm run dev
```

### Step 3: Update Backend Code

Buka file routes yang menggunakan tabel Fase 1 dan **HAPUS UUID generation**:

```typescript
// ❌ HAPUS INI
import { v4 as uuid } from 'uuid';

router.post('/calendar-events', async (req, res) => {
  const event = await prisma.calendar_events.create({
    data: {
      id: uuid(),  // ❌ HAPUS BARIS INI
      title: req.body.title,
      // ...
    }
  });
});

// ✅ GANTI JADI INI
router.post('/calendar-events', async (req, res) => {
  const event = await prisma.calendar_events.create({
    data: {
      // ID akan auto-generated oleh database
      title: req.body.title,
      // ...
    }
  });
});
```

### Step 4: Test

```bash
# Test create
curl -X POST http://localhost:3000/api/calendar-events \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","date":"2026-06-01"}'

# Response harus: { "id": 1, "title": "Test", ... }
# ID harus integer, bukan UUID
```

---

## 📊 Status Migrasi

### ✅ Fase 1: READY TO EXECUTE
Tabel yang akan dimigrasi:
- `calendar_events`
- `client_feedback`
- `notifications`
- `suggestions`

**Files Ready:**
- ✅ Migration SQL
- ✅ Updated Prisma Schema
- ✅ Automation Scripts
- ✅ Documentation

### ⏳ Fase 2-6: PENDING
Akan dikerjakan setelah Fase 1 berhasil.

---

## 🔧 Fix Error Cards

Untuk fix error `card_holder_name` missing:

### 1. Tunggu sampai Fase 2 (cards table)
   - Cards akan dimigrasi di Fase 2
   - Setelah itu, hapus UUID generation di cards routes

### 2. Atau Fix Sementara Sekarang

Buka file `backend/src/routes/cards.ts`:

```typescript
// Cari bagian POST /cards
router.post('/cards', async (req, res) => {
  try {
    const card = await prisma.cards.create({
      data: {
        id: uuid(),  // ❌ HAPUS BARIS INI (sementara comment dulu)
        card_holder_name: req.body.cardHolderName,  // ✅ Pastikan ini ada
        bank_name: req.body.bankName,
        balance: req.body.balance || 0,
        // ... field lainnya
      }
    });
    res.json(card);
  } catch (error) {
    console.error('[POST /cards] Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Pastikan:**
1. Semua required fields ada (card_holder_name, dll)
2. Mapping dari req.body benar
3. Tidak ada field yang hilang

---

## ⚠️ Hal Penting

### 1. Backup Dulu!
Selalu backup database sebelum migrasi:
```bash
mysqldump -u root -p imagenic_db > backup.sql
```

### 2. Test di Development
Jangan langsung di production!

### 3. Rollback Ready
Jika gagal, restore dari backup:
```bash
mysql -u root -p imagenic_db < backup.sql
```

### 4. Bertahap
Jangan migrasi semua tabel sekaligus. Ikuti fase 1-6.

---

## 🧪 Testing Checklist

Setelah migrasi Fase 1:

- [ ] GET /api/calendar-events - works
- [ ] POST /api/calendar-events - ID auto-generated (integer)
- [ ] PUT /api/calendar-events/:id - works with integer ID
- [ ] DELETE /api/calendar-events/:id - works
- [ ] GET /api/notifications - works
- [ ] POST /api/notifications - ID auto-generated
- [ ] GET /api/client-feedback - works
- [ ] POST /api/client-feedback - ID auto-generated
- [ ] GET /api/suggestions - works
- [ ] POST /api/suggestions - ID auto-generated
- [ ] No errors in console
- [ ] Frontend still works (if updated)

---

## 🆘 Jika Ada Masalah

### 1. Migration Gagal
```bash
# Rollback
mysql -u root -p imagenic_db < backup.sql

# Revert schema
git checkout HEAD -- backend/prisma/schema.prisma
npx prisma generate
```

### 2. Backend Error
- Cek `backend/backend-err.log`
- Pastikan Prisma Client sudah di-generate ulang
- Restart backend

### 3. Frontend Error
- Update TypeScript interfaces (id: string → id: number)
- Update API calls
- Clear browser cache

---

## 📞 Next Steps

1. **Baca** MIGRATION_SUMMARY.md
2. **Backup** database
3. **Execute** Fase 1
4. **Test** endpoints
5. **Update** backend code
6. **Verify** everything works
7. **Proceed** to Fase 2

---

## 📚 Urutan Baca Dokumen

1. ⭐ **START_HERE.md** (dokumen ini)
2. ⭐ **MIGRATION_SUMMARY.md** - Overview lengkap
3. ⭐ **BACKEND_CODE_CHANGES.md** - Fix error Anda
4. **MIGRATION_EXECUTION_GUIDE.md** - Detail eksekusi
5. **MIGRATION_UUID_TO_INT_PLAN.md** - Strategi lengkap
6. **MIGRATION_README.md** - Reference

---

## ✅ Ready?

Jika sudah siap:

```bash
# 1. Backup
mysqldump -u root -p imagenic_db > backup.sql

# 2. Execute
cd backend
.\migrate-phase1.ps1  # Windows
# atau
./migrate-phase1.sh   # Linux/Mac

# 3. Test
curl http://localhost:3000/api/calendar-events
```

---

**Estimasi Waktu Fase 1:** 30 menit - 1 jam  
**Risk Level:** LOW  
**Status:** READY TO EXECUTE 🚀

**Good luck!** 💪
