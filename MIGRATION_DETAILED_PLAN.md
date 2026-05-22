# Detailed Migration Plan: UUID to Integer ID

## 📋 Table-by-Table Migration Details

### Level 1: Independent Tables (No Foreign Keys)

#### 1.1 Table: `add_ons`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: `project_add_ons`

**Migration Steps**:
```sql
-- 1. Add new column
ALTER TABLE add_ons ADD COLUMN new_id BIGINT UNSIGNED AUTO_INCREMENT UNIQUE;

-- 2. Update project_add_ons
ALTER TABLE project_add_ons DROP FOREIGN KEY project_add_ons_ibfk_2;
ALTER TABLE project_add_ons ADD COLUMN add_on_new_id BIGINT UNSIGNED;

UPDATE project_add_ons pa
JOIN add_ons a ON pa.add_on_id = a.id
SET pa.add_on_new_id = a.new_id;

-- 3. Swap columns
ALTER TABLE add_ons DROP COLUMN id;
ALTER TABLE add_ons CHANGE new_id id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY;

ALTER TABLE project_add_ons DROP COLUMN add_on_id;
ALTER TABLE project_add_ons CHANGE add_on_new_id add_on_id BIGINT UNSIGNED;

-- 4. Recreate FK
ALTER TABLE project_add_ons ADD CONSTRAINT project_add_ons_ibfk_2 
  FOREIGN KEY (add_on_id) REFERENCES add_ons(id) 
  ON DELETE CASCADE ON UPDATE RESTRICT;
```

**Backend Changes**:
- `backend/src/routes/addOns.ts`: Remove `crypto.randomUUID()`
- `src/services/addOns.ts`: Update `denormalize()` function
- `src/types/index.ts`: Change `AddOn.id` from `string` to `number`

**Estimated Time**: 4-6 hours

---

#### 1.2 Table: `cards`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: `financial_pockets`, `transactions`

**Migration Steps**:
```sql
-- Similar pattern as add_ons
-- Must update 2 dependent tables: financial_pockets, transactions
```

**Backend Changes**:
- `backend/src/routes/cards.ts`
- `src/services/cards.ts`
- `src/types/index.ts`: `Card.id`

**Estimated Time**: 6-8 hours (2 dependent tables)

---

#### 1.3 Table: `packages`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: `projects`

**Migration Steps**:
```sql
-- Update projects.package_id
```

**Backend Changes**:
- `backend/src/routes/packages.ts`
- `src/services/packages.ts`
- `src/types/index.ts`: `Package.id`

**Estimated Time**: 5-7 hours

---

#### 1.4 Table: `promo_codes`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: `projects`

**Migration Steps**:
```sql
-- Update projects.promo_code_id
```

**Backend Changes**:
- `backend/src/routes/promoCodes.ts`
- `src/services/promoCodes.ts`
- `src/types/index.ts`: `PromoCode.id`

**Estimated Time**: 4-6 hours

---

#### 1.5 Table: `team_members`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: `project_team_assignments`, `team_project_payments`, `team_payment_records`, `freelancer_feedback`

**Migration Steps**:
```sql
-- Must update 4 dependent tables!
-- This is complex due to multiple dependencies
```

**Backend Changes**:
- `backend/src/routes/teamMembers.ts`
- `src/services/teamMembers.ts`
- `src/types/index.ts`: `TeamMember.id`

**Estimated Time**: 10-12 hours (4 dependent tables)

---

#### 1.6 Table: `users`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: `profiles`, `galleries`

**Migration Steps**:
```sql
-- Update profiles.admin_user_id
-- Update galleries.user_id
```

**Backend Changes**:
- `backend/src/routes/users.ts`
- `src/services/users.ts`
- `src/types/index.ts`: `User.id`
- **CRITICAL**: Authentication system might be affected!

**Estimated Time**: 8-10 hours

---

### Level 2: Tables with Level 1 Dependencies

#### 2.1 Table: `clients`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None (but heavily referenced)  
**Referenced By**: `projects`, `contracts`, `transactions`

**Migration Steps**:
```sql
-- Must update 3 dependent tables
-- projects.client_id
-- contracts.client_id
-- transactions.client_id
```

**Backend Changes**:
- `backend/src/routes/clients.ts`
- `src/services/clients.ts`
- `src/types/index.ts`: `Client.id`
- Multiple components in `src/features/clients/`

**Estimated Time**: 12-16 hours (heavily used table)

---

#### 2.2 Table: `profiles`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `users.id` (FK: admin_user_id)  
**Referenced By**: None

**Migration Steps**:
```sql
-- Depends on users migration being complete
ALTER TABLE profiles ADD COLUMN new_id BIGINT UNSIGNED AUTO_INCREMENT UNIQUE;
-- ... standard migration
```

**Backend Changes**:
- `backend/src/routes/profiles.ts`
- `src/services/profiles.ts`
- `src/types/index.ts`: `Profile.id`

