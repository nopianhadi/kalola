# Requirements Document: UUID to Integer ID Migration

## Introduction

Sistem ini akan melakukan migrasi database dari UUID (VARCHAR(36)) ke Integer ID (BIGINT UNSIGNED AUTO_INCREMENT) untuk semua 26 tabel dalam aplikasi. Migrasi ini mencakup perubahan pada database schema, backend code (Node.js + Prisma + Express), dan frontend code (React + TypeScript). Tujuan utama adalah meningkatkan performa database, mengurangi storage footprint, dan menyederhanakan ID generation dengan menggunakan AUTO_INCREMENT native MySQL.

## Glossary

- **Migration_System**: Sistem yang mengelola proses migrasi dari UUID ke Integer ID
- **Database_Schema**: Struktur tabel MySQL yang akan diubah
- **Prisma_Schema**: File schema.prisma yang mendefinisikan model database
- **Backend_API**: Express.js API endpoints yang menggunakan Prisma
- **Frontend_Client**: React + TypeScript application yang consume API
- **Mapping_Table**: Tabel temporary yang menyimpan mapping antara old UUID dan new Integer ID
- **Foreign_Key**: Relasi antar tabel yang harus diupdate
- **Level_1_Table**: Tabel independent tanpa foreign key dependencies (add_ons, cards, packages, promo_codes, team_members, users)
- **Level_2_Table**: Tabel yang depend pada Level 1 (clients, profiles, galleries, financial_pockets)
- **Level_3_Table**: Tabel core business (projects, gallery_images, freelancer_feedback, team_payment_records)
- **Level_4_Table**: Tabel dengan multiple dependencies (contracts, project_add_ons, project_team_assignments, project_print_items, team_project_payments, social_media_posts, wedding_day_checklists, transactions)
- **Level_5_Table**: Tabel simple independent (calendar_events, client_feedback, notifications, suggestions)
- **Rollback_Procedure**: Prosedur untuk mengembalikan database ke state sebelum migrasi
- **Data_Integrity**: Konsistensi dan validitas data setelah migrasi

## Requirements

### Requirement 1: Database Schema Migration

**User Story:** Sebagai database administrator, saya ingin mengubah semua primary key dari VARCHAR(36) UUID ke BIGINT UNSIGNED AUTO_INCREMENT, sehingga database memiliki performa lebih baik dan storage lebih efisien.

#### Acceptance Criteria

1. WHEN a table migration is initiated, THE Migration_System SHALL create a mapping table to store old UUID and new Integer ID pairs
2. WHEN a table has foreign key constraints, THE Migration_System SHALL drop all foreign key constraints before modifying column types
3. WHEN modifying a primary key column, THE Migration_System SHALL add a temporary new_id column with BIGINT UNSIGNED AUTO_INCREMENT
4. WHEN the new_id column is populated, THE Migration_System SHALL populate the mapping table with old UUID and new Integer ID pairs
5. WHEN all dependent tables are updated, THE Migration_System SHALL drop the old id column and rename new_id to id
6. WHEN column modifications are complete, THE Migration_System SHALL recreate all foreign key constraints with correct references
7. WHEN a migration step fails, THE Migration_System SHALL rollback all changes within the transaction
8. THE Migration_System SHALL migrate tables in dependency order: Level 1 → Level 2 → Level 3 → Level 4 → Level 5
9. WHEN all tables are migrated, THE Migration_System SHALL verify data integrity by comparing record counts and checking for orphaned foreign keys
10. THE Migration_System SHALL preserve all existing data without loss during migration

### Requirement 2: Prisma Schema Update

**User Story:** Sebagai backend developer, saya ingin Prisma schema diupdate untuk reflect perubahan dari String UUID ke BigInt ID, sehingga generated Prisma Client menggunakan tipe data yang benar.

#### Acceptance Criteria

1. WHEN a table is migrated, THE Prisma_Schema SHALL change the id field from `String @id @db.VarChar(36)` to `BigInt @id @default(autoincrement())`
2. WHEN a foreign key field is migrated, THE Prisma_Schema SHALL change the field type from `String?` to `BigInt?`
3. WHEN Prisma schema is updated, THE Migration_System SHALL run `npx prisma generate` to regenerate Prisma Client
4. WHEN Prisma Client is regenerated, THE Migration_System SHALL verify that all model types are correctly updated
5. THE Prisma_Schema SHALL maintain all existing relations, indexes, and constraints after migration

### Requirement 3: Backend ID Generation Removal

**User Story:** Sebagai backend developer, saya ingin menghapus semua crypto.randomUUID() calls dari backend code, sehingga ID generation dilakukan oleh database AUTO_INCREMENT.

