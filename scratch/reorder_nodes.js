import { prisma } from '../lib/prisma';

async function main() {
  const flow1 = await prisma.chatbotFlow.findFirst({
    where: { name: '1. Recepção e Triagem' },
    include: { nodes: true }
  });

  if (!flow1) return;

  // 1. Encontrar o nó da IA
  const aiNode = flow1.nodes.find(n => n.title === 'IA de Recepção e Triagem');
  if (aiNode) {
    await prisma.chatbotNode.update({
      where: { id: aiNode.id },
      data: { order: 0 }
    });
  }

  // 2. Empurrar os outros nós para ordens superiores
  for (const node of flow1.nodes) {
    if (node.title !== 'IA de Recepção e Triagem') {
      await prisma.chatbotNode.update({
        where: { id: node.id },
        data: { order: node.order + 1 }
      });
    }
  }

  console.log('Ordem dos nós atualizada! A IA agora é a prioridade #0.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
