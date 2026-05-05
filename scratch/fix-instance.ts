import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- Corrigindo Instância no Banco de Dados ---');

  // 1. Ver todas as instâncias
  const instances = await prisma.whatsappInstance.findMany();
  console.log('Instâncias atuais:', instances.map(i => i.instanceId));

  // 2. Renomear ou Criar a instância "TESTE"
  // Se houver alguma instância, vamos renomear a primeira para "TESTE"
  if (instances.length > 0) {
    const firstInstance = instances[0];
    console.log(`Renomeando ${firstInstance.instanceId} para TESTE...`);
    await prisma.whatsappInstance.update({
      where: { id: firstInstance.id },
      data: { 
        instanceId: 'TESTE',
        name: 'TESTE',
        status: 'DISCONNECTED'
      }
    });
  } else {
    console.log('Nenhuma instância encontrada. Criando TESTE...');
    await prisma.whatsappInstance.create({
      data: {
        instanceId: 'TESTE',
        name: 'TESTE',
        status: 'DISCONNECTED'
      }
    });
  }

  console.log('✅ Pronto! Agora o sistema vai tentar se conectar à instância TESTE.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
