import { prisma } from '../lib/prisma';

async function main() {
  try {
    const count = await prisma.cannedResponse.count();
    console.log('CannedResponse table exists. Current count:', count);
  } catch (err: any) {
    console.error('Error accessing CannedResponse table:');
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
