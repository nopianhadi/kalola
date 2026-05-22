# 📋 Rencana Migrasi UUID ke Integer ID

## 🎯 Tujuan
Mengubah semua kolom ID dari VARCHAR(36) UUID menjadi INT AUTO_INCREMENT untuk:
- Performa query lebih cepat
- Ukuran database lebih kecil
- Index lebih efisien
- Lebih mudah untuk debugging

## 📊 Analisis Tabel

### Tabel dengan Relasi (Perlu Migrasi Bertahap)

#### **Grup 1: Tabel Independen (Tidak ada Foreign Key)**
1. ✅ `calendar_events` - Tidak ada relasi
2. ✅ `client_feedback` - Tidak ada relasi
3. ✅ `notifications` - Tidak ada relasi
4. ✅ `suggestions` - Tidak ada relasi

#### **Grup 2: Tabel dengan Relasi Sederhana**
5. ✅ `users` → Digunakan oleh: `galleries`, `profiles`
6. ✅ `packages` → Digunakan oleh: `projects`
7. ✅ `promo_codes` → Digunakan oleh: `projects`
8. ✅ `add_ons` → Digunakan oleh: `project_add_ons`
9. ✅ `team_members` → Digunakan oleh: `freelancer_feedback`, `project_team_assignments`, `team_payment_records`, `team_project_payments`

#### **Grup 3: Tabel dengan Relasi Kompleks**
10. ✅ `cards` → Digunakan oleh: `financial_pockets`, `transactions`
11. ✅ `clients` → Digunakan oleh: `contracts`, `projects`, `transactions`
12. ✅ `financial_pockets` → Digunakan oleh: `transactions`

#### **Grup 4: Tabel Utama (Projects)**
13. ✅ `projects` → Digunakan oleh banyak tabel

#### **Grup 5: Tabel yang Bergantung pada Projects**
14. ✅ `contracts`
15. ✅ `project_add_ons`
16. ✅ `project_print_items`
17. ✅ `project_team_assignments`
18. ✅ `social_media_posts`
19. ✅ `team_project_payments`
20. ✅ `wedding_day_checklists`

#### **Grup 6: Tabel Transaksi**
21. ✅ `transactions` - Relasi ke banyak tabel

#### **Grup 7: Tabel Lainnya**
22. ✅ `freelancer_feedback`
23. ✅ `team_payment_records`
24. ✅ `galleries`
25. ✅ `gallery_images`
26. ✅ `profiles`

---

## 🔄 Strategi Migrasi Bertahap

### **Fase 1: Tabel Independen** ✅
Migrasi tabel yang tidak memiliki foreign key sama sekali.

```sql
-- calendar_events, client_feedback, notifications, suggestions
ALTER TABLE calendar_events MODIFY id INT AUTO_INCREMENT;
```

### **Fase 2: Tabel Root (Parent Tables)** ✅
Migrasi tabel yang menjadi parent tapi tidak bergantung pada tabel lain.

```sql
-- users, packages, promo_codes, add_ons, team_members, cards
ALTER TABLE users MODIFY id INT AUTO_INCREMENT;
```

### **Fase 3: Tabel Level 1 (Bergantung pada Root)** ✅
```sql
-- clients (independent)
-- financial_pockets (depends on cards)
-- profiles (depends on users)
-- galleries (depends on users)
```

### **Fase 4: Tabel Projects** ✅
```sql
-- projects (depends on clients, packages, promo_codes)
```

### **Fase 5: Tabel yang Bergantung pada Projects** ✅
```sql
-- contracts, project_add_ons, project_print_items, etc.
```

### **Fase 6: Tabel Transaksi** ✅
```sql
-- transactions (depends on projects, cards, financial_pockets, clients)
```

---

## 📝 Template Migration SQL

### Step 1: Backup Data
```sql
-- Backup tabel sebelum migrasi
CREATE TABLE {table_name}_backup AS SELECT * FROM {table_name};
```

### Step 2: Drop Foreign Keys
```sql
-- Drop semua foreign key yang mengarah ke tabel ini
ALTER TABLE {child_table} DROP FOREIGN KEY {constraint_name};
```

### Step 3: Ubah Tipe Data
```sql
-- Ubah ID dari VARCHAR(36) ke INT
ALTER TABLE {table_name} 
  MODIFY id INT AUTO_INCREMENT;

-- Ubah foreign key references
ALTER TABLE {child_table}
  MODIFY {fk_column} INT;
```

### Step 4: Recreate Foreign Keys
```sql
-- Buat ulang foreign key dengan tipe INT
ALTER TABLE {child_table}
  ADD CONSTRAINT {constraint_name}
  FOREIGN KEY ({fk_column}) REFERENCES {parent_table}(id)
  ON DELETE CASCADE ON UPDATE RESTRICT;
```

---

## ⚠️ Risiko & Mitigasi

### Risiko:
1. **Data Loss** - Jika migrasi gagal di tengah jalan
2. **Downtime** - Aplikasi tidak bisa diakses saat migrasi
3. **Foreign Key Conflicts** - Relasi rusak jika tidak urut

### Mitigasi:
1. ✅ Backup semua tabel sebelum migrasi
2. ✅ Lakukan di environment development dulu
3. ✅ Migrasi bertahap per grup
4. ✅ Test setiap fase sebelum lanjut
5. ✅ Siapkan rollback script

---

## 🚀 Eksekusi

### Urutan Eksekusi:
1. ✅ Buat migration file baru
2. ✅ Jalankan di development
3. ✅ Test semua endpoint API
4. ✅ Verifikasi data integrity
5. ✅ Deploy ke production (dengan maintenance mode)

---

## 📌 Checklist

- [ ] Fase 1: Tabel Independen
- [ ] Fase 2: Tabel Root
- [ ] Fase 3: Tabel Level 1
- [ ] Fase 4: Projects
- [ ] Fase 5: Tabel Dependent
- [ ] Fase 6: Transactions
- [ ] Update Prisma Schema
- [ ] Generate Prisma Client
- [ ] Update Backend Code (ID generation)
- [ ] Update Frontend Code (ID handling)
- [ ] Testing End-to-End
- [ ] Documentation Update

---

## 🔧 Perubahan Kode yang Diperlukan

### Backend:
1. ❌ Hapus UUID generation (`uuid()`)
2. ✅ Biarkan database auto-generate ID
3. ✅ Update response type dari string ke number
4. ✅ Update validation schema

### Frontend:
1. ✅ Update TypeScript interfaces (id: string → id: number)
2. ✅ Update API calls
3. ✅ Update state management
4. ✅ Update URL parameters

---

## 📅 Timeline Estimasi

- Fase 1-2: 1 hari (Tabel sederhana)
- Fase 3-4: 2 hari (Tabel dengan relasi)
- Fase 5-6: 2 hari (Tabel kompleks)
- Testing: 2 hari
- **Total: ~7 hari kerja**

---

## ✅ Status: READY TO START
