# Design Document: UUID to Integer ID Migration

## Overview

### Purpose

This design document outlines the technical approach for migrating the entire database schema from UUID-based primary keys (VARCHAR(36)) to Integer-based primary keys (BIGINT UNSIGNED AUTO_INCREMENT) across all 26 tables in the application. This migration affects three major layers: database schema, backend API (Node.js + Prisma + Express), and frontend client (React + TypeScript).

### Goals

1. **Performance Improvement**: Reduce index size and improve query performance by using native integer IDs
2. **Storage Optimization**: Reduce storage footprint by ~28 bytes per ID field
3. **Simplified ID Generation**: Leverage MySQL's native AUTO_INCREMENT instead of application-level UUID generation
4. **Data Integrity**: Ensure zero data loss and maintain all referential integrity constraints
5. **Minimal Downtime**: Execute migration with controlled downtime and clear rollback procedures

### Scope

**In Scope**:
- Database schema migration for all 26 tables
- Prisma schema updates and client regeneration
- Backend route handlers and service functions
- Frontend type definitions and components
- Migration scripts with transaction management
- Data integrity verification procedures
- Rollback mechanisms

**Out of Scope**:
- Mobile application updates (separate deployment)
- Third-party API integrations (handled separately)
- Historical data archival
- Performance optimization beyond ID migration

### Key Challenges

1. **Complex Foreign Key Dependencies**: 26 tables with 20+ foreign key relationships requiring careful dependency ordering
2. **Critical Business Data**: Projects and transactions tables are central hubs with multiple dependencies
3. **Type System Changes**: Converting from string to number types across entire codebase
4. **Zero Downtime Requirement**: Need strategy to minimize production impact
5. **Rollback Complexity**: Reverting migration after commit is extremely difficult

## Architecture

### Migration Strategy: Gradual Table-by-Table Approach

We will use a **gradual migration strategy** with dependency-ordered execution. This approach minimizes risk and allows for rollback at each stage.

#### Dependency Levels

Tables are organized into 5 dependency levels based on foreign key relationships:

```
Level 1 (Independent - No FK dependencies):
  ├─ add_ons
  ├─ cards
  ├─ packages
  ├─ promo_codes
  ├─ team_members
  └─ users

Level 2 (Depends on Level 1):
  ├─ clients (no FK but heavily referenced)
  ├─ profiles (FK: users)
  ├─ galleries (FK: users)
  └─ financial_pockets (FK: cards)

Level 3 (Core business tables):
  ├─ projects (FK: clients, packages, promo_codes) ⚠️ CRITICAL
  ├─ gallery_images (FK: galleries)
  ├─ freelancer_feedback (FK: team_members)
  └─ team_payment_records (FK: team_members)

Level 4 (Multiple dependencies):
  ├─ contracts (FK: clients, projects)
  ├─ project_add_ons (FK: projects, add_ons)
  ├─ project_team_assignments (FK: projects, team_members)
  ├─ project_print_items (FK: projects)
  ├─ team_project_payments (FK: projects, team_members)
  ├─ social_media_posts (FK: projects)
  ├─ wedding_day_checklists (FK: projects)
  └─ transactions (FK: projects, cards, financial_pockets, clients) ⚠️ COMPLEX

Level 5 (Simple independent):
  ├─ calendar_events
  ├─ client_feedback
  ├─ notifications
  └─ suggestions
```

### Database Migration Architecture

#### Mapping Table Strategy

For each table migration, we create a temporary mapping table to preserve the relationship between old UUIDs and new Integer IDs:

```sql
CREATE TABLE migration_uuid_to_id_{table_name} (
  old_uuid VARCHAR(36) PRIMARY KEY,
  new_id BIGINT UNSIGNED NOT NULL UNIQUE,
  migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

**Benefits**:
- Enables verification and debugging
- Supports rollback procedures
- Provides audit trail
- Can be kept for reference period then dropped

#### Temporary Column Strategy

Each table migration follows this pattern:

1. **Add new_id column** with AUTO_INCREMENT
2. **Populate mapping table** with old UUID → new ID pairs
3. **Update all foreign key references** in dependent tables
4. **Drop old id column** and rename new_id to id
5. **Recreate foreign key constraints** with correct types
6. **Verify data integrity**

```sql
-- Example for users table
ALTER TABLE users ADD COLUMN new_id BIGINT UNSIGNED AUTO_INCREMENT UNIQUE;

INSERT INTO migration_uuid_to_id_users (old_uuid, new_id)
SELECT id, new_id FROM users;

