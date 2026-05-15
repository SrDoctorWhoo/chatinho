import { prisma } from '../lib/prisma';

async function main() {
  // 1. Pegar o ID do novo nó de IA
  const aiNode = await prisma.chatbotNode.findFirst({
    where: { title: 'IA de Recepção e Triagem' }
  });

  if (!aiNode) {
    console.log('Novo nó de IA não encontrado.');
    return;
  }

  console.log('Novo Nó ID:', aiNode.id);

  // 2. Atualizar os gatilhos para apontar para este nó
  // Vamos atualizar todos os Keyword Triggers que apontam para o fluxo 1
  const flow1 = await prisma.chatbotFlow.findFirst({ where: { name: '1. Recepção e Triagem' } });
  
  if (flow1) {
    await prisma.chatbotFlowTrigger.updateMany({
      where: { flowId: flow1.id },
      data: { targetNodeId: aiNode.id }
    });
    console.log('Gatilhos do Fluxo 1 atualizados para a nova IA!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
