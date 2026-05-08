const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastConversation = await prisma.conversation.findFirst({
    orderBy: { updatedAt: 'desc' },
    include: {
      contact: true,
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 10
      }
    }
  });

  if (!lastConversation) {
    console.log('Nenhuma conversa encontrada.');
    return;
  }

  console.log(`--- CONVERSA: ${lastConversation.id} ---`);
  console.log(`Contato: ${lastConversation.contact.name} (${lastConversation.contact.number})`);
  console.log(`Status: ${lastConversation.status}`);
  console.log(`Bot Ativo: ${lastConversation.isBotActive}`);
  console.log(`Flow ID: ${lastConversation.currentFlowId}`);
  console.log(`Step ID: ${lastConversation.currentStepId}`);
  console.log('\n--- ÚLTIMAS MENSAGENS ---');
  lastConversation.messages.reverse().forEach(m => {
    console.log(`[${m.timestamp.toISOString()}] ${m.fromMe ? 'Bot' : 'User'}: ${m.body}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
