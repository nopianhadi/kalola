# 🔧 Perubahan Backend Code untuk Migrasi INT ID

## 📋 Overview

Setelah migrasi database dari UUID ke INT, backend code perlu diupdate untuk:
1. ❌ **Hapus** UUID generation manual
2. ✅ **Biarkan** database auto-generate ID
3. ✅ **Update** type handling dari string ke number
4. ✅ **Update** validation schema

---

## 🔴 Error yang Anda Alami

```
[POST /cards] Error: Invalid `prismaCards.create()` invocation
Argument `card_holder_name` is missing.
```

### Penyebab:
Backend masih mencoba generate UUID manual:
```typescript
const data = {
  id: uuid(),  // ❌ Ini menyebabkan error
  balance: 500000
  // card_holder_name HILANG karena mapping error
}
```

---

## ✅ Solusi: Hapus UUID Generation

### SEBELUM (SALAH ❌)

```typescript
import { v4 as uuid } from 'uuid';

// Create
router.post('/cards', async (req, res) => {
  const card = await prisma.cards.create({
    data: {
      id: uuid(),  // ❌ HAPUS INI
      card_holder_name: req.body.cardHolderName,
      bank_name: req.body.bankName,
      balance: req.body.balance || 0
    }
  });
  res.json(card);
});
```

### SESUDAH (BENAR ✅)

```typescript
// Tidak perlu import uuid lagi

// Create
router.post('/cards', async (req, res) => {
  const card = await prisma.cards.create({
    data: {
      // ✅ ID akan di-generate otomatis oleh database
      card_holder_name: req.body.cardHolderName,
      bank_name: req.body.bankName,
      balance: req.body.balance || 0
    }
  });
  res.json(card);
});
```

---

## 📝 Perubahan untuk Semua Tabel

### 1. Calendar Events

```typescript
// ❌ SEBELUM
router.post('/calendar-events', async (req, res) => {
  const event = await prisma.calendar_events.create({
    data: {
      id: uuid(),  // ❌ HAPUS
      title: req.body.title,
      date: new Date(req.body.date),
      // ...
    }
  });
});

// ✅ SESUDAH
router.post('/calendar-events', async (req, res) => {
  const event = await prisma.calendar_events.create({
    data: {
      // ID auto-generated
      title: req.body.title,
      date: new Date(req.body.date),
      // ...
    }
  });
});
```

### 2. Notifications

```typescript
// ❌ SEBELUM
router.post('/notifications', async (req, res) => {
  const notification = await prisma.notifications.create({
    data: {
      id: uuid(),  // ❌ HAPUS
      title: req.body.title,
      message: req.body.message,
      // ...
    }
  });
});

// ✅ SESUDAH
router.post('/notifications', async (req, res) => {
  const notification = await prisma.notifications.create({
    data: {
      // ID auto-generated
      title: req.body.title,
      message: req.body.message,
      // ...
    }
  });
});
```

### 3. Client Feedback

```typescript
// ❌ SEBELUM
router.post('/client-feedback', async (req, res) => {
  const feedback = await prisma.client_feedback.create({
    data: {
      id: uuid(),  // ❌ HAPUS
      client_name: req.body.clientName,
      rating: req.body.rating,
      // ...
    }
  });
});

// ✅ SESUDAH
router.post('/client-feedback', async (req, res) => {
  const feedback = await prisma.client_feedback.create({
    data: {
      // ID auto-generated
      client_name: req.body.clientName,
      rating: req.body.rating,
      // ...
    }
  });
});
```

### 4. Suggestions

```typescript
// ❌ SEBELUM
router.post('/suggestions', async (req, res) => {
  const suggestion = await prisma.suggestions.create({
    data: {
      id: uuid(),  // ❌ HAPUS
      name: req.body.name,
      message: req.body.message,
      // ...
    }
  });
});

// ✅ SESUDAH
router.post('/suggestions', async (req, res) => {
  const suggestion = await prisma.suggestions.create({
    data: {
      // ID auto-generated
      name: req.body.name,
      message: req.body.message,
      // ...
    }
  });
});
```

---

## 🔍 Update GET by ID

### Parse ID dari String ke Number

```typescript
// ❌ SEBELUM
router.get('/calendar-events/:id', async (req, res) => {
  const id = req.params.id;  // string UUID
  const event = await prisma.calendar_events.findUnique({
    where: { id }
  });
});

// ✅ SESUDAH
router.get('/calendar-events/:id', async (req, res) => {
  const id = parseInt(req.params.id);  // convert to number
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  const event = await prisma.calendar_events.findUnique({
    where: { id }
  });
});
```

---

## 🔄 Update PUT/PATCH

