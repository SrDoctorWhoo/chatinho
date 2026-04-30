import express from 'express';
import cors from 'cors';
import { whatsappService } from '../lib/whatsapp';
import { prisma } from '../lib/prisma';

async function startAllSessions() {
  console.log('--- Iniciando Motores do WhatsApp ---');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO: DATABASE_URL não definida no ambiente');
    return;
  }

  try {
    // Get all instances
    const instances = await prisma.whatsappInstance.findMany();

    console.log(`Encontradas ${instances.length} instâncias no total.`);

    for (const instance of instances) {
      try {
        console.log(`Iniciando motor para: ${instance.name} (${instance.status})`);
        // If it's already connected, Baileys will handle the session restoration
        // If it's disconnected, we start it to get a new QR code if requested
        await whatsappService.initSession(instance.instanceId);
      } catch (err) {
        console.error(`Erro ao iniciar ${instance.name}:`, err);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar instâncias no banco:', err);
  }
}

// Keep the process alive
console.log('--- Servidor WhatsApp Ativo e Ouvindo ---');
startAllSessions()
  .then(() => {
    // Heartbeat to keep process alive and check for new instances
    setInterval(async () => {
      try {
        const instances = await prisma.whatsappInstance.findMany();
        for (const instance of instances) {
          // If we have a new instance or one that was disconnected, try to init
          // Note: whatsappService.initSession should handle if it's already running
          if (instance.status === 'DISCONNECTED' || instance.status === 'QRCODE') {
            // Only init if we don't already have an active session for it
            if (!whatsappService.getSession(instance.instanceId)) {
              console.log(`[WhatsApp Server] Detectada instância pendente: ${instance.name}`);
              await whatsappService.initSession(instance.instanceId);
            }
          }
        }
      } catch (err) {
        console.error('[WhatsApp Server] Erro no loop de monitoramento:', err);
      }
    }, 10000); // Check every 10 seconds
  })
  .catch(console.error);

// --- Configuração do Servidor API ---
const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-message', async (req, res) => {
  const { instanceId, number, text } = req.body;

  if (!instanceId || !number || !text) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    console.log(`[WhatsApp Server] Enviando mensagem para ${number} via ${instanceId}`);
    const result = await whatsappService.sendMessage(instanceId, number, text);
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error(`[WhatsApp Server] Erro ao enviar mensagem:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

const API_PORT = 3002;
app.listen(API_PORT, () => {
  console.log(`--- API do WhatsApp Motor rodando na porta ${API_PORT} ---`);
});

// Prevent process from exiting on errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
