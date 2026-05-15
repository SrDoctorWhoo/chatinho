require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaMssql(connectionString);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    let botDept = await prisma.department.findFirst({ 
      where: { name: { contains: 'BOT' } } 
    });

    if (!botDept) {
      botDept = await prisma.department.create({ 
        data: { 
          name: 'BOT / Automação', 
          description: 'Setor de monitoramento das automações (Admin Only)' 
        } 
      });
      console.log('Setor BOT criado com sucesso!');
    } else {
      console.log('Setor BOT já existe.');
    }
    
    console.log('ID do Setor:', botDept.id);
  } catch (err) {
    console.error('Erro ao criar setor:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
