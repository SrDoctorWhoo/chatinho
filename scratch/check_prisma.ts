import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
  await prisma.$disconnect();
}

main();
