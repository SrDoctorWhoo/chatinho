const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanBadContacts() {
  console.log('Procurando contatos inválidos...');
  const contacts = await prisma.contact.findMany();
  
  for (const contact of contacts) {
    if (contact.number.length > 14) { // LIDs usually have 15+ digits
      console.log(`Limpando contato inválido: ${contact.number}`);
      
      // Delete messages
      const convs = await prisma.conversation.findMany({ where: { contactId: contact.id } });
      for (const conv of convs) {
        await prisma.message.deleteMany({ where: { conversationId: conv.id } });
      }
      
      // Delete conversations
      await prisma.conversation.deleteMany({ where: { contactId: contact.id } });
      
      // Delete contact
      await prisma.contact.delete({ where: { id: contact.id } });
    }
  }
  console.log('Limpeza concluída!');
}

cleanBadContacts().catch(console.error).finally(() => prisma.$disconnect());
