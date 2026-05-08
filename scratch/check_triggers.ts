import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const flows = await prisma.chatbotFlow.findMany({
    where: { isActive: true }
  });

  console.log('--- TRIGGERS ---');
  flows.forEach(f => {
    console.log(`Flow: ${f.name} (Trigger: ${f.triggerKeywords})`);
  });
}

main().finally(() => prisma.$disconnect());
