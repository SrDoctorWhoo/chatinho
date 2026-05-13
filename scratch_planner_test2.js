const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Wait, let's use the compiled one from lib

async function test() {
  const users = await prisma.user.findMany({ include: { departments: true } });
  console.log(users);
}
test();
