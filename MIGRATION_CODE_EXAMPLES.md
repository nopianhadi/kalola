# Migration Code Examples: UUID to Integer ID

## 📝 Contoh Kode Konkret untuk Migrasi

### 1. Database Migration Script

#### Complete Migration Script untuk Table `users`

```sql
-- ============================================
-- MIGRATION SCRIPT: users table
-- UUID (VARCHAR 36) → Integer (BIGINT AUTO_INCREMENT)
-- ============================================

-- STEP 0: Backup (run this first!)
-- mysqldump -u root -p database_name users > backup_users_table.sql

START TRANSACTION;

-- STEP 1: Create mapping table for reference
CREATE TABLE IF NOT EXISTS migration_uuid_to_id_users (
  old_uuid VARCHAR(36) PRIMARY KEY,
  new_id BIGINT UNSIGNED NOT NULL UNIQUE,
  migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- STEP 2: Add new_id column to users table
ALTER TABLE users 
  ADD COLUMN new_id BIGINT UNSIGNED AUTO_INCREMENT UNIQUE AFTER id;

-- STEP 3: Populate mapping table
INSERT INTO migration_uuid_to_id_users (old_uuid, new_id)
SELECT id, new_id FROM users;

-- STEP 4: Update dependent tables - profiles
-- 4a. Drop foreign key constraint
ALTER TABLE profiles DROP FOREIGN KEY profiles_ibfk_1;

-- 4b. Add temporary column
ALTER TABLE profiles ADD COLUMN admin_user_new_id BIGINT UNSIGNED AFTER admin_user_id;

-- 4c. Populate new column using mapping
UPDATE profiles p
INNER JOIN migration_uuid_to_id_users m ON p.admin_user_id = m.old_uuid
SET p.admin_user_new_id = m.new_id;

-- STEP 5: Update dependent tables - galleries
ALTER TABLE galleries DROP FOREIGN KEY galleries_ibfk_1;
ALTER TABLE galleries ADD COLUMN user_new_id BIGINT UNSIGNED AFTER user_id;

UPDATE galleries g
INNER JOIN migration_uuid_to_id_users m ON g.user_id = m.old_uuid
SET g.user_new_id = m.new_id;

-- STEP 6: Verify data integrity
SELECT 
  'users' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT id) as unique_old_ids,
  COUNT(DISTINCT new_id) as unique_new_ids
FROM users
UNION ALL
SELECT 
  'profiles',
  COUNT(*),
  COUNT(DISTINCT admin_user_id),
  COUNT(DISTINCT admin_user_new_id)
FROM profiles
UNION ALL
SELECT 
  'galleries',
  COUNT(*),
  COUNT(DISTINCT user_id),
  COUNT(DISTINCT user_new_id)
FROM galleries;

-- STEP 7: Drop old columns and rename new columns
-- 7a. Users table
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users CHANGE COLUMN new_id id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY;

-- 7b. Profiles table
ALTER TABLE profiles DROP COLUMN admin_user_id;
ALTER TABLE profiles CHANGE COLUMN admin_user_new_id admin_user_id BIGINT UNSIGNED;

-- 7c. Galleries table
ALTER TABLE galleries DROP COLUMN user_id;
ALTER TABLE galleries CHANGE COLUMN user_new_id user_id BIGINT UNSIGNED;

-- STEP 8: Recreate foreign key constraints
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_ibfk_1 
  FOREIGN KEY (admin_user_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE galleries 
  ADD CONSTRAINT galleries_ibfk_1 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE ON UPDATE RESTRICT;

-- STEP 9: Recreate indexes if needed
-- (AUTO_INCREMENT already creates index on PRIMARY KEY)

-- STEP 10: Final verification
SELECT 
  'users' as table_name,
  COUNT(*) as total_records,
  MIN(id) as min_id,
  MAX(id) as max_id
FROM users
UNION ALL
SELECT 
  'profiles',
  COUNT(*),
  MIN(admin_user_id),
  MAX(admin_user_id)
FROM profiles WHERE admin_user_id IS NOT NULL
UNION ALL
SELECT 
  'galleries',
  COUNT(*),
  MIN(user_id),
  MAX(user_id)
FROM galleries WHERE user_id IS NOT NULL;

-- STEP 11: Commit if everything looks good
COMMIT;

-- Keep mapping table for reference (optional: drop after 1 month)
-- DROP TABLE migration_uuid_to_id_users;

-- ============================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================
-- ROLLBACK;
-- Or restore from backup:
-- mysql -u root -p database_name < backup_users_table.sql
```