**Estimated Time**: 6-8 hours

---

#### 2.3 Table: `galleries`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `users.id` (FK: user_id)  
**Referenced By**: `gallery_images`

**Migration Steps**:
```sql
-- Depends on users migration
-- Must update gallery_images.gallery_id
```

**Backend Changes**:
- `backend/src/routes/galleries.ts`
- `src/services/galleries.ts`
- `src/types/index.ts`: `Gallery.id`
- `src/features/public/components/GalleryUpload.tsx`

**Estimated Time**: 8-10 hours

---

#### 2.4 Table: `financial_pockets`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `cards.id` (FK: source_card_id)  
**Referenced By**: `transactions`

**Migration Steps**:
```sql
-- Depends on cards migration
-- Must update transactions.pocket_id
```

**Backend Changes**:
- `backend/src/routes/pockets.ts`
- `src/services/pockets.ts`
- `src/types/index.ts`: `FinancialPocket.id`

**Estimated Time**: 6-8 hours

---

### Level 3: Core Business Tables

#### 3.1 Table: `projects` ⚠️ CRITICAL
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: 
- `clients.id` (FK: client_id)
- `packages.id` (FK: package_id)
- `promo_codes.id` (FK: promo_code_id)

**Referenced By**: 
- `contracts`
- `project_add_ons`
- `project_team_assignments`
- `project_print_items`
- `team_project_payments`
- `social_media_posts`
- `transactions`
- `wedding_day_checklists`

**Migration Steps**:
```sql
-- MOST COMPLEX TABLE!
-- Must update 8 dependent tables
-- Requires careful transaction management
```

**Backend Changes**:
- `backend/src/routes/projects.ts` (large file)
- `src/services/projects.ts`
- `src/types/index.ts`: `Project.id`
- **MANY** components in `src/features/projects/`
- `src/features/projects/hooks/useProjectActions.ts`
- `src/features/projects/components/ProjectForm.tsx`

**Estimated Time**: 20-30 hours (most critical table)

---

#### 3.2 Table: `gallery_images`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `galleries.id` (FK: gallery_id)  
**Referenced By**: None

**Migration Steps**:
```sql
-- Depends on galleries migration
```

**Backend Changes**:
- `backend/src/routes/galleries.ts` (handles images)
- `src/services/galleries.ts`
- `src/types/index.ts`: `GalleryImage.id`

**Estimated Time**: 6-8 hours

---

#### 3.3 Table: `freelancer_feedback`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `team_members.id` (FK: freelancer_id)  
**Referenced By**: None

**Estimated Time**: 4-6 hours

---

#### 3.4 Table: `team_payment_records`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `team_members.id` (FK: team_member_id)  
**Referenced By**: None

**Estimated Time**: 6-8 hours

---

### Level 4: Final Dependent Tables

#### 4.1 Table: `contracts`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: 
- `clients.id` (FK: client_id)
- `projects.id` (FK: project_id)

**Estimated Time**: 8-10 hours

---

#### 4.2 Table: `project_add_ons` (Junction Table)
**Current**: Composite PK `(project_id, add_on_id)` both VARCHAR(36)  
**Target**: Composite PK `(project_id, add_on_id)` both BIGINT  
**Dependencies**: 
- `projects.id`
- `add_ons.id`

**Migration Steps**:
```sql
-- No separate ID column, just update both FK columns
```

**Estimated Time**: 4-6 hours

---

#### 4.3 Table: `project_team_assignments`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: 
- `projects.id` (FK: project_id)
- `team_members.id` (FK: member_id)

**Backend Changes**:
- `backend/src/routes/projectTeamAssignments.ts`
- `src/services/projectTeamAssignments.ts`

**Estimated Time**: 6-8 hours

---

#### 4.4 Table: `project_print_items`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `projects.id` (FK: project_id)

**Backend Changes**:
- `backend/src/routes/projectPrintItems.ts`
- `src/services/projectPrintItems.ts`

**Estimated Time**: 4-6 hours

---

#### 4.5 Table: `team_project_payments`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: 
- `projects.id` (FK: project_id)
- `team_members.id` (FK: team_member_id)

**Backend Changes**:
- `backend/src/routes/teamProjectPayments.ts`
- `src/services/teamProjectPayments.ts`

**Estimated Time**: 6-8 hours

---

#### 4.6 Table: `social_media_posts`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `projects.id` (FK: project_id)

**Estimated Time**: 4-6 hours

---

#### 4.7 Table: `wedding_day_checklists`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: `projects.id` (FK: project_id)

**Backend Changes**:
- `backend/src/routes/weddingDayChecklist.ts`
- `src/services/weddingDayChecklist.ts`

**Estimated Time**: 4-6 hours

---

