import { PrismaClient } from '@prisma/client';

// Criamos uma instância nova mas com a configuração padrão
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpeza do banco de dados...');

  try {
    // A ordem importa por causa das chaves estrangeiras (MSSQL)
    // Primeiro mensagens, depois conversas, depois contatos
    
    await prisma.$executeRawUnsafe('DELETE FROM [dbo].[Message]');
    console.log('- Mensagens limpas.');

    await prisma.$executeRawUnsafe('DELETE FROM [dbo].[Conversation]');
    console.log('- Conversas limpas.');

    await prisma.$executeRawUnsafe('DELETE FROM [dbo].[Contact]');
    console.log('- Contatos limpos.');

    console.log('✅ Banco de dados limpo com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
