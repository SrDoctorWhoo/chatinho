import { prisma } from './lib/prisma';

async function main() {
  const integrations = await prisma.externalIntegration.findMany();
  console.log('--- Integrações Externas ---');
  integrations.forEach(i => {
    console.log(`ID: ${i.id} | Nome: ${i.name} | Tipo: ${i.type} | URL: ${i.baseUrl}`);
  });
}

main();
