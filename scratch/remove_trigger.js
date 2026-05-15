import { prisma } from '../lib/prisma';

async function main() {
  await prisma.chatbotNode.update({
    where: { id: 'cmp699uxe0003x8t2l2rmezs2' },
    data: { targetFlowId: null }
  });
  console.log('Gatilho automático removido com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
