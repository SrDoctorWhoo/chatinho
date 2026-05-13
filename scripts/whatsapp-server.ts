import express from 'express';
import cors from 'cors';
import { telegramService } from '../lib/telegram';
import { whatsappService } from '../lib/whatsapp';
import { prisma } from '../lib/prisma';

async function syncInstancesStatus() {
  console.log('--- Sincronizando Status com Evolution API ---');
  
  try {
    const instances = await prisma.whatsappInstance.findMany();

    for (const instance of instances) {
      try {
        if (instance.integration === 'TELEGRAM') {
          if (!instance.token) {
            await prisma.whatsappInstance.update({
              where: { instanceId: instance.instanceId },
              data: { status: 'DISCONNECTED' }
            });
            continue;
          }

          try {
            const me = await telegramService.getMe(instance.token);
            await telegramService.setWebhook(instance.instanceId, instance.token);
            await prisma.whatsappInstance.update({
              where: { instanceId: instance.instanceId },
              data: {
                status: 'CONNECTED',
                number: me.username ? `@${me.username}` : String(me.id),
                qrcode: null
              }
            });
          } catch {
            await prisma.whatsappInstance.update({
              where: { instanceId: instance.instanceId },
              data: { status: 'DISCONNECTED' }
            });
          }

          continue;
        }

        const status = await whatsappService.getSessionStatus(instance.instanceId);
        
        // Se a instância existe na Evolution
        if (status) {
          const state = 
            status.instance?.state || 
            status.state || 
            status.instanceStatus || 
            status.instance?.status || 
            status.instance?.instanceStatus || 
            status.status;

          const dbStatus = (state === 'open' || state === 'CONNECTED' || state === 'online') ? 'CONNECTED' : 'DISCONNECTED';
          
          if (dbStatus === 'CONNECTED') {
            console.log(`[WhatsApp Server] Instância ${instance.name} online. Atualizando Webhook...`);
            const result = await whatsappService.setWebhook(instance.instanceId);
            if (result) {
              console.log(`[WhatsApp Server] Webhook configurado com sucesso para ${instance.instanceId}`);
            } else {
              console.error(`[WhatsApp Server] FALHA ao configurar webhook para ${instance.instanceId}`);
            }
            
            if (instance.status !== 'CONNECTED') {
              await prisma.whatsappInstance.update({
                where: { instanceId: instance.instanceId },
                data: { status: 'CONNECTED', qrcode: null }
              });
            }
          } else {
            // Se existe mas não está conectada, precisamos garantir que temos o QR Code
            console.log(`[WhatsApp Server] Instância ${instance.name} desconectada. Atualizando QR Code...`);
            await whatsappService.initSession(instance.instanceId);
          }
        } else {
          // Se não retornou status nenhum, tenta inicializar/conectar
          console.log(`[WhatsApp Server] Instância ${instance.name} sem resposta do Evolution. Tentando inicializar...`);
          await whatsappService.initSession(instance.instanceId);
        }
      } catch (err) {
        console.error(`Erro ao sincronizar ${instance.name}:`, err);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar instâncias no banco:', err);
  }
}

// Keep the process alive and sync periodically
console.log('--- Servidor WhatsApp (Evolution Proxy) Ativo ---');
syncInstancesStatus()
  .then(() => {
    setInterval(syncInstancesStatus, 30000); // Sincroniza a cada 30 segundos
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
    console.log(`[WhatsApp Server] Proxying mensagem para ${number} via Evolution API (${instanceId})`);
    const result = await whatsappService.sendMessage(instanceId, number, text);
    return res.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send message';
    console.error(`[WhatsApp Server] Erro ao enviar mensagem via Evolution:`, message);
    return res.status(500).json({ error: message });
  }
});

const API_PORT = 3002;
app.listen(API_PORT, () => {
  console.log(`--- API do WhatsApp (Evolution Proxy) rodando na porta ${API_PORT} ---`);
});

// Prevent process from exiting on errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

