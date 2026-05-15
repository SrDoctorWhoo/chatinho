import { prisma } from '../lib/prisma';

async function main() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
  console.log('SETTINGS:', JSON.stringify(settings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
