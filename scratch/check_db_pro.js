const { prisma } = require('../lib/prisma');

async function main() {
  try {
    const flows = await prisma.chatbotFlow.findMany({
      include: {
        nodes: {
          orderBy: { id: 'asc' }
        }
      }
    });
    
    console.log('--- FLUXOS ENCONTRADOS ---');
    flows.forEach(f => {
      console.log(`ID: ${f.id}`);
      console.log(`Nome: ${f.name}`);
      console.log(`Ativo: ${f.isActive}`);
      console.log(`Padrão: ${f.isDefault}`);
      console.log(`Gatilhos: "${f.triggerKeywords}"`);
      console.log(`Nós: ${f.nodes.length}`);
      console.log('--------------------------');
    });

    const conversations = await prisma.conversation.findMany({
      where: { status: 'BOT' },
      include: { contact: true }
    });
    console.log(`\nConversas em modo BOT: ${conversations.length}`);
    conversations.forEach(c => {
      console.log(`- ${c.contact.number} (Flow: ${c.currentFlowId}, Step: ${c.currentStepId})`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
