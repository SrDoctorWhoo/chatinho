const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaMssql(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const msgCount = await prisma.message.count();
  const convCount = await prisma.conversation.count();
  const contactCount = await prisma.contact.count();
  
  console.log(`📊 Status Atual do Banco:`);
  console.log(`- Mensagens: ${msgCount}`);
  console.log(`- Conversas: ${convCount}`);
  console.log(`- Contatos: ${contactCount}`);
  
  await prisma.$disconnect();
}

main();
