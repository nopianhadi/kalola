# 🔄 Migrasi UUID ke Integer ID

## 📖 Ringkasan

Proyek ini sedang dalam proses migrasi dari UUID (VARCHAR(36)) ke Integer ID (INT AUTO_INCREMENT) untuk meningkatkan performa dan efisiensi database.

## 📁 Dokumen Terkait

1. **[MIGRATION_UUID_TO_INT_PLAN.md](./MIGRATION_UUID_TO_INT_PLAN.md)** - Rencana lengkap migrasi
2. **[MIGRATION_EXECUTION_GUIDE.md](./MIGRATION_EXECUTION_GUIDE.md)** - Panduan eksekusi step-by-step
3. **[ANALISIS_MIGRASI_UUID_KE_ID.md](./ANALISIS_MIGRASI_UUID_KE_ID.md)** - Analisis teknis

## 🎯 Status Migrasi

### ✅ Fase 1: Tabel Independen (READY)
- [x] `calendar_events`
- [x] `client_feedback`
- [x] `notifications`
- [x] `suggestions`

**Status:** Migration file sudah dibuat, siap dijalankan

### ⏳ Fase 2: Tabel Root (PENDING)
- [ ] `users`
- [ ] `packages`
- [ ] `promo_codes`
- [ ] `add_ons`
- [ ] `team_members`
- [ ] `cards`

### ⏳ Fase 3: Tabel Level 1 (PENDING)
- [ ] `clients`
- [ ] `financial_pockets`
- [ ] `profiles`
- [ ] `galleries`

### ⏳ Fase 4: Projects (PENDING)
- [ ] `projects`

### ⏳ Fase 5: Tabel Dependent (PENDING)
- [ ] `contracts`
- [ ] `project_add_ons`
- [ ] `project_print_items`
- [ ] `project_team_assignments`
- [ ] `social_media_posts`
- [ ] `team_project_payments`
- [ ] `wedding_day_checklists`

### ⏳ Fase 6: Transactions (PENDING)
- [ ] `transactions`

### ⏳ Fase 7: Lainnya (PENDING)
- [ ] `freelancer_feedback`
- [ ] `team_payment_records`
- [ ] `gallery_images`

---

## 🚀 Quick Start - Fase 1

### Prerequisites
- MySQL client installed
- Node.js & npm installed
- Database backup

### Eksekusi (Linux/Mac)
```bash
cd backend
chmod +x migrate-phase1.sh
./migrate-phase1.sh
```

### Eksekusi (Windows)
```powershell
cd backend
.\migrate-phase1.ps1
```

### Manual Execution
```bash
cd backend

# 1. Backup
mysqldump -u username -p database_name calendar_events client_feedback notifications suggestions > backup.sql

# 2. Run migration
mysql -u username -p database_name < prisma/migrations/20260505230417_migrate_uuid_to_int_phase1/migration.sql

# 3. Generate Prisma Client
npx prisma generate

# 4. Restart backend
npm run dev
```

---

## 🧪 Testing Fase 1

### Test Endpoints

```bash
# Calendar Events
curl http://localhost:3000/api/calendar-events
curl -X POST http://localhost:3000/api/calendar-events \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","date":"2026-06-01"}'

# Notifications
curl http://localhost:3000/api/notifications
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello"}'

# Client Feedback
curl http://localhost:3000/api/client-feedback
curl -X POST http://localhost:3000/api/client-feedback \
  -H "Content-Type: application/json" \
  -d '{"client_name":"John","rating":5}'

# Suggestions
curl http://localhost:3000/api/suggestions
curl -X POST http://localhost:3000/api/suggestions \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","message":"Great!"}'
```

---

## 🔄 Rollback

### Jika Migrasi Gagal

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

### Kembalikan Prisma Schema
```bash
git checkout HEAD -- backend/prisma/schema.prisma
npx prisma generate
```

---

## 📊 Perubahan yang Dilakukan

### Database Schema
```sql
-- SEBELUM
id VARCHAR(36) PRIMARY KEY

-- SESUDAH
id INT AUTO_INCREMENT PRIMARY KEY
```

### Prisma Schema
```prisma
// SEBELUM
model calendar_events {
  id String @id @db.VarChar(36)
  // ...
}

// SESUDAH
model calendar_events {
  id Int @id @default(autoincrement())
  // ...
}
```

### Backend Code
```typescript
// SEBELUM
import { v4 as uuid } from 'uuid';
const id = uuid();

// SESUDAH
// ID di-generate otomatis oleh database
// Tidak perlu generate manual
```

### Frontend Code
```typescript
// SEBELUM
interface CalendarEvent {
  id: string;
  // ...
}

// SESUDAH
interface CalendarEvent {
  id: number;
  // ...
}
```

---

## ⚠️ Breaking Changes

### API Response
```json
// SEBELUM
{
  "id": "896282c0-1c76-49c6-9bbd-02310996a816",
  "title": "Event"
}

// SESUDAH
{
  "id": 1,
  "title": "Event"
}
```

### URL Parameters
```
// SEBELUM
GET /api/calendar-events/896282c0-1c76-49c6-9bbd-02310996a816

// SESUDAH
GET /api/calendar-events/1
```

---

## 📝 Checklist Sebelum Production

- [ ] Semua fase migrasi selesai
- [ ] Testing end-to-end passed
- [ ] Frontend sudah update semua interface
- [ ] Backend sudah hapus UUID generation
- [ ] API documentation updated
- [ ] Database backup tersedia
- [ ] Rollback plan siap
- [ ] Team sudah informed
- [ ] Maintenance window scheduled

---

## 🆘 Troubleshooting

### Error: "Duplicate entry"
```sql
SELECT id, COUNT(*) FROM calendar_events GROUP BY id HAVING COUNT(*) > 1;
```

### Error: "Cannot drop table"
```sql
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME = 'calendar_events';
```

### Error: "Foreign key constraint fails"
```sql
-- Cek foreign keys
SHOW CREATE TABLE calendar_events;
```

---

## 📞 Support

Jika mengalami masalah:
1. Cek log error di `backend/backend-err.log`
2. Verifikasi database connection
3. Pastikan backup tersedia
4. Rollback jika diperlukan

---

## 📅 Timeline

- **Fase 1:** 1 hari (Tabel independen) ✅ READY
- **Fase 2:** 2 hari (Tabel root)
- **Fase 3:** 2 hari (Tabel level 1)
- **Fase 4:** 1 hari (Projects)
- **Fase 5:** 2 hari (Tabel dependent)
- **Fase 6:** 1 hari (Transactions)
- **Testing:** 2 hari
- **Total:** ~11 hari kerja

---

## ✅ Next Steps

1. **Review** dokumen migrasi
2. **Backup** database production
3. **Execute** Fase 1 di development
4. **Test** semua endpoint
5. **Verify** data integrity
6. **Proceed** ke Fase 2

---

**Last Updated:** 2026-05-05  
**Version:** 1.0.0  
**Status:** Fase 1 Ready to Execute
