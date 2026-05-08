import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const instances = await prisma.whatsappInstance.findMany();
  console.log(JSON.stringify(instances, null, 2));
}
main();
