import { prisma } from '../lib/prisma';

async function main() {
  const node = await prisma.chatbotNode.findUnique({
    where: { id: 'cmp6aht270001sct2md127ort' }
  });
  console.log('PAYLOAD_MAPPING:', node?.payloadMapping);
}

main().catch(console.error).finally(() => prisma.$disconnect());