-- Update dependent tables...
ALTER TABLE profiles ADD COLUMN admin_user_new_id BIGINT UNSIGNED;
UPDATE profiles p
JOIN migration_uuid_to_id_users m ON p.admin_user_id = m.old_uuid
SET p.admin_user_new_id = m.new_id;

-- Swap columns...
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users CHANGE new_id id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY;
```

### Transaction Management

Each table migration is wrapped in a transaction with the following isolation strategy:

```sql
START TRANSACTION;

-- Migration steps...

-- Verification queries
SELECT COUNT(*) FROM {table_name};
SELECT MIN(id), MAX(id) FROM {table_name};

-- Commit only if verification passes
COMMIT;

-- On error:
-- ROLLBACK;
```

**Transaction Isolation Level**: `READ COMMITTED` or `REPEATABLE READ`

**Constraints**:
- Each table migration is an isolated transaction
- Failure in one table does not affect completed tables
- Allows for pause and resume between tables
- Enables gradual rollout with monitoring

### Backend Architecture Changes

#### Prisma Schema Transformation

**Before**:
```prisma
model users {
  id String @id @db.VarChar(36)
  email String @unique @db.VarChar(255)
  // ...
  galleries galleries[]
  profiles profiles[]
}

model profiles {
  id String @id @db.VarChar(36)
  admin_user_id String? @db.VarChar(36)
  users users? @relation(fields: [admin_user_id], references: [id])
}
```

**After**:
```prisma
model users {
  id BigInt @id @default(autoincrement())
  email String @unique @db.VarChar(255)
  // ...
  galleries galleries[]
  profiles profiles[]
}

model profiles {
  id BigInt @id @default(autoincrement())
  admin_user_id BigInt?
  users users? @relation(fields: [admin_user_id], references: [id])
}
```

**Regeneration Process**:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name uuid_to_int_{table_name}
```

#### Route Handler Pattern

**Before (UUID)**:
```typescript
router.get('/:id', async (req, res) => {
  const { id } = req.params; // string
  const user = await prisma.users.findUnique({
    where: { id: id }
  });
  res.json(user);
});

router.post('/', async (req, res) => {
  const data = {
    id: crypto.randomUUID(), // ❌ Application generates ID
    email: req.body.email,
    // ...
  };
  const user = await prisma.users.create({ data });
  res.status(201).json(user);
});
```

**After (Integer)**:
```typescript
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10); // ✅ Parse to integer
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  
  const user = await prisma.users.findUnique({
    where: { id: id }
  });
  res.json(user);
});

router.post('/', async (req, res) => {
  const data = {
    // ✅ No id field - database auto-generates
    email: req.body.email,
    // ...
  };
  const user = await prisma.users.create({ data });
  res.status(201).json(user);
});
```

**Key Changes**:
- Remove all `crypto.randomUUID()` calls (~40+ occurrences)
- Add `parseInt()` with validation for all ID parameters
- Return HTTP 400 for invalid ID format
- Remove `crypto` module imports where only used for UUID

#### Service Function Pattern

**Before**:
```typescript
function toRow(user: Partial<User>): any {
  return {
    id: user.id || crypto.randomUUID(), // ❌
    email: user.email,
    // ...
  };
}

function denormalize(row: any): User {
  return {
    id: row.id, // string
    email: row.email,
    // ...
  };
}
```

**After**:
```typescript
function toRow(user: Partial<User>): any {
  return {
    // ✅ No id field for create operations
    ...(user.email && { email: user.email }),
    // ...
  };
}

function denormalize(row: any): User {
  return {
    id: Number(row.id), // ✅ Ensure number type
    email: row.email,
    // ...
  };
}
```

### Frontend Architecture Changes

#### Type System Transformation

**Before**:
```typescript
export interface User {
  id: string; // ❌ UUID
  email: string;
  fullName?: string;
}

export interface Project {
  id: string; // ❌
  projectName: string;
  clientId: string; // ❌ FK as string
  packageId: string; // ❌ FK as string
}
```

**After**:
```typescript
export interface User {
  id: number; // ✅ Integer
  email: string;
  fullName?: string;
}

export interface Project {
  id: number; // ✅
  projectName: string;
  clientId: number; // ✅ FK as number
  packageId: number; // ✅ FK as number
}
```

**Affected Interfaces**: 40+ interfaces across `src/types/index.ts`

#### Component Pattern

**Before**:
```typescript
interface UserListProps {
  users: User[];
  onDelete: (id: string) => void; // ❌
}

const UserList: React.FC<UserListProps> = ({ users, onDelete }) => {
  const navigate = useNavigate();
  
  const handleEdit = (id: string) => { // ❌
    navigate(`/users/${id}`);
  };
  
  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>
          <button onClick={() => handleEdit(user.id)}>Edit</button>
        </div>
      ))}
    </div>
  );
};
```

