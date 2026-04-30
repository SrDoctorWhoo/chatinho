import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore,
  WASocket
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

// Store active connections in memory
const sessions = new Map<string, WASocket>();
const qrCodes = new Map<string, string>();

export const whatsappService = {
  async initSession(instanceId: string) {
    // 1. Clean up existing session if any
    const existingSession = sessions.get(instanceId);
    if (existingSession) {
      console.log(`[WhatsApp] Fechando sessão existente para ${instanceId}`);
      try { existingSession.end(undefined); } catch (e) {}
      sessions.delete(instanceId);
    }

    const sessionDir = path.join(process.cwd(), 'sessions', instanceId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'warn' })),
      },
      logger: pino({ level: 'warn' }),
      browser: ['Chatinho', 'Chrome', '1.0.0'],
    });

    sessions.set(instanceId, sock);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsApp] Novo QR Code para ${instanceId}`);
        const qrBase64 = await QRCode.toDataURL(qr);
        qrCodes.set(instanceId, qrBase64);
        
        await prisma.whatsappInstance.update({
          where: { instanceId },
          data: { qrcode: qrBase64, status: 'QRCODE' }
        });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp] Conexão fechada para ${instanceId}. Reconectando:`, shouldReconnect);
        
        if (!shouldReconnect) {
          sessions.delete(instanceId);
          qrCodes.delete(instanceId);
          // fs.rmSync(sessionDir, { recursive: true, force: true });
          await prisma.whatsappInstance.update({
            where: { instanceId },
            data: { status: 'DISCONNECTED', qrcode: null }
          });
        } else {
          // Reconnect logic
          setTimeout(() => this.initSession(instanceId), 5000);
        }
      } else if (connection === 'open') {
        console.log(`[WhatsApp] Conexão aberta para ${instanceId}`);
        qrCodes.delete(instanceId);
        await prisma.whatsappInstance.update({
          where: { instanceId },
          data: { status: 'CONNECTED', qrcode: null }
        });
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            const jid = msg.key.remoteJid;
            if (!jid || jid.endsWith('@g.us')) continue; // Ignora grupos

            console.log(`[DEBUG] Mensagem recebida de JID: ${jid}`);
            
            const number = jid.split('@')[0];
            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         (msg.message.imageMessage ? '[Imagem]' : '[Mensagem]');
            
            if (!body) continue;

            try {
              // Unified Identity Logic: Try to find existing contact by JID OR name (if LID)
              let contact = await prisma.contact.findFirst({
                where: {
                  OR: [
                    { number: jid },
                    { name: msg.pushName || undefined }
                  ]
                }
              });

              if (!contact) {
                contact = await prisma.contact.create({
                  data: {
                    number: jid,
                    name: msg.pushName || number,
                  }
                });
              } else if (contact.number !== jid && jid.includes('@lid')) {
                console.log(`[DEBUG] Unificando LID ${jid} ao contato existente ${contact.name}`);
              }

              let conversation = await prisma.conversation.findFirst({
                where: { contactId: contact.id, status: { not: 'CLOSED' } }
              });

              if (!conversation) {
                conversation = await prisma.conversation.create({
                  data: { contactId: contact.id, status: 'ACTIVE' }
                });
              }

              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  body,
                  fromMe: false,
                  type: msg.message.imageMessage ? 'image' : 'chat',
                }
              });

              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
              });

              // Notify Socket
              try {
                const messageData = {
                  id: Date.now().toString(),
                  conversationId: conversation.id,
                  body,
                  fromMe: false,
                  timestamp: new Date().toISOString(),
                  type: msg.message.imageMessage ? 'image' : 'chat',
                };

                await fetch(`http://localhost:${process.env.SOCKET_PORT || 3001}/notify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'new_message',
                    data: {
                      conversationId: conversation.id,
                      contactId: contact.id,
                      message: messageData
                    }
                  })
                });
              } catch (e) {}

            } catch (err) {
              console.error('[WhatsApp] Erro ao processar mensagem:', err);
            }
          }
        }
      }
    });

    return sock;
  },

  getQrCode(instanceId: string) {
    return qrCodes.get(instanceId);
  },

  getSession(instanceId: string) {
    return sessions.get(instanceId);
  },

  async sendMessage(instanceId: string, number: string, text: string) {
    const session = sessions.get(instanceId);
    if (!session) {
      console.error(`[WhatsApp] Sessão ${instanceId} não encontrada no Map de sessões.`);
      throw new Error('Sessão não ativa no motor');
    }
    
    // Construct JID correctly
    let jid = number;
    if (!jid.includes('@')) {
      const cleanNumber = number.replace(/\D/g, '');
      // Logic for LID vs PN: IDs starting with 1 and ~15 digits are usually LIDs
      if (cleanNumber.length >= 15 && cleanNumber.startsWith('1')) {
        jid = `${cleanNumber}@lid`;
      } else {
        jid = `${cleanNumber}@s.whatsapp.net`;
      }
    }
    
    console.log(`[WhatsApp Server] Despachando via Baileys para: ${jid}`);
    
    try {
      const result = await session.sendMessage(jid, { text });
      console.log(`[DEBUG] Resultado do envio Baileys:`, !!result);
      return result;
    } catch (err: any) {
      console.error(`[DEBUG] Falha fatal no session.sendMessage:`, err.message);
      throw err;
    }
  }
};
