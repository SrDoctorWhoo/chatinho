const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const tasks = await prisma.task.findMany();
    console.log(tasks);
  } catch (e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}

run();
