import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL || '';

async function main() {
  console.log('🚀 Iniciando faxina completa no banco de dados...');
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL não encontrada no .env');
    return;
  }

  const adapter = new PrismaMssql(connectionString);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Limpa mensagens (dependem de Conversation)
    const delMsg = await prisma.message.deleteMany({});
    console.log(`✅ Mensagens deletadas: ${delMsg.count}`);
    
    // 2. Limpa conversas (Tickets)
    const delConv = await prisma.conversation.deleteMany({});
    console.log(`✅ Tickets/Conversas deletados: ${delConv.count}`);
    
    // 3. Limpa contatos
    const delContact = await prisma.contact.deleteMany({});
    console.log(`✅ Contatos deletados: ${delContact.count}`);

    // 4. Limpa chat interno
    const delInternalMsg = await prisma.internalMessage.deleteMany({});
    const delInternalPart = await prisma.internalChatParticipant.deleteMany({});
    const delInternalChat = await prisma.internalChat.deleteMany({});
    console.log(`✅ Dados internos limpos (Msgs: ${delInternalMsg.count}, Chats: ${delInternalChat.count})`);

    console.log('✨ Faxina concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a faxina:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
