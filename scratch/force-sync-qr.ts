import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function sync() {
  const api = axios.create({
    baseURL: process.env.EVOLUTION_API_URL,
    headers: { apikey: process.env.EVOLUTION_API_KEY }
  });

  try {
    console.log('--- Iniciando Sincronização Forçada ---');
    console.log('API URL:', process.env.EVOLUTION_API_URL);
    
    // 1. Busca o QR Code na Evolution
    const res = await api.get('/instance/connect/TESTE');
    const qr = res.data.base64 || res.data.code;

    if (qr) {
      console.log('✅ QR Code obtido da Evolution API.');
      
      // 2. Atualiza no Banco de Dados
      const result = await prisma.whatsappInstance.updateMany({
        where: {
          OR: [
            { instanceId: 'TESTE' },
            { name: 'TESTE' }
          ]
        },
        data: {
          qrcode: qr.includes('base64') ? qr : `data:image/png;base64,${qr}`,
          status: 'QRCODE'
        }
      });

      console.log(`✅ Banco de dados atualizado. Registros afetados: ${result.count}`);
    } else {
      console.error('❌ A API respondeu, mas não enviou um QR Code. Resposta:', res.data);
    }
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sync();
