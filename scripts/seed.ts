const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('adminpassword', 10);

  // Original Admin (preserve existing logic)
  const originalAdmin = await prisma.user.upsert({
    where: { email: 'admin@monster.com' },
    update: {
      password: adminPassword,
      role: 'admin',
      is_approved: true,
    },
    create: {
      email: 'admin@monster.com',
      name: 'Admin Monster',
      password: adminPassword,
      role: 'admin',
      is_approved: true,
    },
  });

  // Test Admin (for E2E tests)
  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password,
      role: 'admin',
      is_approved: true,
    },
    create: {
      email: 'admin@example.com',
      name: 'Test Admin',
      password,
      role: 'admin',
      is_approved: true,
    },
  });

  // Test User (for E2E tests)
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password,
      role: 'user',
      is_approved: true,
    },
    create: {
      email: 'user@example.com',
      name: 'Test User',
      password,
      role: 'user',
      is_approved: true,
    },
  });

  // Seed Kamus items for E2E tests
  const seedKamus1 = await prisma.kamusItem.upsert({
    where: { code: 'SEED-POT-001' },
    update: {
      name: 'Analytical Thinking',
      type: 'potensi',
      description: 'Ability to break down complex problems',
      behavioralIndicators: 'Identifies patterns|Decomposes problems|Synthesizes findings',
    },
    create: {
      code: 'SEED-POT-001',
      name: 'Analytical Thinking',
      type: 'potensi',
      description: 'Ability to break down complex problems',
      behavioralIndicators: 'Identifies patterns|Decomposes problems|Synthesizes findings',
    },
  });

  const seedKamus2 = await prisma.kamusItem.upsert({
    where: { code: 'SEED-KOM-001' },
    update: {
      name: 'Strategic Leadership',
      type: 'kompetensi',
      description: 'Leading teams toward strategic objectives',
      behavioralIndicators: 'Sets vision|Aligns team|Drives execution',
    },
    create: {
      code: 'SEED-KOM-001',
      name: 'Strategic Leadership',
      type: 'kompetensi',
      description: 'Leading teams toward strategic objectives',
      behavioralIndicators: 'Sets vision|Aligns team|Drives execution',
    },
  });

  // Standar Jabatan referencing seedKamus2 (so it cannot be deleted)
  const seedStandar = await prisma.standarJabatan.upsert({
    where: { name: 'Seed Manager' },
    update: {},
    create: {
      name: 'Seed Manager',
      level: 'M2',
    },
  });

  await prisma.standarJabatanKamus.upsert({
    where: {
      standarJabatanId_kamusItemId: {
        standarJabatanId: seedStandar.id,
        kamusItemId: seedKamus2.id,
      },
    },
    update: { expectedLevel: 4 },
    create: {
      standarJabatanId: seedStandar.id,
      kamusItemId: seedKamus2.id,
      expectedLevel: 4,
    },
  });

  console.log({ originalAdmin, testAdmin, testUser, seedKamus1, seedKamus2, seedStandar });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