---

### 2. Prisma Schema Changes

#### Before (UUID)
```prisma
// backend/prisma/schema.prisma

model users {
  id               String      @id @db.VarChar(36)
  email            String      @unique(map: "email") @db.VarChar(255)
  password         String?     @db.VarChar(255)
  full_name        String?     @db.VarChar(255)
  company_name     String?     @db.VarChar(255)
  role             String?     @default("Member") @db.VarChar(50)
  permissions      String?     @db.LongText
  restricted_cards String?     @db.LongText
  created_at       DateTime    @default(now()) @db.Timestamp(0)
  updated_at       DateTime    @default(now()) @db.Timestamp(0)
  galleries        galleries[]
  profiles         profiles[]
}

model profiles {
  id            String   @id @db.VarChar(36)
  admin_user_id String?  @db.VarChar(36)
  full_name     String?  @db.VarChar(255)
  // ... other fields
  users         users?   @relation(fields: [admin_user_id], references: [id], onUpdate: Restrict, map: "profiles_ibfk_1")
  
  @@index([admin_user_id], map: "admin_user_id")
}
```

#### After (Integer)
```prisma
// backend/prisma/schema.prisma

model users {
  id               BigInt      @id @default(autoincrement())
  email            String      @unique(map: "email") @db.VarChar(255)
  password         String?     @db.VarChar(255)
  full_name        String?     @db.VarChar(255)
  company_name     String?     @db.VarChar(255)
  role             String?     @default("Member") @db.VarChar(50)
  permissions      String?     @db.LongText
  restricted_cards String?     @db.LongText
  created_at       DateTime    @default(now()) @db.Timestamp(0)
  updated_at       DateTime    @default(now()) @db.Timestamp(0)
  galleries        galleries[]
  profiles         profiles[]
}

model profiles {
  id            BigInt   @id @default(autoincrement())
  admin_user_id BigInt?
  full_name     String?  @db.VarChar(255)
  // ... other fields
  users         users?   @relation(fields: [admin_user_id], references: [id], onUpdate: Restrict, map: "profiles_ibfk_1")
  
  @@index([admin_user_id], map: "admin_user_id")
}
```

