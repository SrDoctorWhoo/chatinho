import { prisma } from '../lib/prisma';

async function main() {
  const integ = await prisma.externalIntegration.findFirst({
    where: { type: 'DIFY', isActive: true }
  });
  if (integ) {
    console.log('ID_ENCONTRADO:', integ.id);
  } else {
    console.log('Nenhuma integração Dify ativa encontrada');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
