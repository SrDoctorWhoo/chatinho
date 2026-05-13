
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInstances() {
  try {
    const instances = await prisma.whatsappInstance.findMany({
      include: { departments: true }
    });
    console.log('--- Instâncias ---');
    console.log(JSON.stringify(instances, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstances();
