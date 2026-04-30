import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function mergeContacts() {
  console.log('--- Iniciando Mesclagem de Contatos ---');

  // Busca todos os contatos
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const seenNames = new Map<string, any>();
  const toDelete: string[] = [];

  for (const contact of contacts) {
    if (!contact.name) continue;

    const cleanName = contact.name.trim();

    if (seenNames.has(cleanName)) {
      const master = seenNames.get(cleanName);
      console.log(`[MERGE] Unificando "${cleanName}" (${contact.number}) -> Master (${master.number})`);

      // 1. Move Conversas
      await prisma.conversation.updateMany({
        where: { contactId: contact.id },
        data: { contactId: master.id }
      });

      toDelete.push(contact.id);
    } else {
      seenNames.set(cleanName, contact);
    }
  }

  // 2. Apaga os duplicados
  if (toDelete.length > 0) {
    await prisma.contact.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log(`[SUCCESS] ${toDelete.length} contatos duplicados removidos.`);
  } else {
    console.log('[INFO] Nenhum contato duplicado encontrado.');
  }

  console.log('--- Mesclagem Concluída ---');
}

mergeContacts()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
