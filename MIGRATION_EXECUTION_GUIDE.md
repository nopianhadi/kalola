# 🚀 Panduan Eksekusi Migrasi UUID ke INT

## ⚠️ PENTING: Baca Sebelum Memulai!

1. **Backup database** sebelum menjalankan migrasi
2. Jalankan di **development environment** terlebih dahulu
3. **Stop aplikasi** saat migrasi berjalan
4. Pastikan tidak ada **transaksi aktif**

---

## 📋 Fase 1: Tabel Independen

### Tabel yang Dimigrasi:
- ✅ `calendar_events`
- ✅ `client_feedback`
- ✅ `notifications`
- ✅ `suggestions`

### Langkah Eksekusi:

#### 1. Backup Database
```bash
# MySQL dump
mysqldump -u username -p database_name > backup_before_phase1.sql

# Atau backup specific tables
mysqldump -u username -p database_name calendar_events client_feedback notifications suggestions > backup_phase1_tables.sql
```

#### 2. Jalankan Migration
```bash
cd backend

# Jalankan migration SQL
mysql -u username -p database_name < prisma/migrations/20260505230417_migrate_uuid_to_int_phase1/migration.sql

# Atau via Prisma
npx prisma migrate deploy
```

#### 3. Generate Prisma Client
```bash
npx prisma generate
```

#### 4. Restart Backend
```bash
npm run dev
```

---

## 🧪 Testing Fase 1

### Test Calendar Events
```bash
# GET all events
curl http://localhost:3000/api/calendar-events

# POST new event
curl -X POST http://localhost:3000/api/calendar-events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "date": "2026-06-01",
    "event_type": "Wedding"
  }'

# GET by ID (sekarang menggunakan integer)
curl http://localhost:3000/api/calendar-events/1
```

### Test Notifications
```bash
# GET all notifications
curl http://localhost:3000/api/notifications

# POST new notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test"
  }'
```

### Test Client Feedback
```bash
# GET all feedback
curl http://localhost:3000/api/client-feedback

# POST new feedback
curl -X POST http://localhost:3000/api/client-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "John Doe",
    "rating": 5,
    "feedback": "Excellent service!"
  }'
```

### Test Suggestions
```bash
# GET all suggestions
curl http://localhost:3000/api/suggestions

# POST new suggestion
curl -X POST http://localhost:3000/api/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "message": "Great app!",
    "channel": "Website"
  }'
```

---

## ✅ Verifikasi

### 1. Cek Struktur Tabel
```sql
-- Cek tipe data ID
DESCRIBE calendar_events;
DESCRIBE client_feedback;
DESCRIBE notifications;
DESCRIBE suggestions;

-- Pastikan ID adalah INT AUTO_INCREMENT
```

### 2. Cek Data
```sql
-- Pastikan semua data ter-copy
SELECT COUNT(*) FROM calendar_events;
SELECT COUNT(*) FROM calendar_events_backup_uuid;

SELECT COUNT(*) FROM client_feedback;
SELECT COUNT(*) FROM client_feedback_backup_uuid;

SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM notifications_backup_uuid;

SELECT COUNT(*) FROM suggestions;
SELECT COUNT(*) FROM suggestions_backup_uuid;
```

### 3. Test Auto Increment
```sql
-- Insert data baru dan cek ID auto-generated
INSERT INTO calendar_events (title, date) VALUES ('Test', '2026-06-01');
SELECT * FROM calendar_events ORDER BY id DESC LIMIT 1;
```

---

## 🔄 Rollback (Jika Diperlukan)

### Jika Migrasi Gagal:

```sql
-- Restore dari backup
DROP TABLE IF EXISTS calendar_events;
RENAME TABLE calendar_events_backup_uuid TO calendar_events;

DROP TABLE IF EXISTS client_feedback;
RENAME TABLE client_feedback_backup_uuid TO client_feedback;

DROP TABLE IF EXISTS notifications;
RENAME TABLE notifications_backup_uuid TO notifications;

DROP TABLE IF EXISTS suggestions;
RENAME TABLE suggestions_backup_uuid TO suggestions;
```

### Kembalikan Prisma Schema:
```bash
# Revert schema.prisma ke versi sebelumnya
git checkout HEAD -- backend/prisma/schema.prisma

# Generate ulang Prisma Client
npx prisma generate
```

---

## 📊 Checklist Fase 1

- [ ] Backup database selesai
- [ ] Migration SQL dijalankan
- [ ] Prisma schema diupdate
- [ ] Prisma client di-generate
- [ ] Backend restart berhasil
- [ ] Test GET endpoints
- [ ] Test POST endpoints
- [ ] Test PUT endpoints
- [ ] Test DELETE endpoints
- [ ] Verifikasi data integrity
- [ ] Verifikasi auto increment
- [ ] Frontend masih berfungsi
- [ ] No errors di console

---

## 🎯 Setelah Fase 1 Berhasil

Lanjut ke **Fase 2: Tabel Root (Parent Tables)**

Tabel yang akan dimigrasi:
- `users`
- `packages`
- `promo_codes`
- `add_ons`
- `team_members`
- `cards`

---

## 📞 Troubleshooting

### Error: "Duplicate entry"
```sql
-- Cek apakah ada data duplikat
SELECT id, COUNT(*) FROM calendar_events_backup_uuid GROUP BY id HAVING COUNT(*) > 1;
```

### Error: "Table already exists"
```sql
-- Drop tabel yang conflict
DROP TABLE IF EXISTS calendar_events_new;
DROP TABLE IF EXISTS calendar_events_backup_uuid;
```

### Error: "Cannot drop table"
```sql
-- Cek foreign key constraints
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME = 'calendar_events';
```

---

## ✅ Status: READY TO EXECUTE

**Estimasi Waktu:** 15-30 menit  
**Downtime:** ~5 menit  
**Risk Level:** LOW (tabel independen, tidak ada foreign key)
