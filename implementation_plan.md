# Deployment Plan - TaskVault

This plan outlines the steps to deploy the TaskVault full-stack application to the cloud.

## User Review Required

> [!IMPORTANT]
> I recommend using **Vercel** for the frontend and **Render** or **Railway** for the backend.
> Since you are already using Supabase for Auth, I suggest using the **Supabase PostgreSQL database** for production instead of a local Docker container.

## Proposed Changes

### 1. Dockerization (For universal deployment)

#### [NEW] [backend/Dockerfile](file:///c:/Users/harsh/TaskVault/backend/Dockerfile)
- Multi-stage build for NestJS production.
- Includes Prisma client generation.

#### [NEW] [frontend/Dockerfile](file:///c:/Users/harsh/TaskVault/frontend/Dockerfile)
- Multi-stage build for Next.js production.

#### [NEW] [docker-compose.prod.yml](file:///c:/Users/harsh/TaskVault/docker-compose.prod.yml)
- Unified production configuration for all services.

### 2. Production Configuration

#### [MODIFY] [backend/src/main.ts](file:///c:/Users/harsh/TaskVault/backend/src/main.ts)
- Enable CORS for the production frontend URL.

#### [MODIFY] [frontend/src/lib/api.ts](file:///c:/Users/harsh/TaskVault/frontend/src/lib/api.ts)
- Use environment variables for the API base URL.

## Verification Plan

### Manual Verification
1.  **Build Check**: Run `docker compose -f docker-compose.prod.yml build` locally to ensure images build correctly.
2.  **Environment Sync**: Verify all required secrets (JWT_SECRET, SUPABASE_URL, etc.) are documented for the cloud provider.
