# ✅ Full-Stack Todo App

> **Next.js 14 · NestJS 10 · PostgreSQL · Prisma ORM · Supabase Auth · Custom JWT**

A production-ready Todo application with dual authentication: your own email/password
system (custom JWT) **and** Supabase Auth (OAuth + Supabase email/password).
All todo routes are protected and strictly scoped per-user.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                   │
│                                                                 │
│  /login       AuthForm (tab: Custom | Supabase)                 │
│  /register    AuthForm                                          │
│  /dashboard   Protected → TodoList, TodoItem, stats             │
│                                                                 │
│  AuthContext  ──┬── Custom: POST /api/auth/login → JWT          │
│                 └── Supabase: supabase.auth → access_token      │
│                                                                 │
│  api.ts  (axios)  Bearer <token>  ──────────────────────────►  │
└──────────────────────────────────────────────────────────────── ┘
                              │  HTTP (localhost:4000)
┌─────────────────────────────▼───────────────────────────────────┐
│                         BACKEND (NestJS 10)                     │
│                                                                 │
│  /api/auth/register   POST  → bcrypt hash → DB → custom JWT     │
│  /api/auth/login      POST  → verify hash → custom JWT          │
│  /api/auth/supabase   POST  → verify Supabase JWT → upsert user │
│  /api/auth/profile    GET   → CombinedAuthGuard                 │
│                                                                 │
│  /api/todos           CRUD  → CombinedAuthGuard (ALL routes)    │
│                                                                 │
│  CombinedAuthGuard ──┬── CustomJwtStrategy  (passport-jwt)      │
│                      └── SupabaseJwtStrategy (passport-jwt)     │
│                                                                 │
│  PrismaService  ──────────────────────────────────────────────► │
└──────────────────────────────────────────────────────────────── ┘
                              │  Prisma ORM
┌─────────────────────────────▼───────────────────────────────────┐
│                  PostgreSQL (Docker / hosted)                    │
│                                                                 │
│  users  ─── id, email, passwordHash?, supabaseId?, authMethod   │
│  todos  ─── id, title, description?, completed, userId (FK)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flows

### Flow 1 — Custom Email/Password (Backend-Managed JWT)

```
Frontend                Backend                 PostgreSQL
   │                       │                        │
   │── POST /auth/register ─►                        │
   │   { email, password }  │── bcrypt.hash ────────►│
   │                        │◄─ user row ────────────│
   │◄── { user, JWT } ──────│                        │
   │                        │                        │
   │── POST /auth/login ───►│                        │
   │   { email, password }  │── bcrypt.compare ─────►│
   │◄── { user, JWT } ──────│                        │
   │                        │                        │
   │── GET /api/todos ──────►                        │
   │   Authorization: Bearer <custom-JWT>             │
   │   CombinedAuthGuard ──► CustomJwtStrategy ✅    │
   │◄── [ todos ] ──────────│                        │
```

### Flow 2 — Supabase Auth (OAuth / Supabase Email)

```
Frontend              Supabase           Backend             PostgreSQL
   │                     │                  │                    │
   │── signInWithOAuth ──►│                  │                    │
   │◄── session ─────────│                  │                    │
   │                     │                  │                    │
   │── POST /auth/supabase ────────────────►│                    │
   │   { supabaseToken }                    │── jwt.verify ─────►│
   │                                        │── upsert user ────►│
   │◄── { user } ──────────────────────────│                    │
   │                                        │                    │
   │── GET /api/todos ──────────────────────►                    │
   │   Authorization: Bearer <supabase-JWT>                      │
   │   CombinedAuthGuard ──► SupabaseJwtStrategy ✅              │
   │◄── [ todos ] ──────────────────────────│                    │
```

---

## 🗂 Project Structure

```
todo-app/
├── docker-compose.yml          # PostgreSQL local dev container
│
├── backend/                    # NestJS application
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema (User + Todo models)
│   │   └── seed.ts             # Demo seed data
│   └── src/
│       ├── main.ts             # Bootstrap, CORS, ValidationPipe
│       ├── app.module.ts       # Root module
│       ├── prisma/
│       │   ├── prisma.service.ts  # PrismaClient wrapper
│       │   └── prisma.module.ts   # @Global() module
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts    # register / login / supabaseSignIn
│       │   ├── auth.controller.ts # /api/auth/*
│       │   ├── dto/
│       │   │   └── auth.dto.ts    # RegisterDto, LoginDto, SupabaseAuthDto
│       │   ├── strategies/
│       │   │   ├── custom-jwt.strategy.ts    # Validates our own JWTs
│       │   │   └── supabase-jwt.strategy.ts  # Validates Supabase JWTs
│       │   └── guards/
│       │       └── combined-auth.guard.ts    # Tries both strategies
│       └── todos/
│           ├── todos.module.ts
│           ├── todos.service.ts   # Full CRUD with ownership checks
│           ├── todos.controller.ts # /api/todos/* (ALL protected)
│           └── dto/
│               └── todo.dto.ts    # CreateTodoDto, UpdateTodoDto
│
└── frontend/                   # Next.js 14 (App Router)
    └── src/
        ├── app/
        │   ├── layout.tsx         # Root layout + AuthProvider + Toaster
        │   ├── globals.css        # Tailwind + custom component classes
        │   ├── page.tsx           # Redirect → /login or /dashboard
        │   ├── login/page.tsx
        │   ├── register/page.tsx
        │   └── dashboard/page.tsx # Protected: full todo management
        ├── components/
        │   ├── AuthForm.tsx       # Tabbed: Custom / Supabase auth
        │   ├── TodoList.tsx       # Create form + filter tabs + list
        │   └── TodoItem.tsx       # Inline edit, toggle, delete
        ├── contexts/
        │   └── AuthContext.tsx    # All auth logic + localStorage
        ├── lib/
        │   ├── supabase.ts        # Supabase client singleton
        │   └── api.ts             # Axios client + todosApi + authApi
        └── types/
            └── index.ts           # Shared TypeScript interfaces
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Docker (for local PostgreSQL) **or** a PostgreSQL URL
- A [Supabase](https://supabase.com) project (free tier works)

---

### 1 — Start PostgreSQL

```bash
docker compose up -d
# PostgreSQL is now at postgresql://postgres:postgres@localhost:5432/todo_db
```

---

### 2 — Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_db"
JWT_SECRET="replace-with-a-long-random-string-32-chars-min"
JWT_EXPIRES_IN="7d"
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"
```