**After**:
```typescript
interface UserListProps {
  users: User[];
  onDelete: (id: number) => void; // ✅
}

const UserList: React.FC<UserListProps> = ({ users, onDelete }) => {
  const navigate = useNavigate();
  
  const handleEdit = (id: number) => { // ✅
    navigate(`/users/${id}`);
  };
  
  return (
    <div>
      {users.map((user) => (
        <div key={user.id}> {/* ✅ React accepts number keys */}
          <button onClick={() => handleEdit(user.id)}>Edit</button>
        </div>
      ))}
    </div>
  );
};
```

#### URL Parameter Handling

**Before**:
```typescript
const { id } = useParams<{ id: string }>();

useEffect(() => {
  if (!id) return;
  getUser(id).then(setUser); // ❌ Pass string directly
}, [id]);
```

**After**:
```typescript
const { id } = useParams<{ id: string }>(); // ✅ Still string from URL

useEffect(() => {
  if (!id) return;
  
  const numericId = parseInt(id, 10); // ✅ Convert to number
  
  if (isNaN(numericId) || numericId <= 0) {
    setError('Invalid ID');
    return;
  }
  
  getUser(numericId).then(setUser); // ✅ Pass number
}, [id]);
```

## Components and Interfaces

### Database Layer Components

#### Migration Script Generator

**Responsibility**: Generate SQL migration scripts for each table

**Interface**:
```typescript
interface MigrationScriptGenerator {
  generateForTable(tableName: string): string;
  generateMasterScript(): string;
  validateDependencies(tableName: string): boolean;
}
```

**Key Functions**:
- `generateForTable()`: Creates complete migration SQL for a single table
- `generateMasterScript()`: Creates orchestration script for all tables
- `validateDependencies()`: Ensures prerequisite tables are migrated

#### Data Integrity Verifier

**Responsibility**: Verify data consistency after migration

**Interface**:
```typescript
interface DataIntegrityVerifier {
  verifyRecordCount(tableName: string): boolean;
  verifyForeignKeys(tableName: string): boolean;
  verifyAutoIncrement(tableName: string): boolean;
  generateReport(): IntegrityReport;
}
```

**Verification Checks**:
1. Record count matches before/after
2. No orphaned foreign key references
3. All IDs are positive integers
4. AUTO_INCREMENT sequence is correct
5. No duplicate IDs exist

### Backend Layer Components

#### ID Parser Middleware

**Responsibility**: Parse and validate ID parameters from requests

**Interface**:
```typescript
interface IDParser {
  parseID(value: string): number | null;
  validateID(id: number): boolean;
  middleware(req: Request, res: Response, next: NextFunction): void;
}
```

**Implementation**:
```typescript
const parseID = (value: string): number | null => {
  const id = parseInt(value, 10);
  return (isNaN(id) || id <= 0) ? null : id;
};

const idParserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id) {
    const id = parseID(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    req.params.id = id.toString(); // Keep as string in params
  }
  next();
};
```

#### Service Function Transformer

**Responsibility**: Transform data between database and domain models

**Interface**:
```typescript
interface ServiceTransformer<T> {
  toRow(entity: Partial<T>): any;
  fromRow(row: any): T;
  toRowForCreate(entity: Omit<T, 'id'>): any;
  toRowForUpdate(entity: Partial<T>): any;
}
```

**Key Behaviors**:
- `toRowForCreate()`: Excludes id field
- `toRowForUpdate()`: Excludes id from update payload
- `fromRow()`: Converts id to number using `Number()`

### Frontend Layer Components

#### Type Guard Utilities

**Responsibility**: Runtime type checking for IDs

**Interface**:
```typescript
interface TypeGuards {
  isValidID(value: unknown): value is number;
  isValidIDString(value: string): boolean;
  parseIDFromURL(value: string | undefined): number | null;
}
```

**Implementation**:
```typescript
const isValidID = (value: unknown): value is number => {
  return typeof value === 'number' && value > 0 && Number.isInteger(value);
};

const parseIDFromURL = (value: string | undefined): number | null => {
  if (!value) return null;
  const id = parseInt(value, 10);
  return isValidID(id) ? id : null;
};
```

#### API Client Adapter

**Responsibility**: Handle ID conversion in API calls

**Interface**:
```typescript
interface APIClient {
  get<T>(endpoint: string, id: number): Promise<T>;
  create<T>(endpoint: string, data: Omit<T, 'id'>): Promise<T>;
  update<T>(endpoint: string, id: number, data: Partial<T>): Promise<T>;
  delete(endpoint: string, id: number): Promise<void>;
}
```

