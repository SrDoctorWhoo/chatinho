
const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');

async function main() {
  const adapter = new PrismaMssql(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    console.table(users.map(u => ({ id: u.id, name: u.name })));

    const conversations = await prisma.conversation.findMany({
      include: { contact: true }
    });
    console.log('\n--- CONVERSATIONS ---');
    console.table(conversations.map(c => ({ 
      id: c.id, 
      contact: c.contact.name || c.contact.number,
      status: c.status,
      assignedToId: c.assignedToId 
    })));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
