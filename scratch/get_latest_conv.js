import { prisma } from '../lib/prisma';

async function main() {
  const contact = await prisma.contact.findFirst({
    where: { number: '556181643467' }
  });
  
  if (!contact) {
    console.log('Contato não encontrado');
    return;
  }

  const convs = await prisma.conversation.findMany({
    where: { contactId: contact.id },
    orderBy: { updatedAt: 'desc' },
    take: 1
  });

  console.log('LATEST_CONV:', JSON.stringify(convs[0], null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
