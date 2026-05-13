import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma connection...');
    const contactCount = await prisma.contact.count();
    console.log(`Contacts found: ${contactCount}`);
    
    console.log('Testing findUnique with number_platform...');
    const contact = await prisma.contact.findUnique({
      where: {
        number_platform: {
          number: 'test',
          platform: 'WHATSAPP'
        }
      }
    });
    console.log('Test successful, contact found:', contact);
  } catch (error) {
    console.error('Prisma test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
