import { prisma } from '../lib/prisma';

async function main() {
  const node = await prisma.chatbotNode.findUnique({
    where: { id: 'cmp6ahsz30000sct2lcl1ol3e' }
  });
  console.log('--- SQL QUERY CONTENT ---');
  console.log(node?.content);
  console.log('--- END ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
