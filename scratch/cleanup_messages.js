const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando limpeza do banco de dados de mensagens...');
  
  try {
    // Deleta todas as mensagens normais
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Mensagens normais deletadas: ${deletedMessages.count}`);
    
    // Deleta todas as mensagens internas
    const deletedInternal = await prisma.internalMessage.deleteMany({});
    console.log(`✅ Mensagens internas deletadas: ${deletedInternal.count}`);
    
    // Opcional: Resetar sequências ou IDs se necessário (depende do DB)
    // No SQL Server/Prisma, deleteMany é suficiente para limpar os dados.

    console.log('✨ Limpeza concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