**Key Behaviors**:
- Accepts number IDs in method signatures
- Converts to string for URL construction
- Ensures response IDs are converted to numbers

## Data Models

### Database Schema Changes

#### Primary Key Transformation

**Before**:
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  -- ...
);
```

**After**:
```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  -- ...
);
```

**Storage Impact**:
- UUID: 36 bytes (VARCHAR(36))
- Integer: 8 bytes (BIGINT UNSIGNED)
- **Savings**: 28 bytes per ID field

#### Foreign Key Transformation

**Before**:
```sql
CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  admin_user_id VARCHAR(36),
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE RESTRICT
);
```

**After**:
```sql
CREATE TABLE profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_user_id BIGINT UNSIGNED,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE RESTRICT
);
```

**Cascade Rules Preservation**:
- All ON DELETE behaviors preserved (CASCADE, SET NULL, RESTRICT)
- All ON UPDATE behaviors preserved
- Verified through test delete operations

#### Composite Primary Key Handling

**Table**: `project_add_ons` (junction table)

**Before**:
```sql
CREATE TABLE project_add_ons (
  project_id VARCHAR(36),
  add_on_id VARCHAR(36),
  PRIMARY KEY (project_id, add_on_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE CASCADE
);
```

**After**:
```sql
CREATE TABLE project_add_ons (
  project_id BIGINT UNSIGNED,
  add_on_id BIGINT UNSIGNED,
  PRIMARY KEY (project_id, add_on_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE CASCADE
);
```

**Migration Strategy**:
- No separate ID column to migrate
- Update both FK columns simultaneously
- Preserve composite PK constraint
- Verify no duplicate combinations exist

### Prisma Model Changes

#### Model Definition Pattern

**Before**:
```prisma
model users {
  id               String      @id @db.VarChar(36)
  email            String      @unique(map: "email") @db.VarChar(255)
  password         String?     @db.VarChar(255)
  full_name        String?     @db.VarChar(255)
  created_at       DateTime    @default(now()) @db.Timestamp(0)
  updated_at       DateTime    @default(now()) @db.Timestamp(0)
  galleries        galleries[]
  profiles         profiles[]
}

model profiles {
  id            String   @id @db.VarChar(36)
  admin_user_id String?  @db.VarChar(36)
  full_name     String?  @db.VarChar(255)
  users         users?   @relation(fields: [admin_user_id], references: [id], onUpdate: Restrict, map: "profiles_ibfk_1")
  
  @@index([admin_user_id], map: "admin_user_id")
}
```

**After**:
```prisma
model users {
  id               BigInt      @id @default(autoincrement())
  email            String      @unique(map: "email") @db.VarChar(255)
  password         String?     @db.VarChar(255)
  full_name        String?     @db.VarChar(255)
  created_at       DateTime    @default(now()) @db.Timestamp(0)
  updated_at       DateTime    @default(now()) @db.Timestamp(0)
  galleries        galleries[]
  profiles         profiles[]
}

model profiles {
  id            BigInt   @id @default(autoincrement())
  admin_user_id BigInt?
  full_name     String?  @db.VarChar(255)
  users         users?   @relation(fields: [admin_user_id], references: [id], onUpdate: Restrict, map: "profiles_ibfk_1")
  
  @@index([admin_user_id], map: "admin_user_id")
}
```

**Key Changes**:
- `String @id @db.VarChar(36)` → `BigInt @id @default(autoincrement())`
- Foreign key fields: `String?` → `BigInt?`
- Relation definitions remain unchanged
- Indexes remain unchanged

### TypeScript Type Definitions

#### Domain Model Pattern

**Before**:
```typescript
export interface User {
  id: string;
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  role?: string;
  permissions?: string[];
  restrictedCards?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  id: string;
  adminUserId?: string; // FK
  fullName?: string;
  email?: string;
  // ...
}
```

**After**:
```typescript
export interface User {
  id: number; // ✅
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  role?: string;
  permissions?: string[];
  restrictedCards?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  id: number; // ✅
  adminUserId?: number; // ✅ FK as number
  fullName?: string;
  email?: string;
  // ...
}
```

#### Complex Model Example: Project

**Before**:
```typescript
export interface Project {
  id: string;
  projectName: string;
  clientId: string; // FK
  clientName?: string;
  packageId: string; // FK
  packageName?: string;
  promoCodeId?: string; // FK
  date: string;
  location?: string;
  status?: string;
  totalCost?: number;
  amountPaid?: number;
  // ... 50+ more fields
}
```

**After**:
```typescript
export interface Project {
  id: number; // ✅
  projectName: string;
  clientId: number; // ✅ FK
  clientName?: string;
  packageId: number; // ✅ FK
  packageName?: string;
  promoCodeId?: number; // ✅ FK (optional)
  date: string;
  location?: string;
  status?: string;
  totalCost?: number;
  amountPaid?: number;
  // ... 50+ more fields
}
```

#### Transaction Model (4 Foreign Keys)

**Before**:
```typescript
export interface Transaction {
  id: string;
  date: string;
  description?: string;
  amount: number;
  type: string;
  projectId?: string; // FK
  cardId?: string; // FK
  pocketId?: string; // FK
  clientId?: string; // FK
  category?: string;
  method?: string;
}
```

**After**:
```typescript
export interface Transaction {
  id: number; // ✅
  date: string;
  description?: string;
  amount: number;
  type: string;
  projectId?: number; // ✅ FK
  cardId?: number; // ✅ FK
  pocketId?: number; // ✅ FK
  clientId?: number; // ✅ FK
  category?: string;
  method?: string;
}
```

### Mapping Table Schema

For audit and rollback purposes, each table gets a mapping table:

```sql
CREATE TABLE migration_uuid_to_id_{table_name} (
  old_uuid VARCHAR(36) PRIMARY KEY,
  new_id BIGINT UNSIGNED NOT NULL UNIQUE,
  migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_new_id (new_id)
) ENGINE=InnoDB;
```

**Retention Policy**:
- Keep for 30 days after migration
- Use for debugging and verification
- Drop after stabilization period

**Usage**:
```sql
-- Find new ID for old UUID
SELECT new_id FROM migration_uuid_to_id_users 
WHERE old_uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Verify all mappings exist
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM migration_uuid_to_id_users;
-- Should match!
```


## Error Handling

### Database Migration Errors

#### Transaction Rollback Strategy

**Error Categories**:

1. **Schema Modification Errors**
   - Foreign key constraint violations
   - Column type conversion failures
   - Index creation failures

**Handling**:
```sql
START TRANSACTION;

-- Migration steps...

-- If any error occurs, automatic ROLLBACK
-- Manual verification before COMMIT
SELECT 'Verification passed' as status;

COMMIT;
```

2. **Data Integrity Errors**
   - Orphaned foreign key references
   - Duplicate ID values
   - NULL values in NOT NULL columns

**Handling**:
- Pre-migration validation queries
- Abort migration if integrity issues found
- Fix data issues before retry

3. **Timeout Errors**
   - Large table migrations exceeding timeout
   - Lock wait timeout on busy tables

**Handling**:
- Increase `innodb_lock_wait_timeout` for migration
- Schedule during low-traffic periods
- Split large tables into batches if needed

#### Error Recovery Procedures

**Scenario 1: Migration fails mid-transaction**
```sql
-- Automatic ROLLBACK occurs
-- No manual intervention needed
-- Retry after fixing issue
```

**Scenario 2: Migration succeeds but verification fails**
```sql
-- Do NOT commit
ROLLBACK;

-- Investigate verification failure
-- Fix root cause
-- Retry migration
```

**Scenario 3: Migration committed but application errors**
```sql
-- Restore from backup
mysql -u root -p database_name < backup_before_migration.sql

-- Or use mapping tables to reverse
-- (Complex, requires custom script)
```

### Backend API Errors

#### Invalid ID Format Errors

**Error**: Client sends non-numeric ID

**Handling**:
```typescript
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'ID must be a positive integer',
      received: req.params.id
    });
  }
  
  if (id <= 0) {
    return res.status(400).json({
      error: 'Invalid ID value',
      message: 'ID must be greater than 0',
      received: id
    });
  }
  
  // Continue with valid ID...
});
```

**HTTP Status**: 400 Bad Request

#### ID Not Found Errors

**Error**: Valid ID format but record doesn't exist

**Handling**:
```typescript
const user = await prisma.users.findUnique({
  where: { id: id }
});