#### Acceptance Criteria

1. WHEN creating a new record, THE Backend_API SHALL NOT include id field in the create data payload
2. WHEN creating a new record, THE Backend_API SHALL allow database to auto-generate the id value
3. THE Backend_API SHALL remove all `crypto.randomUUID()` function calls from route handlers
4. THE Backend_API SHALL remove all `crypto` module imports that are only used for UUID generation
5. WHEN a record is created successfully, THE Backend_API SHALL return the auto-generated id in the response

### Requirement 4: Backend Type Conversion

**User Story:** Sebagai backend developer, saya ingin semua route handlers mengkonversi string ID dari URL parameters ke number, sehingga Prisma queries menggunakan tipe data yang benar.

#### Acceptance Criteria

1. WHEN receiving an ID from URL parameters, THE Backend_API SHALL parse the string to integer using `parseInt(id, 10)`
2. WHEN parsing fails (NaN result), THE Backend_API SHALL return HTTP 400 Bad Request with error message "Invalid ID"
3. WHEN parsing succeeds, THE Backend_API SHALL use the numeric ID in Prisma queries
4. THE Backend_API SHALL validate that parsed ID is a positive integer greater than 0
5. WHEN ID validation fails, THE Backend_API SHALL return HTTP 400 Bad Request with descriptive error message

### Requirement 5: Backend Service Function Update

**User Story:** Sebagai backend developer, saya ingin semua service functions (denormalize, toRow, mapToDb) diupdate untuk handle Integer ID, sehingga data transformation berjalan dengan benar.

#### Acceptance Criteria

1. WHEN transforming database row to domain object, THE Backend_API SHALL convert id field to number using `Number(row.id)`
2. WHEN transforming domain object to database row, THE Backend_API SHALL NOT include id field for create operations
3. WHEN transforming domain object to database row for update operations, THE Backend_API SHALL exclude id field from the update payload
4. THE Backend_API SHALL update all foreign key fields to use number type instead of string
5. WHEN a foreign key field is null, THE Backend_API SHALL preserve the null value

### Requirement 6: Frontend Type Definition Update

**User Story:** Sebagai frontend developer, saya ingin semua TypeScript interfaces diupdate untuk menggunakan number type untuk ID fields, sehingga type checking berjalan dengan benar.

#### Acceptance Criteria

1. THE Frontend_Client SHALL change all id fields in interfaces from `string` to `number`
2. THE Frontend_Client SHALL change all foreign key fields in interfaces from `string` to `number`
3. THE Frontend_Client SHALL change all foreign key fields that are optional from `string | undefined` to `number | undefined`
4. WHEN an interface has array of IDs, THE Frontend_Client SHALL change from `string[]` to `number[]`
5. THE Frontend_Client SHALL update all type definitions in `src/types/index.ts` file

### Requirement 7: Frontend Component Update

**User Story:** Sebagai frontend developer, saya ingin semua React components diupdate untuk handle number ID, sehingga component props dan state menggunakan tipe data yang benar.

#### Acceptance Criteria

1. WHEN a component receives ID as prop, THE Frontend_Client SHALL declare prop type as `number`
2. WHEN a component stores ID in state, THE Frontend_Client SHALL use `number` type for useState
3. WHEN a component passes ID to child component, THE Frontend_Client SHALL pass as number type
4. WHEN a component uses ID in key prop, THE Frontend_Client SHALL use number directly (React accepts number keys)
5. THE Frontend_Client SHALL update all callback functions that accept ID parameter to use `number` type

### Requirement 8: Frontend URL Parameter Handling

**User Story:** Sebagai frontend developer, saya ingin URL parameters yang berisi ID dikonversi dari string ke number, sehingga API calls menggunakan tipe data yang benar.

#### Acceptance Criteria

1. WHEN reading ID from useParams hook, THE Frontend_Client SHALL parse the string to integer using `parseInt(id, 10)`
2. WHEN parsing fails (NaN result), THE Frontend_Client SHALL display error message "Invalid ID"
3. WHEN parsing succeeds, THE Frontend_Client SHALL use the numeric ID in API calls
4. WHEN ID is missing from URL, THE Frontend_Client SHALL handle the undefined case gracefully
5. THE Frontend_Client SHALL validate that parsed ID is a positive integer before making API calls

### Requirement 9: Frontend Service Function Update

**User Story:** Sebagai frontend developer, saya ingin semua service functions diupdate untuk handle number ID, sehingga API requests dan responses menggunakan tipe data yang benar.

