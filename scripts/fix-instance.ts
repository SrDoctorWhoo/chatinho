import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Corrigindo Instância OABGO META ---');
  try {
    const updated = await prisma.whatsappInstance.update({
      where: { instanceId: 'OABGO META' },
      data: { 
        integration: 'WHATSAPP-BUSINESS',
        status: 'CONNECTED'
      }
    });
    console.log('Sucesso! Instância atualizada:', updated.name);
    console.log('Tipo:', updated.integration);
  } catch (error) {
    console.error('Erro ao atualizar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