if (!user) {
  return res.status(404).json({
    error: 'User not found',
    message: `No user exists with ID ${id}`
  });
}
```

**HTTP Status**: 404 Not Found

#### Prisma Type Errors

**Error**: Type mismatch in Prisma queries

**Handling**:
```typescript
try {
  const user = await prisma.users.create({
    data: {
      // Ensure all IDs are numbers
      id: undefined, // Let DB auto-generate
      email: data.email,
      // ...
    }
  });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A user with this email already exists'
      });
    }
  }
  
  console.error('[Prisma Error]', error);
  return res.status(500).json({
    error: 'Database error',
    message: 'Failed to create user'
  });
}
```

### Frontend Errors

#### URL Parameter Parsing Errors

**Error**: Invalid ID in URL

**Handling**:
```typescript
const { id } = useParams<{ id: string }>();
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!id) {
    setError('No ID provided');
    return;
  }
  
  const numericId = parseInt(id, 10);
  
  if (isNaN(numericId) || numericId <= 0) {
    setError('Invalid ID format');
    return;
  }
  
  // Fetch data with valid ID...
  fetchUser(numericId)
    .catch(err => {
      if (err.status === 404) {
        setError('User not found');
      } else {
        setError('Failed to load user');
      }
    });
}, [id]);

if (error) {
  return <ErrorMessage message={error} />;
}
```

#### Type Conversion Errors

**Error**: API returns string ID instead of number

**Handling**:
```typescript
function fromRow(row: any): User {
  return {
    id: Number(row.id), // Force conversion
    email: row.email,
    // ...
  };
}

