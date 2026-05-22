#!/bin/bash

# ============================================
# Script Migrasi UUID ke INT - Fase 1
# ============================================

set -e  # Exit on error

echo "🚀 Memulai Migrasi Fase 1: Tabel Independen"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ File .env tidak ditemukan!${NC}"
    exit 1
fi

# Parse DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 Database Info:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Confirm
read -p "⚠️  Apakah Anda yakin ingin melanjutkan? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ Migrasi dibatalkan${NC}"
    exit 0
fi

echo ""
echo "📦 Step 1: Backup Database"
echo "----------------------------"
BACKUP_FILE="backup_phase1_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME \
    calendar_events client_feedback notifications suggestions \
    > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup berhasil: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Backup gagal!${NC}"
    exit 1
fi

echo ""
echo "🔄 Step 2: Jalankan Migration SQL"
echo "----------------------------"
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME \
    < prisma/migrations/20260505230417_migrate_uuid_to_int_phase1/migration.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration SQL berhasil${NC}"
else
    echo -e "${RED}❌ Migration SQL gagal!${NC}"
    echo -e "${YELLOW}💡 Restore dari backup: mysql -u $DB_USER -p $DB_NAME < $BACKUP_FILE${NC}"
    exit 1
fi

echo ""
echo "🔧 Step 3: Generate Prisma Client"
echo "----------------------------"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client berhasil di-generate${NC}"
else
    echo -e "${RED}❌ Generate Prisma Client gagal!${NC}"
    exit 1
fi

echo ""
echo "🧪 Step 4: Verifikasi Data"
echo "----------------------------"

# Verifikasi jumlah data
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT 
    'calendar_events' as tabel,
    (SELECT COUNT(*) FROM calendar_events) as current_count,
    (SELECT COUNT(*) FROM calendar_events_backup_uuid) as backup_count
UNION ALL
SELECT 
    'client_feedback',
    (SELECT COUNT(*) FROM client_feedback),
    (SELECT COUNT(*) FROM client_feedback_backup_uuid)
UNION ALL
SELECT 
    'notifications',
    (SELECT COUNT(*) FROM notifications),
    (SELECT COUNT(*) FROM notifications_backup_uuid)
UNION ALL
SELECT 
    'suggestions',
    (SELECT COUNT(*) FROM suggestions),
    (SELECT COUNT(*) FROM suggestions_backup_uuid);
"

echo ""
echo "============================================"
echo -e "${GREEN}✅ Migrasi Fase 1 SELESAI!${NC}"
echo "============================================"
echo ""
echo "📋 Tabel yang sudah dimigrasi:"
echo "   ✅ calendar_events"
echo "   ✅ client_feedback"
echo "   ✅ notifications"
echo "   ✅ suggestions"
echo ""
echo "📁 Backup file: $BACKUP_FILE"
echo ""
echo "🎯 Langkah selanjutnya:"
echo "   1. Test semua endpoint API"
echo "   2. Verifikasi frontend masih berfungsi"
echo "   3. Jika berhasil, lanjut ke Fase 2"
echo ""
echo "🔄 Rollback (jika diperlukan):"
echo "   mysql -u $DB_USER -p $DB_NAME < $BACKUP_FILE"
echo ""
