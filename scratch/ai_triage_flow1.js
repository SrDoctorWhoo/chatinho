import { prisma } from '../lib/prisma';

async function main() {
  const difyId = 'cmp1psc6o0000lwtip9kegwjo';
  
  // 1. Encontrar o Fluxo 1
  const flow1 = await prisma.chatbotFlow.findFirst({
    where: { name: '1. Recepção e Triagem' },
    include: { nodes: true }
  });

  if (!flow1) {
    console.log('Fluxo 1 não encontrado');
    return;
  }

  // 2. Apagar os nós antigos para começar do zero (ou apenas desativá-los)
  // Vamos criar o nó de IA como o primeiro nó
  const aiNode = await prisma.chatbotNode.create({
    data: {
      flowId: flow1.id,
      type: 'AI_DIFY',
      title: 'IA de Recepção e Triagem',
      content: 'Olá! Como posso te ajudar?',
      integrationId: difyId,
      order: 0
    }
  });

  // 3. Atualizar a ordem dos outros ou apenas marcá-lo como o ponto de entrada
  // O motor usa o 'order' mais baixo.
  console.log('Fluxo 1 agora começa com a IA do Dify!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