> 📌 Find `SUPABASE_JWT_SECRET` at:
> Supabase Dashboard → Project Settings → API → JWT Settings → **JWT Secret**

```bash
npm install
npx prisma migrate dev --name init    # Creates tables
npx prisma generate                   # Generates PrismaClient
npx ts-node prisma/seed.ts            # (Optional) seed demo data
npm run start:dev                     # http://localhost:4000
```

---

### 3 — Configure the Frontend

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

> 📌 Find `SUPABASE_ANON_KEY` at:
> Supabase Dashboard → Project Settings → API → **anon public**

```bash
npm install
npm run dev     # http://localhost:3000
```

---

### 4 — (Optional) Enable Supabase OAuth Providers

In your Supabase Dashboard go to **Authentication → Providers** and enable:

- **Google** — needs a Google OAuth App (console.cloud.google.com)
- **GitHub** — needs a GitHub OAuth App (github.com/settings/developers)

Set the callback URL to:
```
https://your-project-id.supabase.co/auth/v1/callback
```

---

## 📡 API Reference

All todo endpoints require `Authorization: Bearer <token>`.
Both custom JWTs and Supabase JWTs are accepted.

### Auth

| Method | Path | Auth? | Description |
|--------|------|-------|-------------|
| POST | `/api/auth/register` | No | Custom email/password registration |
| POST | `/api/auth/login` | No | Custom email/password login |
| POST | `/api/auth/supabase` | No | Exchange Supabase JWT → provision user in DB |
| GET | `/api/auth/profile` | ✅ | Get current user profile |

**Register body:**
```json
{ "email": "user@example.com", "password": "Password1" }
```

**Login response:**
```json
{
  "message": "Login successful",
  "user": { "id": "uuid", "email": "user@example.com", "authMethod": "CUSTOM" },
  "accessToken": "eyJ..."
}
```

**Supabase exchange body:**
```json
{ "supabaseToken": "<supabase-access-token>" }
```

---

### Todos

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/todos` | List all todos for the current user |
| POST | `/api/todos` | Create a new todo |
| GET | `/api/todos/:id` | Get a single todo |
| PATCH | `/api/todos/:id` | Update title / description / completed |
| DELETE | `/api/todos/:id` | Delete a todo |
| PATCH | `/api/todos/:id/toggle` | Toggle completed ↔ incomplete |

**Create body:**
```json
{ "title": "Buy milk", "description": "Full-fat please" }
```

**Update body (all fields optional):**
```json
{ "title": "Buy oat milk", "completed": true }
```

---

## 🛡 Security Highlights

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 12 rounds |
| JWT signing | HS256, configurable expiry |
| Supabase JWT validation | Verified with project JWT secret via `passport-jwt` |
| Route protection | `CombinedAuthGuard` on every `/api/todos` route |
| Ownership enforcement | `userId` check in every service method (403 on mismatch) |
| Input validation | `class-validator` DTOs, `whitelist: true` strips unknown fields |
| CORS | Restricted to `FRONTEND_URL` origin |
| Error messages | Vague on auth failures to prevent user enumeration |

---

## 🧪 Testing the API (curl examples)

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","password":"Password1"}'

# Login → copy the accessToken
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","password":"Password1"}'

# Create todo
TOKEN="eyJ..."
curl -X POST http://localhost:4000/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Write tests","description":"Unit + e2e"}'

# List todos
curl http://localhost:4000/api/todos \
  -H "Authorization: Bearer $TOKEN"

# Toggle complete
curl -X PATCH http://localhost:4000/api/todos/<id>/toggle \
  -H "Authorization: Bearer $TOKEN"

# Delete
curl -X DELETE http://localhost:4000/api/todos/<id> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Prisma Commands (from /backend)

```bash
npx prisma migrate dev --name <migration_name>  # Create + apply migration
npx prisma migrate deploy                        # Apply pending migrations (prod)
npx prisma generate                              # Regenerate PrismaClient
npx prisma studio                                # GUI at http://localhost:5555
npx prisma db push                               # Push schema without migration
npx ts-node prisma/seed.ts                       # Run seed script
```

---

## 🌍 Production Deployment Notes

1. **Backend** — deploy to Railway / Render / Fly.io
   - Set all `.env` variables in the platform dashboard
   - Run `npx prisma migrate deploy` as a build/release step

2. **Frontend** — deploy to Vercel
   - Add `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Update CORS `FRONTEND_URL` in the backend to the Vercel domain

3. **Database** — use Supabase Postgres, Neon, or Railway Postgres
   - Update `DATABASE_URL` accordingly

4. **Supabase OAuth** — add the production domain to:
   - Supabase → Authentication → URL Configuration → **Site URL** and **Redirect URLs**
