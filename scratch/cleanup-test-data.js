const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Limpando dados de teste ---');
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.contact.deleteMany({});
  console.log('✅ Limpo!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
