const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const filter = {}; // mock filter
    
    console.log("Checking conversations query...");
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { status: { in: ['QUEUED', 'ACTIVE', 'BOT'] }, ...filter },
          { status: 'CLOSED', updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, ...filter }
        ]
      },
      include: {
        contact: true,
        department: true,
        assignedTo: { select: { name: true, image: true } },
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    console.log(`Found ${conversations.length} conversations`);

    console.log("Checking tasks query...");
    const tasks = await prisma.task.findMany({
      where: filter,
      include: {
        department: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    console.log(`Found ${tasks.length} tasks`);
    
    console.log("All queries successful");
  } catch (error) {
    console.error("PRISMA ERROR:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
