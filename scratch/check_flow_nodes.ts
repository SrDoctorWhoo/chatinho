import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const flow = await prisma.chatbotFlow.findFirst({
    where: { name: 'teste' },
    include: {
      nodes: {
        orderBy: { id: 'asc' },
        include: {
          options: true,
          integration: true
        }
      }
    }
  });

  if (!flow) {
    console.log('Flow "teste" não encontrado.');
    return;
  }

  console.log(`--- FLOW: ${flow.name} ---`);
  flow.nodes.forEach(n => {
    console.log(`Node: ${n.id} (${n.type})`);
    console.log(`  Content: ${n.content}`);
    if (n.type === 'AI_DIFY') {
      console.log(`  AI Integration: ${n.integration?.name} - ${n.integration?.baseUrl}`);
    }
    n.options.forEach(o => {
      console.log(`    Option: ${o.keyword} -> ${o.targetNodeId}`);
    });
  });
}

main().finally(() => prisma.$disconnect());
