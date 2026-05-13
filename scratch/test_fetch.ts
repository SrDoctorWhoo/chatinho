import { prisma } from '../lib/prisma';

async function test() {
  try {
    const id = 'cm6890p6p0006y8r6l3y8r6l3'; // Example ID from logs if I had one, but I'll search for one
    const conversation = await prisma.conversation.findFirst({
      include: {
        contact: true,
        messages: {
          take: 1
        }
      }
    });

    if (!conversation) {
      console.log('No conversations found');
      return;
    }

    console.log('Testing conversation:', conversation.id);
    
    const messages = await prisma.message.findMany({
      where: { 
        conversation: {
          contactId: conversation.contactId
        }
      },
      take: 10
    });

    console.log('Found messages:', messages.length);
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
