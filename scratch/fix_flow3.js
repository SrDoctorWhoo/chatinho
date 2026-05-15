import { prisma } from '../lib/prisma';

async function main() {
  const difyId = 'cmp1psc6o0000lwtip9kegwjo';
  
  // 1. Encontrar o nó de IA no fluxo 3
  const flow3 = await prisma.chatbotFlow.findFirst({
    where: { name: '3. Consulta de Boletos' },
    include: { nodes: true }
  });

  if (!flow3) {
    console.log('Fluxo 3 não encontrado');
    return;
  }

  const aiNode = flow3.nodes.find(n => n.title === 'IA Pós-Login');
  if (aiNode) {
    await prisma.chatbotNode.update({
      where: { id: aiNode.id },
      data: { integrationId: difyId }
    });
    console.log('Nó de IA atualizado com a integração Dify!');
  } else {
    console.log('Nó de IA não encontrado no fluxo 3');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
