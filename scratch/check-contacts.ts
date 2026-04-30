import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany();
  console.log(JSON.stringify(contacts, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
