import { prisma } from '../lib/prisma';

async function main() {
  try {
    const count = await prisma.chatbotFlow.count();
    console.log('CONEXAO_OK:', count);
  } catch (e) {
    console.error('ERRO_CONEXAO:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