#### 4.8 Table: `transactions` ⚠️ COMPLEX
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: 
- `projects.id` (FK: project_id)
- `cards.id` (FK: card_id)
- `financial_pockets.id` (FK: pocket_id)
- `clients.id` (FK: client_id)

**Migration Steps**:
```sql
-- 4 foreign keys to update!
-- Critical financial data
```

**Backend Changes**:
- `backend/src/routes/transactions.ts`
- `src/services/transactions.ts`
- `src/types/index.ts`: `Transaction.id`

**Estimated Time**: 12-16 hours (financial data, 4 FKs)

---

### Level 5: Simple Independent Tables

#### 5.1 Table: `calendar_events`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: None

**Estimated Time**: 3-4 hours

---

#### 5.2 Table: `client_feedback`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: None

**Estimated Time**: 3-4 hours

---

#### 5.3 Table: `notifications`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: None

**Estimated Time**: 3-4 hours

---

#### 5.4 Table: `suggestions`
**Current**: `id VARCHAR(36)`  
**Target**: `id BIGINT UNSIGNED AUTO_INCREMENT`  
**Dependencies**: None  
**Referenced By**: None

**Estimated Time**: 3-4 hours

---

## 📊 Total Effort Summary

| Level | Tables | Estimated Hours | Priority |
|-------|--------|----------------|----------|
| Level 1 | 6 tables | 37-49 hours | 🔴 High |
| Level 2 | 4 tables | 32-42 hours | 🟡 Medium |
| Level 3 | 4 tables | 36-52 hours | 🔴 Critical |
| Level 4 | 8 tables | 48-66 hours | 🟡 Medium |
| Level 5 | 4 tables | 12-16 hours | 🟢 Low |
| **TOTAL** | **26 tables** | **165-225 hours** | |

**Additional Tasks**:
- Testing: 40-60 hours
- Documentation: 10-15 hours
- Bug fixes: 20-30 hours
- **GRAND TOTAL**: **235-330 hours** (6-8 weeks full-time)

---

## 🔄 Recommended Migration Order

### Week 1-2: Preparation
- [ ] Full database backup
- [ ] Setup staging environment
- [ ] Create migration scripts
- [ ] Update development environment

### Week 3-4: Level 1 (Independent Tables)
- [ ] add_ons
- [ ] promo_codes
- [ ] calendar_events
- [ ] notifications
- [ ] suggestions
- [ ] client_feedback

### Week 5-6: Level 1 (Complex Independent)
- [ ] cards
- [ ] packages
- [ ] team_members
- [ ] users

### Week 7-8: Level 2
- [ ] profiles
- [ ] galleries
- [ ] financial_pockets
- [ ] clients

### Week 9-10: Level 3
- [ ] gallery_images
- [ ] freelancer_feedback
- [ ] team_payment_records
- [ ] **projects** (most critical!)

### Week 11-12: Level 4
- [ ] contracts
- [ ] project_add_ons
- [ ] project_team_assignments
- [ ] project_print_items
- [ ] team_project_payments
- [ ] social_media_posts
- [ ] wedding_day_checklists
- [ ] transactions

### Week 13-14: Testing & Stabilization
- [ ] Full regression testing
- [ ] Performance testing
- [ ] Bug fixes
- [ ] Documentation

---

## 🚨 Critical Path Items

1. **users** → Must be done early (authentication dependency)
2. **clients** → Many tables depend on this
3. **projects** → Central hub, most complex
4. **transactions** → Financial data, must be perfect

---

## 📝 Code Change Checklist Per Table

For each table migration:

### Backend
- [ ] Update Prisma schema (`backend/prisma/schema.prisma`)
- [ ] Run `npx prisma generate`
- [ ] Update route file (`backend/src/routes/*.ts`)
  - [ ] Remove `crypto.randomUUID()` calls
  - [ ] Update type annotations
  - [ ] Update query parameters
- [ ] Update service file (`src/services/*.ts`)
  - [ ] Update `denormalize()` / `toRow()` functions
  - [ ] Remove UUID generation
  - [ ] Update type annotations

### Frontend
- [ ] Update type definition (`src/types/index.ts`)
- [ ] Update all components using this type
- [ ] Update hooks (`src/hooks/*.ts`, `src/features/*/hooks/*.ts`)
- [ ] Update forms (`src/features/*/components/*Form.tsx`)
- [ ] Update list/table components
- [ ] Update detail pages
- [ ] Update URL parameter handling

### Testing
- [ ] Unit tests for service functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user flows
- [ ] Manual QA testing

---

## 🛡️ Rollback Plan

If migration fails:

```sql
-- Restore from backup
mysql -u root -p database_name < backup_before_migration.sql

-- Or if using dual-ID system:
-- Just drop new_id columns and keep using old id
ALTER TABLE users DROP COLUMN new_id;
```

**Important**: Test rollback procedure in staging first!

---

**Last Updated**: 2026-05-05  
**Status**: Detailed Planning Document
