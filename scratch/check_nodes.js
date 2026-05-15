import { prisma } from '../lib/prisma';

async function main() {
  const flows = await prisma.chatbotFlow.findMany({
    include: { nodes: { orderBy: { order: 'asc' } } }
  });

  for (const flow of flows) {
    console.log(`FLUXO: ${flow.name}`);
    flow.nodes.forEach(n => {
      console.log(`  Node: ${n.title} (${n.type}) - ID: ${n.id} - next: ${n.nextStepId} - targetFlow: ${n.targetFlowId}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
