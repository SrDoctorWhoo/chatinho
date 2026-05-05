const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const conversationsCount = await prisma.conversation.count();
  const messagesCount = await prisma.message.count();
  const contactsCount = await prisma.contact.count();
  const instances = await prisma.whatsappInstance.findMany();

  console.log('--- DIAGNÓSTICO DO BANCO ---');
  console.log('Conversas:', conversationsCount);
  console.log('Mensagens:', messagesCount);
  console.log('Contatos:', contactsCount);
  console.log('Instâncias:', instances.map(i => ({ name: i.name, status: i.status })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