```typescript
// ❌ SEBELUM
router.put('/calendar-events/:id', async (req, res) => {
  const id = req.params.id;  // string
  const event = await prisma.calendar_events.update({
    where: { id },
    data: req.body
  });
});

// ✅ SESUDAH
router.put('/calendar-events/:id', async (req, res) => {
  const id = parseInt(req.params.id);  // number
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  const event = await prisma.calendar_events.update({
    where: { id },
    data: req.body
  });
});
```

---

## 🗑️ Update DELETE

```typescript
// ❌ SEBELUM
router.delete('/calendar-events/:id', async (req, res) => {
  const id = req.params.id;  // string
  await prisma.calendar_events.delete({
    where: { id }
  });
});

// ✅ SESUDAH
router.delete('/calendar-events/:id', async (req, res) => {
  const id = parseInt(req.params.id);  // number
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  await prisma.calendar_events.delete({
    where: { id }
  });
});
```

---

## 🛠️ Helper Function untuk ID Parsing

Buat helper function untuk reusability:

```typescript
// utils/idParser.ts
export function parseId(id: string): number {
  const parsed = parseInt(id);
  if (isNaN(parsed)) {
    throw new Error('Invalid ID format');
  }
  return parsed;
}

// Penggunaan
import { parseId } from './utils/idParser';

router.get('/calendar-events/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const event = await prisma.calendar_events.findUnique({
      where: { id }
    });
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## 📦 Update Package Dependencies

### Hapus UUID Package (Optional)

Jika tidak ada tabel lain yang masih menggunakan UUID:

```bash
npm uninstall uuid
npm uninstall @types/uuid
```

### Update package.json

```json
{
  "dependencies": {
    // ❌ Hapus jika tidak digunakan lagi
    // "uuid": "^9.0.0"
  },
  "devDependencies": {
    // ❌ Hapus jika tidak digunakan lagi
    // "@types/uuid": "^9.0.0"
  }
}
```

---

## 🧪 Testing

### Test Create (POST)

```typescript
// Test script
const response = await fetch('http://localhost:3000/api/calendar-events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Event',
    date: '2026-06-01',
    event_type: 'Wedding'
  })
});

const data = await response.json();
console.log(data);
// Expected: { id: 1, title: 'Test Event', ... }
// id harus number, bukan string UUID
```

### Test Get by ID

```typescript
// Test dengan ID integer
const response = await fetch('http://localhost:3000/api/calendar-events/1');
const data = await response.json();
console.log(data);
// Expected: { id: 1, title: '...', ... }

// Test dengan ID invalid
const response2 = await fetch('http://localhost:3000/api/calendar-events/abc');
// Expected: 400 Bad Request
```

---

## 📋 Checklist Perubahan Backend

### Fase 1 (Tabel Independen)
- [ ] `calendar_events` routes - hapus UUID generation
- [ ] `client_feedback` routes - hapus UUID generation
- [ ] `notifications` routes - hapus UUID generation
- [ ] `suggestions` routes - hapus UUID generation
- [ ] Update GET by ID - parse to number
- [ ] Update PUT/PATCH - parse to number
- [ ] Update DELETE - parse to number
- [ ] Add ID validation
- [ ] Test all endpoints
- [ ] Update error handling

### Fase 2 (Tabel Root)
- [ ] `users` routes
- [ ] `packages` routes
- [ ] `promo_codes` routes
- [ ] `add_ons` routes
- [ ] `team_members` routes
- [ ] `cards` routes

### General
- [ ] Remove UUID imports
- [ ] Update TypeScript types
- [ ] Update validation schemas
- [ ] Update API documentation
- [ ] Update tests

---

## 🚨 Common Errors & Solutions

### Error 1: "Invalid ID format"
```typescript
// Problem: ID masih dikirim sebagai UUID string
// Solution: Update frontend untuk kirim integer
```

### Error 2: "Argument missing"
```typescript
// Problem: Masih include `id` di create data
// Solution: Hapus `id` dari create payload
```

### Error 3: "Type 'string' is not assignable to type 'number'"
```typescript
// Problem: TypeScript type mismatch
// Solution: Update interface/type definitions
```

---

## ✅ Verification

Setelah update code, verifikasi:

1. **Create** - ID auto-generated (integer)
2. **Read** - ID parsing works
3. **Update** - ID parsing works
4. **Delete** - ID parsing works
5. **No UUID** - Tidak ada UUID generation
6. **Type Safety** - TypeScript tidak error
7. **API Response** - ID adalah number, bukan string

---

## 📚 Resources

- [Prisma Auto Increment](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#autoincrement)
- [MySQL AUTO_INCREMENT](https://dev.mysql.com/doc/refman/8.0/en/example-auto-increment.html)

---

**Status:** Ready for Implementation  
**Priority:** HIGH (Fix error yang Anda alami)  
**Estimated Time:** 2-3 jam untuk Fase 1