#### Acceptance Criteria

1. WHEN calling API with ID parameter, THE Frontend_Client SHALL pass ID as number in URL path
2. WHEN receiving API response with ID field, THE Frontend_Client SHALL ensure id is converted to number using `Number(data.id)`
3. WHEN transforming API response to domain object, THE Frontend_Client SHALL convert all foreign key fields to number
4. THE Frontend_Client SHALL remove all UUID generation logic from frontend service functions
5. WHEN creating new record, THE Frontend_Client SHALL NOT include id field in request payload

### Requirement 10: Data Integrity Verification

**User Story:** Sebagai database administrator, saya ingin sistem memverifikasi data integrity setelah migrasi, sehingga tidak ada data yang hilang atau corrupted.

#### Acceptance Criteria

1. WHEN a table migration completes, THE Migration_System SHALL verify that record count matches before and after migration
2. WHEN foreign key relationships exist, THE Migration_System SHALL verify that all foreign key references are valid
3. WHEN checking for orphaned records, THE Migration_System SHALL report any records with foreign keys that don't reference existing parent records
4. THE Migration_System SHALL verify that all id values are positive integers greater than 0
5. THE Migration_System SHALL verify that AUTO_INCREMENT sequence is set correctly to max(id) + 1
6. WHEN data integrity check fails, THE Migration_System SHALL report detailed error information including table name, column name, and affected record count

### Requirement 11: Rollback Capability

**User Story:** Sebagai database administrator, saya ingin kemampuan untuk rollback migrasi jika terjadi error, sehingga database dapat dikembalikan ke state sebelum migrasi.

#### Acceptance Criteria

1. WHEN starting migration, THE Migration_System SHALL create full database backup before any changes
2. WHEN a migration step fails, THE Migration_System SHALL execute ROLLBACK to undo all changes within the transaction
3. WHEN rollback is needed after transaction commit, THE Migration_System SHALL provide SQL script to restore from backup
4. THE Migration_System SHALL store backup file with timestamp in filename format `backup_YYYYMMDD_HHMMSS.sql`
5. WHEN backup is created, THE Migration_System SHALL verify backup file integrity by checking file size is greater than 0
6. THE Migration_System SHALL log all migration steps to enable manual rollback if needed

### Requirement 12: Migration Script Generation

**User Story:** Sebagai database administrator, saya ingin migration scripts yang dapat dijalankan secara manual atau otomatis, sehingga migrasi dapat dilakukan dengan controlled manner.

#### Acceptance Criteria

1. THE Migration_System SHALL generate SQL migration script for each table
2. WHEN generating migration script, THE Migration_System SHALL include transaction boundaries (START TRANSACTION, COMMIT, ROLLBACK)
3. WHEN generating migration script, THE Migration_System SHALL include verification queries to check data integrity
4. THE Migration_System SHALL generate migration scripts in dependency order
5. WHEN a table has foreign keys, THE Migration_System SHALL include DROP FOREIGN KEY and ADD CONSTRAINT statements
6. THE Migration_System SHALL include comments in SQL script explaining each step
7. WHEN all scripts are generated, THE Migration_System SHALL create a master script that executes all table migrations in correct order

### Requirement 13: Testing and Validation

**User Story:** Sebagai QA engineer, saya ingin comprehensive testing untuk memastikan migrasi berjalan dengan benar, sehingga tidak ada regression bugs di production.

#### Acceptance Criteria

1. THE Migration_System SHALL provide unit tests for all backend service functions that handle ID conversion
2. THE Migration_System SHALL provide integration tests for all API endpoints that accept ID parameters
3. THE Migration_System SHALL provide E2E tests for critical user flows involving ID usage
4. WHEN running tests, THE Migration_System SHALL verify that all CRUD operations work correctly with Integer IDs
5. THE Migration_System SHALL provide performance tests to compare query performance before and after migration
6. WHEN performance tests complete, THE Migration_System SHALL report query execution time improvements

### Requirement 14: Documentation and Training

**User Story:** Sebagai team member, saya ingin dokumentasi lengkap tentang perubahan yang dilakukan, sehingga semua developer memahami cara kerja sistem baru.

#### Acceptance Criteria

1. THE Migration_System SHALL provide migration guide document explaining step-by-step process
2. THE Migration_System SHALL provide code examples showing before and after changes for common patterns
3. THE Migration_System SHALL document all breaking changes in API contracts
4. THE Migration_System SHALL provide troubleshooting guide for common migration issues
5. THE Migration_System SHALL document rollback procedures with detailed steps
6. WHEN documentation is complete, THE Migration_System SHALL include estimated time for each migration phase