// Validation
if (!Number.isInteger(user.id) || user.id <= 0) {
  console.error('Invalid user ID received:', user.id);
  throw new Error('Invalid data from API');
}
```

#### API Call Errors

**Error**: Network or server errors

**Handling**:
```typescript
async function getUser(id: number): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Invalid ID format');
      }
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('Failed to fetch user');
    }
    
    const data = await response.json();
    return fromRow(data);
  } catch (error) {
    console.error('[API Error]', error);
    throw error;
  }
}
```

### Rollback Procedures

#### Full Database Rollback

**When**: Critical failure after migration commit

**Procedure**:
```bash
# 1. Stop application
pm2 stop all

# 2. Restore from backup
mysql -u root -p database_name < backup_before_migration.sql

# 3. Verify restoration
mysql -u root -p database_name -e "SELECT COUNT(*) FROM users;"

# 4. Revert code changes
git checkout main
git pull origin main

# 5. Restart application
pm2 start all
```

**Downtime**: 15-30 minutes

#### Partial Table Rollback

**When**: Single table migration fails

**Procedure**:
```sql
-- If transaction not committed yet
ROLLBACK;

-- If already committed, restore specific table
-- (Requires table-specific backup)
DROP TABLE users;
-- Restore from table backup
-- Recreate foreign keys
```

#### Code Rollback

**When**: Application errors after deployment

**Procedure**:
```bash
# 1. Revert backend changes
cd backend
git revert <commit-hash>
npm install
pm2 restart backend

# 2. Revert frontend changes
cd ..
git revert <commit-hash>
npm install
npm run build
pm2 restart frontend
```

### Monitoring and Alerting

#### Migration Progress Monitoring

**Metrics to Track**:
- Records migrated per table
- Migration duration per table
- Error count and types
- Database lock wait times
- Transaction log size

**Logging**:
```typescript
console.log(`[Migration] Starting table: ${tableName}`);
console.log(`[Migration] Records to migrate: ${recordCount}`);
console.log(`[Migration] Estimated time: ${estimatedMinutes} minutes`);

