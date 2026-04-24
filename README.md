# 🛡️ TaskVault — Secure Full-Stack Task Management

TaskVault is a modern, production-ready full-stack Todo application designed with a focus on security, dual authentication, and a premium user experience. 

It is built with a robust tech stack: **Next.js 14, NestJS 10, PostgreSQL, Prisma ORM**, and features unified authentication supporting both **Custom Email/Password** and **Supabase (OAuth + Email)**.

![TaskVault UI](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=1200&h=400)

---

## ✨ Key Features

- **🎨 Premium User Interface**: Built with Next.js App Router, Tailwind CSS, and polished with modern glassmorphism, dynamic animations, and responsive design.
- **🔐 Dual Authentication System**: 
  - **Custom Auth**: Full backend-managed JWT system with bcrypt password hashing and secure token generation.
  - **Supabase Auth**: Seamlessly login via Google, GitHub, or Supabase Email with automated syncing to the PostgreSQL database.
- **🛡️ Asymmetric Security (JWKS)**: The backend securely verifies Supabase JWTs using public JWKS (JSON Web Key Sets), ensuring enterprise-grade security.
- **🗂️ Strict Data Isolation**: Every Todo endpoint is strictly scoped. Users can only fetch, modify, or delete their own data.
- **🚦 Centralized Error Handling**: A global NestJS exception filter guarantees consistent, clean JSON error messages across the entire API.
- **☁️ Cloud-Ready Deployment**: Pre-configured with a `render.yaml` Blueprint for seamless zero-config deployment to Render.

---

## 📐 Architecture Overview

```mermaid
graph TD
    subgraph Frontend [Next.js 14 UI]
        UI[React Components] --> AuthForm
        UI --> Dashboard
        AuthForm --> AuthContext
        Dashboard --> ApiClient[Axios Interceptors]
    end

    subgraph Backend [NestJS 10 API]
        ApiClient -- "Bearer <JWT>" --> Guards[Combined Auth Guard]
        Guards --> CustomJwt[Custom Strategy]
        Guards --> SupabaseJwt[Supabase JWKS Strategy]
        
        CustomJwt --> Controllers
        SupabaseJwt --> Controllers
        
        Controllers --> Services[Business Logic]
        Services --> Prisma[Prisma ORM]
    end

    subgraph Infrastructure
        Prisma --> DB[(PostgreSQL)]
        SupabaseJwt -- "Fetch Public Keys" --> SupabaseCloud[Supabase Cloud]
    end
```

---

## 🚀 Local Development Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Hosted, e.g., Supabase)
- A Supabase Project (for OAuth / Supabase Auth)

### 1. Database Setup
Start your local PostgreSQL database (or use your Supabase Postgres URL). If using Docker:
```bash
docker compose up -d
```

### 2. Backend Setup
Navigate to the `backend` directory and set up your environment variables.
```bash
cd backend
cp .env.example .env
```
Update your `.env` file:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_db"
JWT_SECRET="your-custom-super-secret-key"
JWT_EXPIRES_IN="7d"

# Required for Asymmetric Verification
SUPABASE_URL="https://your-project-id.supabase.co"
```
Install dependencies and run migrations:
```bash
npm install
npx prisma db push    # Push schema to database
npx prisma generate   # Generate Prisma client
npm run start:dev     # Starts API on http://localhost:4000
```

### 3. Frontend Setup
Navigate to the `frontend` directory and set up your environment variables.
```bash
cd ../frontend
cp .env.example .env.local
```
Update your `.env.local` file:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```
Install dependencies and start the UI:
```bash
npm install
npm run dev           # Starts Frontend on http://localhost:3000
```

---

## 🌍 Production Deployment (Render)

TaskVault is optimized for automated deployment on [Render](https://render.com) via Blueprint.

1. Connect your GitHub repository to Render.
2. Click **New +** → **Blueprint**.
3. Select your repository. Render will automatically read the `render.yaml` file.
4. Fill in the required environment variables in the Render Dashboard:
   - **Backend**: `SUPABASE_URL`, `DATABASE_URL`, `JWT_SECRET`
   - **Frontend**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy! Both your Next.js frontend and NestJS backend will build and launch automatically.

---

## 📡 API Reference

All `/api/todos` endpoints are protected by the `CombinedAuthGuard` and require a valid Bearer token (either Custom or Supabase).

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register via Custom Email/Pass | No |
| `POST` | `/api/auth/login` | Login via Custom Email/Pass | No |
| `GET`  | `/api/auth/profile` | Retrieve the authenticated user | Yes |
| `GET`  | `/api/todos` | List all Todos for the active user | Yes |
| `POST` | `/api/todos` | Create a new Todo | Yes |
| `PATCH`| `/api/todos/:id` | Update a Todo (title, description, status) | Yes |
| `DELETE`| `/api/todos/:id` | Delete a Todo permanently | Yes |

---

## 🛡️ Security Best Practices

- **JWKS Key Rotation**: Supabase JWTs are verified using `jwks-rsa`, ensuring that your application automatically fetches the latest public keys from Supabase without exposing secret keys.
- **Rate Limiting Protection**: Relies on Supabase's edge network to throttle abusive signup attempts (HTTP 429).
- **CORS Policies**: The backend strictly limits cross-origin requests to your designated frontend URL.
- **Zero Data Leakage**: Global exception filters intercept all backend errors, preventing stack traces or raw database errors from leaking to the frontend.

---
*TaskVault — Built with ❤️ for productivity.*