### Requirement 15: Gradual Migration Support

**User Story:** Sebagai project manager, saya ingin kemampuan untuk melakukan migrasi secara bertahap per-table, sehingga risk dapat diminimalisir dan rollback lebih mudah.

#### Acceptance Criteria

1. THE Migration_System SHALL support migrating one table at a time
2. WHEN migrating a single table, THE Migration_System SHALL verify that all dependent tables are already migrated
3. WHEN a table is not yet migrated, THE Migration_System SHALL prevent migration of dependent tables
4. THE Migration_System SHALL maintain migration status tracking showing which tables are completed
5. WHEN resuming migration, THE Migration_System SHALL skip already-migrated tables
6. THE Migration_System SHALL allow configurable delay between table migrations for monitoring

### Requirement 16: Dual-ID System Support (Optional)

**User Story:** Sebagai database administrator, saya ingin opsi untuk menjalankan dual-ID system temporarily, sehingga rollback dapat dilakukan tanpa downtime.

#### Acceptance Criteria

1. WHERE dual-ID mode is enabled, THE Migration_System SHALL keep both old UUID column and new Integer ID column
2. WHERE dual-ID mode is enabled, THE Backend_API SHALL support querying by both UUID and Integer ID
3. WHERE dual-ID mode is enabled, THE Migration_System SHALL sync both ID columns during transition period
4. WHERE dual-ID mode is enabled, THE Migration_System SHALL provide migration path to remove UUID column after stabilization
5. WHERE dual-ID mode is enabled, THE Migration_System SHALL log usage statistics for both ID types

### Requirement 17: Foreign Key Cascade Handling

**User Story:** Sebagai database administrator, saya ingin foreign key cascade rules dipertahankan setelah migrasi, sehingga referential integrity tetap terjaga.

#### Acceptance Criteria

1. WHEN recreating foreign key constraints, THE Migration_System SHALL preserve original ON DELETE behavior (CASCADE, SET NULL, RESTRICT)
2. WHEN recreating foreign key constraints, THE Migration_System SHALL preserve original ON UPDATE behavior
3. THE Migration_System SHALL verify that cascade rules work correctly after migration by testing delete operations
4. WHEN a parent record is deleted, THE Migration_System SHALL verify that dependent records are handled according to cascade rules
5. THE Migration_System SHALL document all foreign key relationships and their cascade rules

### Requirement 18: Index Preservation

**User Story:** Sebagai database administrator, saya ingin semua indexes dipertahankan setelah migrasi, sehingga query performance tidak menurun.

#### Acceptance Criteria

1. WHEN migrating a table, THE Migration_System SHALL preserve all existing indexes except primary key
2. WHEN primary key is recreated, THE Migration_System SHALL ensure AUTO_INCREMENT creates implicit index
3. THE Migration_System SHALL preserve all unique indexes on non-ID columns
4. THE Migration_System SHALL preserve all composite indexes
5. WHEN indexes are recreated, THE Migration_System SHALL verify index usage by running EXPLAIN on common queries

### Requirement 19: Composite Primary Key Handling

**User Story:** Sebagai database administrator, saya ingin junction tables dengan composite primary keys dihandle dengan benar, sehingga many-to-many relationships tetap berfungsi.

#### Acceptance Criteria

1. WHEN migrating junction table with composite PK, THE Migration_System SHALL update both columns in the composite key
2. WHEN migrating project_add_ons table, THE Migration_System SHALL update both project_id and add_on_id columns
3. THE Migration_System SHALL preserve composite primary key constraint after migration
4. THE Migration_System SHALL verify that composite key uniqueness is maintained
5. WHEN composite key migration completes, THE Migration_System SHALL verify that no duplicate key combinations exist

### Requirement 20: Transaction Isolation

**User Story:** Sebagai database administrator, saya ingin setiap table migration berjalan dalam isolated transaction, sehingga failure pada satu table tidak affect tables lainnya.

#### Acceptance Criteria

1. WHEN migrating a table, THE Migration_System SHALL wrap all operations in a single transaction
2. WHEN a migration step fails, THE Migration_System SHALL rollback only the current table's transaction
3. THE Migration_System SHALL use appropriate transaction isolation level (READ COMMITTED or REPEATABLE READ)
4. WHEN transaction commits, THE Migration_System SHALL verify commit success before proceeding to next table
5. THE Migration_System SHALL log transaction boundaries for debugging purposes

---

**Dibuat**: 2025-01-XX  
**Status**: Draft untuk Review  
**Total Requirements**: 20  
**Total Acceptance Criteria**: 100+
