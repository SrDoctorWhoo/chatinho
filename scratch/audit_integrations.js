const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const integrations = await prisma.externalIntegration.findMany();
  console.log('--- INTEGRAÇÕES CONFIGURADAS ---');
  console.log(JSON.stringify(integrations, null, 2));
  
  const flows = await prisma.chatbotFlow.findMany({
    include: {
      nodes: {
        include: {
          integration: true
        }
      }
    }
  });
  console.log('\n--- FLUXOS E NODES DE IA ---');
  flows.forEach(f => {
    console.log(`Fluxo: ${f.name} (ID: ${f.id})`);
    f.nodes.filter(n => n.type === 'AI_DIFY').forEach(n => {
      console.log(`  Node IA: ${n.id}`);
      console.log(`  Integração vinculada: ${n.integration?.name || 'NENHUMA'}`);
      console.log(`  URL: ${n.integration?.baseUrl}`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