// After completion
console.log(`[Migration] Completed table: ${tableName}`);
console.log(`[Migration] Duration: ${actualMinutes} minutes`);
console.log(`[Migration] Records migrated: ${migratedCount}`);
console.log(`[Migration] Verification: ${verificationStatus}`);
```

#### Post-Migration Monitoring

**Metrics to Track**:
- API response times (should improve)
- Database query performance
- Error rates (should not increase)
- Memory usage (should decrease)

**Alerts**:
- HTTP 400 errors spike (ID parsing issues)
- HTTP 500 errors spike (database issues)
- Query performance degradation
- Foreign key constraint violations

## Testing Strategy

### Overview

This migration requires comprehensive testing at multiple levels due to its impact across the entire stack. We will NOT use property-based testing for this migration as it involves infrastructure changes, database schema modifications, and configuration updates rather than algorithmic logic with universal properties.

**Testing Approach**:
- **Unit Tests**: Service functions, type conversions, ID parsing
- **Integration Tests**: API endpoints, database operations
- **End-to-End Tests**: Critical user flows
- **Manual QA**: Visual verification, edge cases
- **Performance Tests**: Query performance comparison

### Unit Testing

#### Backend Service Functions

**Test Coverage**:
- ID parsing and validation
- Type conversion (string → number)
- Data transformation (toRow, fromRow)
- Error handling

**Example Tests**:
```typescript
describe('ID Parser', () => {
  it('should parse valid integer ID', () => {
    expect(parseID('123')).toBe(123);
  });
  
  it('should return null for invalid ID', () => {
    expect(parseID('abc')).toBeNull();
    expect(parseID('-5')).toBeNull();
    expect(parseID('0')).toBeNull();
  });
  
  it('should return null for UUID format', () => {
    expect(parseID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBeNull();
  });
});

describe('User Service', () => {
  it('should convert row to User with number ID', () => {
    const row = { id: 123, email: 'test@example.com' };
    const user = denormalize(row);
    
    expect(user.id).toBe(123);
    expect(typeof user.id).toBe('number');
  });
  
  it('should not include ID in create payload', () => {
    const user = { email: 'test@example.com', fullName: 'Test' };
    const row = toRow(user);
    
    expect(row.id).toBeUndefined();
  });
});
```

#### Frontend Type Guards

**Test Coverage**:
- ID validation
- URL parameter parsing
- Type conversions

**Example Tests**:
```typescript
describe('Type Guards', () => {
  it('should validate positive integers', () => {
    expect(isValidID(123)).toBe(true);
    expect(isValidID(0)).toBe(false);
    expect(isValidID(-5)).toBe(false);
    expect(isValidID(1.5)).toBe(false);
    expect(isValidID('123')).toBe(false);
  });
  
  it('should parse ID from URL', () => {
    expect(parseIDFromURL('123')).toBe(123);
    expect(parseIDFromURL('abc')).toBeNull();
    expect(parseIDFromURL(undefined)).toBeNull();
  });
});
```

### Integration Testing

#### API Endpoint Tests

**Test Coverage**:
- CRUD operations with integer IDs
- ID validation in routes
- Foreign key relationships
- Error responses

**Example Tests**:
```typescript
describe('Users API', () => {
  let createdUserId: number;
  
  it('POST /users should create user with auto-generated ID', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.id).toBeGreaterThan(0);
    expect(typeof response.body.id).toBe('number');
    
    createdUserId = response.body.id;
  });
  
  it('GET /users/:id should return user by integer ID', async () => {
    const response = await request(app)
      .get(`/api/users/${createdUserId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdUserId);
  });
  
  it('GET /users/:id should return 400 for invalid ID', async () => {
    const response = await request(app)
      .get('/api/users/invalid');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid ID');
  });
  
  it('GET /users/:id should return 404 for non-existent ID', async () => {
    const response = await request(app)
      .get('/api/users/999999');
    
    expect(response.status).toBe(404);
  });
  
  it('DELETE /users/:id should delete user', async () => {
    const response = await request(app)
      .delete(`/api/users/${createdUserId}`);
    
    expect(response.status).toBe(204);
  });
});
```

#### Database Integration Tests

**Test Coverage**:
- Foreign key constraints
- CASCADE behaviors
- AUTO_INCREMENT functionality
- Transaction rollback

**Example Tests**:
```typescript
describe('Database Foreign Keys', () => {
  it('should cascade delete from users to profiles', async () => {
    const user = await prisma.users.create({
      data: { email: 'test@example.com', password: 'test' }
    });
    
    const profile = await prisma.profiles.create({
      data: { admin_user_id: user.id, full_name: 'Test' }
    });
    
    await prisma.users.delete({ where: { id: user.id } });
    
    const deletedProfile = await prisma.profiles.findUnique({
      where: { id: profile.id }
    });
    
    expect(deletedProfile).toBeNull();
  });
  
  it('should auto-increment IDs', async () => {
    const user1 = await prisma.users.create({
      data: { email: 'user1@example.com', password: 'test' }
    });
    
    const user2 = await prisma.users.create({
      data: { email: 'user2@example.com', password: 'test' }
    });
    
    expect(user2.id).toBeGreaterThan(user1.id);
  });
});
```

### End-to-End Testing

#### Critical User Flows

**Test Scenarios**:

1. **User Registration and Login**
   - Create new user account
   - Login with credentials
   - Verify user ID in session

2. **Project Creation Flow**
   - Create client
   - Create project with client ID
   - Add team members to project
   - Verify all IDs are integers

3. **Transaction Flow**
   - Create transaction with project ID
   - Link to card and pocket
   - Verify foreign key relationships

4. **Gallery Upload Flow**
   - Create gallery
   - Upload images
   - Verify gallery ID and image IDs

**Example E2E Test**:
```typescript
describe('Project Creation Flow', () => {
  it('should create complete project with relationships', async () => {
    // 1. Create client
    const client = await createClient({
      name: 'Test Client',
      email: 'client@example.com'
    });
    expect(typeof client.id).toBe('number');
    
    // 2. Create project
    const project = await createProject({
      projectName: 'Wedding Photography',
      clientId: client.id,
      date: '2026-06-15'
    });
    expect(typeof project.id).toBe('number');
    expect(project.clientId).toBe(client.id);
    
    // 3. Add team member
    const assignment = await addTeamMember({
      projectId: project.id,
      memberId: 1,
      role: 'Photographer'
    });
    expect(assignment.projectId).toBe(project.id);
    
    // 4. Verify relationships
    const fullProject = await getProject(project.id);
    expect(fullProject.client.id).toBe(client.id);
    expect(fullProject.teamAssignments).toHaveLength(1);
  });
});
```

### Migration Verification Tests

#### Data Integrity Tests

**Test Coverage**:
- Record count preservation
- Foreign key validity
- No orphaned records
- ID uniqueness

**Verification Queries**:
```sql
-- Test 1: Record count matches
SELECT 
  'users' as table_name,
  (SELECT COUNT(*) FROM users) as current_count,
  (SELECT COUNT(*) FROM migration_uuid_to_id_users) as mapping_count;

-- Test 2: No orphaned foreign keys
SELECT COUNT(*) as orphaned_profiles
FROM profiles p
LEFT JOIN users u ON p.admin_user_id = u.id
WHERE p.admin_user_id IS NOT NULL AND u.id IS NULL;

-- Test 3: All IDs are positive integers
SELECT COUNT(*) as invalid_ids
FROM users
WHERE id <= 0 OR id IS NULL;

-- Test 4: AUTO_INCREMENT is correct
SELECT 
  MAX(id) as max_id,
  AUTO_INCREMENT as next_id
FROM users, information_schema.TABLES
WHERE TABLE_NAME = 'users';
```

### Performance Testing

#### Query Performance Comparison

**Metrics to Measure**:
- SELECT by ID performance
- JOIN query performance
- INSERT performance
- Index size reduction

**Benchmark Tests**:
```sql
-- Before migration (UUID)
EXPLAIN ANALYZE
SELECT * FROM projects WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- After migration (Integer)
EXPLAIN ANALYZE
SELECT * FROM projects WHERE id = 123;

-- JOIN performance
EXPLAIN ANALYZE
SELECT p.*, c.name as client_name
FROM projects p
JOIN clients c ON p.client_id = c.id
WHERE p.id = 123;
```

**Expected Improvements**:
- Primary key lookups: 20-30% faster
- JOIN operations: 15-25% faster
- Index size: 30-40% smaller
- Memory usage: 10-20% reduction

#### Load Testing

**Test Scenarios**:
- 100 concurrent users creating projects
- 1000 requests/second to GET endpoints
- Bulk data import (1000+ records)

**Tools**:
- Apache JMeter
- k6
- Artillery

**Success Criteria**:
- Response time < 200ms for simple queries
- Response time < 500ms for complex queries
- No increase in error rate
- No memory leaks

### Manual QA Testing

#### Test Cases

1. **URL Navigation**
   - Navigate to `/projects/123` (integer ID)
   - Verify page loads correctly
   - Verify no console errors

2. **Form Submissions**
   - Create new project
   - Verify ID is auto-generated
   - Verify ID is displayed as number

3. **Data Display**
   - View project list
   - Verify IDs display correctly
   - Verify sorting by ID works

4. **Error Scenarios**
   - Navigate to `/projects/invalid`
   - Verify error message displays
   - Navigate to `/projects/999999`
   - Verify "not found" message

5. **Foreign Key Relationships**
   - Delete client with projects
   - Verify cascade behavior
   - Delete project with transactions
   - Verify cascade behavior

### Test Environment Setup

#### Staging Environment

**Requirements**:
- Copy of production database
- Separate backend/frontend instances
- Isolated from production

**Setup Steps**:
```bash
# 1. Clone production database
mysqldump -u root -p production_db > staging_backup.sql
mysql -u root -p staging_db < staging_backup.sql

# 2. Run migration on staging
mysql -u root -p staging_db < migration_scripts/master_migration.sql

# 3. Deploy updated code
cd backend
git checkout migration-branch
npm install
npm run build
pm2 restart staging-backend

cd ../frontend
npm install
npm run build
pm2 restart staging-frontend

# 4. Run test suite
npm run test:integration
npm run test:e2e
```

### Test Execution Timeline

**Week 1-2**: Unit tests development
**Week 3-4**: Integration tests development
**Week 5-6**: E2E tests development
**Week 7-8**: Staging environment testing
**Week 9-10**: Performance testing
**Week 11-12**: Manual QA and bug fixes
**Week 13**: Production deployment preparation
**Week 14**: Production deployment and monitoring

### Success Criteria

**Migration is considered successful when**:
- ✅ All unit tests pass (100% coverage for changed code)
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Data integrity verification passes
- ✅ Performance benchmarks meet targets
- ✅ No increase in error rates
- ✅ Manual QA sign-off
- ✅ Staging environment stable for 1 week
- ✅ Rollback procedure tested and documented

---

**Document Version**: 1.0  
**Created**: 2026-05-05  
**Status**: Complete - Ready for Review  
**Next Steps**: Requirements review, then proceed to task breakdown
