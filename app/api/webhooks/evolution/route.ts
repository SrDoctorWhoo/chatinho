import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data, instanceId } = body;

    console.log(`[Webhook Evolution] Evento recebido: ${event} para instância ${instanceId}`);

    if (event === 'MESSAGES_UPSERT') {
      const message = data.message;
      if (!message.key.fromMe) {
        const jid = message.key.remoteJid;
        if (!jid || jid.endsWith('@g.us')) {
          return NextResponse.json({ success: true, message: 'Ignored group or empty JID' });
        }

        const number = jid.split('@')[0];
        const pushName = data.pushName || number;
        const text = message.conversation || 
                     message.extendedTextMessage?.text || 
                     (message.imageMessage ? '[Imagem]' : 
                      message.audioMessage ? '[Áudio]' : 
                      message.videoMessage ? '[Vídeo]' : 
                      message.documentMessage ? '[Documento]' : '[Mensagem]');

        const mediaUrl = message.imageMessage?.url || 
                         message.audioMessage?.url || 
                         message.videoMessage?.url || 
                         message.documentMessage?.url || null;

        if (text) {
          // Process message logic
          let contact = await prisma.contact.findFirst({
            where: {
              OR: [
                { number: jid },
                { name: pushName }
              ]
            }
          });

          if (!contact) {
            contact = await prisma.contact.create({
              data: {
                number: jid,
                name: pushName,
                profilePic: data.profilePicUrl || null,
              }
            });
          } else if (!contact.profilePic && data.profilePicUrl) {
            contact = await prisma.contact.update({
              where: { id: contact.id },
              data: { profilePic: data.profilePicUrl }
            });
          }

          let conversation = await prisma.conversation.findFirst({
            where: { contactId: contact.id, status: { not: 'CLOSED' } }
          });

          if (!conversation) {
            const { generateProtocol } = await import('@/lib/protocol');
            conversation = await prisma.conversation.create({
              data: { contactId: contact.id, status: 'ACTIVE', protocol: generateProtocol() }
            });
          }

          const newMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              body: text,
              fromMe: false,
              type: message.imageMessage ? 'image' : 
                    message.audioMessage ? 'audio' : 
                    message.videoMessage ? 'video' : 
                    message.documentMessage ? 'document' : 'chat',
              mediaUrl: mediaUrl,
            }
          });

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() }
          });

          // Notify Socket
          try {
            const socketUrl = process.env.SOCKET_URL || 'http://127.0.0.1:3000';
            const notifyUrl = `${socketUrl.replace(/\/$/, '')}/api/internal/notify-socket`;
            console.log(`[Webhook Evolution] Notificando socket em: ${notifyUrl} para conversa ${conversation.id}`);
            
            const notifyRes = await fetch(notifyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'new_message',
                data: {
                  conversationId: conversation.id,
                  contactId: contact.id,
                  message: {
                    ...newMessage,
                    timestamp: newMessage.timestamp.toISOString()
                  },
                  conversation: {
                    ...conversation,
                    lastMessageAt: new Date().toISOString()
                  }
                }
              })
            });
            if (notifyRes.ok) {
              console.log(`[Webhook Evolution] ✅ Socket notificado com sucesso`);
            } else {
              const errText = await notifyRes.text();
              console.error(`[Webhook Evolution] ❌ Falha na notificação: ${notifyRes.status} - ${errText}`);
            }
          } catch (e) {
            console.error('[Webhook Evolution] ❌ Erro ao notificar socket:', e);
          }
        }
      }
    } else if (event === 'CONNECTION_UPDATE') {
      const status = data.state === 'open' ? 'CONNECTED' : 'DISCONNECTED';
      await prisma.whatsappInstance.update({
        where: { instanceId },
        data: { status, qrcode: null }
      });
    } else if (event === 'QRCODE_UPDATED') {
      const qrCode = data.qrcode.base64;
      await prisma.whatsappInstance.update({
        where: { instanceId },
        data: { 
          qrcode: qrCode.includes('base64') ? qrCode : `data:image/png;base64,${qrCode}`,
          status: 'QRCODE' 
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Webhook Evolution] Erro fatal:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
