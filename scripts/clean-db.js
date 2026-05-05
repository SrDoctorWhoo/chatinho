const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaMssql(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Iniciando limpeza do banco de dados (MSSQL)...');

  try {
    // MSSQL requer DELETE direto
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
