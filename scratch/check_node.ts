import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const nodeId = 'cmovmqlee000kk4tiswehopvm';
  const node = await prisma.chatbotNode.findUnique({
    where: { id: nodeId },
    include: {
      options: true
    }
  });

  if (!node) {
    console.log('Nó não encontrado.');
    return;
  }

  console.log(`--- NÓ ATUAL ---`);
  console.log(`ID: ${node.id}`);
  console.log(`Tipo: ${node.type}`);
  console.log(`Conteúdo: ${node.content}`);
  
  console.log('\n--- OPÇÕES ---');
  for (const opt of node.options) {
    const targetNode = await prisma.chatbotNode.findUnique({
      where: { id: opt.targetNodeId as string },
      include: { integration: true }
    });
    console.log(`Opção: "${opt.label}" (Keyword: "${opt.keyword}")`);
    console.log(`  Vai para: ${opt.targetNodeId} (${targetNode?.type})`);
    if (targetNode?.type === 'AI_DIFY') {
      console.log(`  Integração: ${targetNode.integration?.name}`);
      console.log(`  Base URL: ${targetNode.integration?.baseUrl}`);
      console.log(`  API Key (masked): ${targetNode.integration?.apiKey?.substring(0, 5)}...`);
    }
  }
}

main().finally(() => prisma.$disconnect());
