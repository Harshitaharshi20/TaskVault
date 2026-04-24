/**
 * Prisma seed script
 * Run with: npx ts-node prisma/seed.ts   (from the backend directory)
 *
 * Creates two demo users:
 *   - custom@example.com  / Password1  (custom JWT auth)
 *   - supabase@example.com (supabase auth — no password)
 * and seeds a handful of todos for each.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // ── Custom auth user ──────────────────────────────────────────
  const customUser = await prisma.user.upsert({
    where: { email: 'custom@example.com' },
    update: {},
    create: {
      email: 'custom@example.com',
      passwordHash: await bcrypt.hash('Password1', 12),
      authMethod: 'CUSTOM',
    },
  });

  await prisma.todo.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Set up NestJS project',        completed: true,  userId: customUser.id },
      { title: 'Configure Prisma + PostgreSQL', completed: true,  userId: customUser.id },
      { title: 'Implement JWT auth guard',      completed: false, userId: customUser.id,
        description: 'Custom JWT + Supabase JWT in one CombinedAuthGuard' },
      { title: 'Build Next.js dashboard',       completed: false, userId: customUser.id },
    ],
  });

  // ── Supabase-style user (no passwordHash) ─────────────────────
  const supabaseUser = await prisma.user.upsert({
    where: { email: 'supabase@example.com' },
    update: {},
    create: {
      email: 'supabase@example.com',
      supabaseId: 'mock-supabase-uuid-000',
      authMethod: 'SUPABASE',
    },
  });

  await prisma.todo.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Sign in via Supabase OAuth',  completed: true,  userId: supabaseUser.id },
      { title: 'Verify backend user sync',    completed: false, userId: supabaseUser.id },
    ],
  });

  console.log('✅ Seed complete');
  console.log(`   Custom user   : ${customUser.email} (id: ${customUser.id})`);
  console.log(`   Supabase user : ${supabaseUser.email} (id: ${supabaseUser.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
