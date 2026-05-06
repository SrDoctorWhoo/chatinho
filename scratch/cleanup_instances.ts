import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega o .env da raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

async function cleanup() {
  console.log('--- Iniciando Limpeza de Instâncias ---');
  console.log('API URL:', EVOLUTION_API_URL);
  
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.error('Erro: Variáveis de ambiente EVOLUTION_API_URL ou EVOLUTION_API_KEY não encontradas.');
    return;
  }

  try {
    // 1. Busca instâncias na Evolution
    const evoRes = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    const evoInstances = evoRes.data.map((i: any) => i.name);
    console.log('Instâncias na Evolution:', evoInstances);

    // 2. Busca instâncias no Banco Local
    const localInstances = await prisma.whatsappInstance.findMany();
    const localIds = localInstances.map(i => i.instanceId);
    console.log('Instâncias no Banco Local:', localIds);

    // 3. Identifica as que estão no banco mas NÃO na Evolution
    const toDelete = localInstances.filter(i => !evoInstances.includes(i.instanceId));
    
    if (toDelete.length === 0) {
      console.log('Nenhuma instância fantasma encontrada.');
    } else {
      console.log(`Removendo ${toDelete.length} instâncias fantasmas...`);
      for (const inst of toDelete) {
        await prisma.whatsappInstance.delete({ where: { id: inst.id } });
        console.log(`- Removida do Banco: ${inst.name} (${inst.instanceId})`);
      }
    }
    
    console.log('--- Limpeza Concluída com Sucesso ---');
  } catch (err: any) {
    console.error('Erro durante a limpeza:', err.response?.data || err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
