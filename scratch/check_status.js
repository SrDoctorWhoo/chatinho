import { prisma } from '../lib/prisma';

async function main() {
  const conv = await prisma.conversation.findUnique({
    where: { id: 'cmp6bz5ze001asct257osfl6x' }
  });
  console.log('CONVERSATION:', JSON.stringify(conv, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
