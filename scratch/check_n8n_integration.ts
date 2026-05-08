import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const integration = await prisma.externalIntegration.findFirst({
    where: { name: 'N8n' }
  });

  if (!integration) {
    console.log('Integração não encontrada.');
    return;
  }

  console.log('--- INTEGRAÇÃO N8N ---');
  console.log(JSON.stringify(integration, null, 2));
}

main().finally(() => prisma.$disconnect());
