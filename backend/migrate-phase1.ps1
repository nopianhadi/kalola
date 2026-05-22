# ============================================
# Script Migrasi UUID ke INT - Fase 1 (Windows)
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Memulai Migrasi Fase 1: Tabel Independen" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Load .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "❌ File .env tidak ditemukan!" -ForegroundColor Red
    exit 1
}

# Parse DATABASE_URL
$DATABASE_URL = $env:DATABASE_URL
if ($DATABASE_URL -match 'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)') {
    $DB_USER = $matches[1]
    $DB_PASS = $matches[2]
    $DB_HOST = $matches[3]
    $DB_PORT = $matches[4]
    $DB_NAME = $matches[5]
} else {
    Write-Host "❌ Format DATABASE_URL tidak valid!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database Info:" -ForegroundColor Yellow
Write-Host "   Host: $DB_HOST"
Write-Host "   Port: $DB_PORT"
Write-Host "   Database: $DB_NAME"
Write-Host "   User: $DB_USER"
Write-Host ""

# Confirm skipped for automation

Write-Host ""
Write-Host "📦 Step 1: Backup Database" -ForegroundColor Cyan
Write-Host "----------------------------"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "backup_phase1_$timestamp.sql"

# Backup menggunakan mysqldump
$mysqldumpCmd = "mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME calendar_events client_feedback notifications suggestions"
Invoke-Expression "$mysqldumpCmd > $BACKUP_FILE"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup berhasil: $BACKUP_FILE" -ForegroundColor Green
} else {
    Write-Host "❌ Backup gagal!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Step 2: Jalankan Migration SQL" -ForegroundColor Cyan
Write-Host "----------------------------"

$migrationFile = "prisma\migrations\20260505230417_migrate_uuid_to_int_phase1\migration.sql"

Get-Content $migrationFile | & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration SQL berhasil" -ForegroundColor Green
} else {
    Write-Host "❌ Migration SQL gagal!" -ForegroundColor Red
    Write-Host "💡 Restore dari backup: mysql -u $DB_USER -p $DB_NAME < $BACKUP_FILE" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Step 3: Generate Prisma Client" -ForegroundColor Cyan
Write-Host "----------------------------"

npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client berhasil di-generate" -ForegroundColor Green
} else {
    Write-Host "❌ Generate Prisma Client gagal!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Step 4: Verifikasi Data" -ForegroundColor Cyan
Write-Host "----------------------------"

$verifyQuery = @"
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
"@

$verifyQuery | mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ Migrasi Fase 1 SELESAI!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Tabel yang sudah dimigrasi:"
Write-Host "   ✅ calendar_events"
Write-Host "   ✅ client_feedback"
Write-Host "   ✅ notifications"
Write-Host "   ✅ suggestions"
Write-Host ""
Write-Host "📁 Backup file: $BACKUP_FILE"
Write-Host ""
Write-Host "🎯 Langkah selanjutnya:"
Write-Host "   1. Test semua endpoint API"
Write-Host "   2. Verifikasi frontend masih berfungsi"
Write-Host "   3. Jika berhasil, lanjut ke Fase 2"
Write-Host ""
Write-Host "🔄 Rollback (jika diperlukan):"
Write-Host "   Get-Content $BACKUP_FILE | mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME"
Write-Host ""
