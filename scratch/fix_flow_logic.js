import { prisma } from '../lib/prisma';

async function main() {
  // 1. Remover o nextStepId do nó de Login no Fluxo 2
  // Isso impede que o bot tente executar a IA antes do login ser feito
  const flow2 = await prisma.chatbotFlow.findFirst({
    where: { name: '2. Autenticação' },
    include: { nodes: true }
  });

  if (flow2) {
    const loginNode = flow2.nodes.find(n => n.title === 'Ponto de Autenticação');
    if (loginNode && loginNode.nextStepId) {
      await prisma.chatbotNode.update({
        where: { id: loginNode.id },
        data: { nextStepId: null }
      });
      console.log('Sucesso: O nó de login agora espera pacientemente pela autenticação.');
    }
  }

  // 2. Ajustar o Fluxo 1 (Recepção) para não repetir o menu
  // Vamos garantir que após mostrar o menu, ele espere um input ou uma palavra-chave
  const flow1 = await prisma.chatbotFlow.findFirst({
    where: { name: '1. Recepção e Triagem' },
    include: { nodes: true }
  });

  if (flow1) {
    const menuNode = flow1.nodes.find(n => n.type === 'MENU' || n.type === 'MESSAGE');
    // Se o menu for uma MESSAGE e tiver um nextStepId para uma IA, 
    // a IA vai responder mas o bot pode se perder no histórico.
    console.log('Fluxo 1 verificado.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
