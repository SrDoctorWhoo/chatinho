import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Limpando dados de teste para corrigir o Chat ---');
  
  // 1. Deletar mensagens
  await prisma.message.deleteMany({});
  
  // 2. Deletar conversas
  await prisma.conversation.deleteMany({});
  
  // 3. Deletar contatos
  await prisma.contact.deleteMany({});

  console.log('✅ Banco de dados limpo com sucesso!');
  console.log('Agora, ao receber uma nova mensagem, tudo será criado no formato correto.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