**After changing schema**:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name uuid_to_int_users
```

---

### 3. Backend Route Changes

#### Before (UUID)
```typescript
// backend/src/routes/users.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params; // id is string from URL
    const user = await (prisma as any).users.findUnique({
      where: { id: id } // UUID string
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error: any) {
    console.error('[GET /users/:id] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users
router.post('/', async (req, res) => {
  try {
    const data = {
      id: crypto.randomUUID(), // ❌ Generate UUID
      email: req.body.email,
      password: req.body.password,
      full_name: req.body.fullName,
      company_name: req.body.companyName,
      role: req.body.role || 'Member'
    };
    
    const user = await (prisma as any).users.create({ data });
    res.status(201).json(user);
  } catch (error: any) {
    console.error('[POST /users] Error:', error?.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /users/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params; // UUID string
    const data = {
      ...(req.body.email && { email: req.body.email }),
      ...(req.body.fullName && { full_name: req.body.fullName }),
      ...(req.body.companyName && { company_name: req.body.companyName }),
      ...(req.body.role && { role: req.body.role })
    };
    
    const user = await (prisma as any).users.update({
      where: { id: id }, // UUID string
      data
    });
    
    res.json(user);
  } catch (error: any) {
    console.error('[PATCH /users/:id] Error:', error?.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
```

#### After (Integer)
```typescript
// backend/src/routes/users.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
// ✅ No more crypto import needed!

const router = Router();
const prisma = new PrismaClient();

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // ✅ Parse to integer
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await (prisma as any).users.findUnique({
      where: { id: id } // ✅ Integer
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error: any) {
    console.error('[GET /users/:id] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users
router.post('/', async (req, res) => {
  try {
    const data = {
      // ✅ No id field! Let database auto-increment
      email: req.body.email,
      password: req.body.password,
      full_name: req.body.fullName,
      company_name: req.body.companyName,
      role: req.body.role || 'Member'
    };
    
    const user = await (prisma as any).users.create({ data });
    res.status(201).json(user);
  } catch (error: any) {
    console.error('[POST /users] Error:', error?.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /users/:id
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // ✅ Parse to integer
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const data = {
      ...(req.body.email && { email: req.body.email }),
      ...(req.body.fullName && { full_name: req.body.fullName }),
      ...(req.body.companyName && { company_name: req.body.companyName }),
      ...(req.body.role && { role: req.body.role })
    };
    
    const user = await (prisma as any).users.update({
      where: { id: id }, // ✅ Integer
      data
    });
    
    res.json(user);
  } catch (error: any) {
    console.error('[PATCH /users/:id] Error:', error?.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
```

---

### 4. Frontend Service Changes

#### Before (UUID)
```typescript
// src/services/users.ts

import { apiFetch } from './api';

export interface User {
  id: string; // ❌ UUID string
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

function fromRow(row: any): User {
  return {
    id: row.id, // string
    email: row.email,
    password: row.password,
    fullName: row.full_name,
    companyName: row.company_name,
    role: row.role,
    permissions: row.permissions ? JSON.parse(row.permissions) : [],
    restrictedCards: row.restricted_cards ? JSON.parse(row.restricted_cards) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(u: Partial<User>): any {
  return {
    id: u.id || crypto.randomUUID(), // ❌ Generate UUID
    ...(u.email !== undefined ? { email: u.email } : {}),
    ...(u.password !== undefined ? { password: u.password } : {}),
    ...(u.fullName !== undefined ? { full_name: u.fullName } : {}),
    ...(u.companyName !== undefined ? { company_name: u.companyName } : {}),
    ...(u.role !== undefined ? { role: u.role } : {}),
    ...(u.permissions !== undefined ? { permissions: JSON.stringify(u.permissions) } : {}),
    ...(u.restrictedCards !== undefined ? { restricted_cards: JSON.stringify(u.restrictedCards) } : {}),
  };
}

export async function getUser(id: string): Promise<User> {
  const data = await apiFetch<any>(`/users/${id}`);
  return fromRow(data);
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const payload = toRow(user);
  const data = await apiFetch<any>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return fromRow(data);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const payload = toRow(updates);
  delete payload.id; // Don't send id in update
  const data = await apiFetch<any>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return fromRow(data);
}
```

#### After (Integer)
```typescript
// src/services/users.ts

import { apiFetch } from './api';

export interface User {
  id: number; // ✅ Integer
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

function fromRow(row: any): User {
  return {
    id: Number(row.id), // ✅ Ensure it's a number
    email: row.email,
    password: row.password,
    fullName: row.full_name,
    companyName: row.company_name,
    role: row.role,
    permissions: row.permissions ? JSON.parse(row.permissions) : [],
    restrictedCards: row.restricted_cards ? JSON.parse(row.restricted_cards) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(u: Partial<User>): any {
  return {
    // ✅ No id field! Backend will auto-generate
    ...(u.email !== undefined ? { email: u.email } : {}),
    ...(u.password !== undefined ? { password: u.password } : {}),
    ...(u.fullName !== undefined ? { full_name: u.fullName } : {}),
    ...(u.companyName !== undefined ? { company_name: u.companyName } : {}),
    ...(u.role !== undefined ? { role: u.role } : {}),
    ...(u.permissions !== undefined ? { permissions: JSON.stringify(u.permissions) } : {}),
    ...(u.restrictedCards !== undefined ? { restricted_cards: JSON.stringify(u.restrictedCards) } : {}),
  };
}

export async function getUser(id: number): Promise<User> {
  const data = await apiFetch<any>(`/users/${id}`);
  return fromRow(data);
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const payload = toRow(user);
  const data = await apiFetch<any>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return fromRow(data);
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User> {
  const payload = toRow(updates);
  const data = await apiFetch<any>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return fromRow(data);
}
```

---

### 5. Frontend Component Changes

#### Before (UUID)
```typescript
// src/features/users/components/UserList.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../types';

interface UserListProps {
  users: User[];
  onDelete: (id: string) => void; // ❌ string
}

export const UserList: React.FC<UserListProps> = ({ users, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = (id: string) => { // ❌ string
    navigate(`/users/${id}`);
  };

  return (
    <div className="user-list">
      {users.map((user) => (
        <div key={user.id} className="user-card">
          <h3>{user.fullName || user.email}</h3>
          <p>Role: {user.role}</p>
          <div className="actions">
            <button onClick={() => handleEdit(user.id)}>Edit</button>
            <button onClick={() => onDelete(user.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### After (Integer)
```typescript
// src/features/users/components/UserList.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../types';

interface UserListProps {
  users: User[];
  onDelete: (id: number) => void; // ✅ number
}

export const UserList: React.FC<UserListProps> = ({ users, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = (id: number) => { // ✅ number
    navigate(`/users/${id}`);
  };

  return (
    <div className="user-list">
      {users.map((user) => (
        <div key={user.id} className="user-card">
          <h3>{user.fullName || user.email}</h3>
          <p>Role: {user.role}</p>
          <div className="actions">
            <button onClick={() => handleEdit(user.id)}>Edit</button>
            <button onClick={() => onDelete(user.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

### 6. React Router Parameter Handling

#### Before (UUID)
```typescript
// src/pages/users/UserDetailPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, User } from '../../services/users';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // ❌ string from URL
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    getUser(id) // ❌ Pass string directly
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.fullName}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
};
```

#### After (Integer)
```typescript
// src/pages/users/UserDetailPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, User } from '../../services/users';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // ✅ Still string from URL
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const numericId = parseInt(id, 10); // ✅ Convert to number
    
    if (isNaN(numericId)) {
      setError('Invalid user ID');
      setLoading(false);
      return;
    }
    
    getUser(numericId) // ✅ Pass number
      .then(setUser)
      .catch((err) => {
        console.error(err);
        setError('Failed to load user');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.fullName}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
};
```

---

### 7. Type Definition Changes

#### Before (UUID)
```typescript
// src/types/index.ts

export interface User {
  id: string;
  email: string;
  // ...
}

export interface Client {
  id: string;
  name: string;
  // ...
}

export interface Project {
  id: string;
  projectName: string;
  clientId: string; // ❌ FK as string
  packageId: string; // ❌ FK as string
  // ...
}

export interface Transaction {
  id: string;
  projectId: string; // ❌ FK as string
  cardId: string; // ❌ FK as string
  pocketId: string; // ❌ FK as string
  clientId: string; // ❌ FK as string
  // ...
}
```

#### After (Integer)
```typescript
// src/types/index.ts

export interface User {
  id: number; // ✅
  email: string;
  // ...
}

export interface Client {
  id: number; // ✅
  name: string;
  // ...
}

export interface Project {
  id: number; // ✅
  projectName: string;
  clientId: number; // ✅ FK as number
  packageId: number; // ✅ FK as number
  // ...
}

export interface Transaction {
  id: number; // ✅
  projectId: number; // ✅ FK as number
  cardId: number; // ✅ FK as number
  pocketId: number; // ✅ FK as number
  clientId: number; // ✅ FK as number
  // ...
}
```

---

### 8. Testing Examples

#### Unit Test (Before)
```typescript
// src/services/users.test.ts

import { describe, it, expect, vi } from 'vitest';
import { createUser, getUser } from './users';

describe('User Service', () => {
  it('should create a user with UUID', async () => {
    const newUser = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    const created = await createUser(newUser);
    
    expect(created.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(created.email).toBe(newUser.email);
  });

  it('should get user by UUID', async () => {
    const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const user = await getUser(userId);
    
    expect(user.id).toBe(userId);
  });
});
```

#### Unit Test (After)
```typescript
// src/services/users.test.ts

import { describe, it, expect, vi } from 'vitest';
import { createUser, getUser } from './users';

describe('User Service', () => {
  it('should create a user with auto-increment ID', async () => {
    const newUser = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    const created = await createUser(newUser);
    
    expect(typeof created.id).toBe('number'); // ✅ Check it's a number
    expect(created.id).toBeGreaterThan(0); // ✅ Positive integer
    expect(created.email).toBe(newUser.email);
  });

  it('should get user by integer ID', async () => {
    const userId = 123;
    const user = await getUser(userId);
    
    expect(user.id).toBe(userId);
    expect(typeof user.id).toBe('number');
  });
});
```

---

### 9. Migration Verification Queries

```sql
-- Check data integrity after migration

-- 1. Verify all IDs are positive integers
SELECT 
  'users' as table_name,
  COUNT(*) as total,
  MIN(id) as min_id,
  MAX(id) as max_id,
  COUNT(DISTINCT id) as unique_ids
FROM users
UNION ALL
SELECT 'clients', COUNT(*), MIN(id), MAX(id), COUNT(DISTINCT id) FROM clients
UNION ALL
SELECT 'projects', COUNT(*), MIN(id), MAX(id), COUNT(DISTINCT id) FROM projects;

-- 2. Verify foreign key relationships
SELECT 
  'profiles → users' as relationship,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT admin_user_id) as distinct_user_ids,
  COUNT(DISTINCT u.id) as existing_users
FROM profiles p
LEFT JOIN users u ON p.admin_user_id = u.id;

-- 3. Check for orphaned records (should be 0)
SELECT 
  'Orphaned profiles' as issue,
  COUNT(*) as count
FROM profiles p
LEFT JOIN users u ON p.admin_user_id = u.id
WHERE p.admin_user_id IS NOT NULL AND u.id IS NULL;

-- 4. Verify AUTO_INCREMENT is working
INSERT INTO users (email, password, full_name) 
VALUES ('test@example.com', 'test123', 'Test User');

SELECT LAST_INSERT_ID() as new_user_id;

-- Clean up test
DELETE FROM users WHERE email = 'test@example.com';

-- 5. Performance comparison (before/after)
EXPLAIN SELECT * FROM projects WHERE id = 123;
EXPLAIN SELECT * FROM projects p 
  JOIN clients c ON p.client_id = c.id 
  WHERE p.id = 123;
```

---

## 🎯 Summary Checklist

Untuk setiap tabel yang di-migrate:

### Database
- [ ] Backup table
- [ ] Create mapping table
- [ ] Add new_id column with AUTO_INCREMENT
- [ ] Update all foreign key references
- [ ] Drop old id column
- [ ] Rename new_id to id
- [ ] Recreate foreign key constraints
- [ ] Verify data integrity

### Backend
- [ ] Update Prisma schema (String → BigInt)
- [ ] Run `prisma generate`
- [ ] Remove `crypto.randomUUID()` calls
- [ ] Update route handlers (parse string to int)
- [ ] Update service functions
- [ ] Update type annotations
- [ ] Run backend tests

### Frontend
- [ ] Update type definitions (string → number)
- [ ] Update service functions
- [ ] Update components
- [ ] Update hooks
- [ ] Handle URL parameter conversion
- [ ] Run frontend tests
- [ ] Manual QA testing

---

**Last Updated**: 2026-05-05  
**Status**: Code Examples & Templates
