import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';

// 🛡️ Trava Anti-Loop em Memória
const lastMessageTimes = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('\n--- 📥 WEBHOOK RECEBIDO ---');
    console.log(JSON.stringify(body, null, 2));
    console.log('---------------------------\n');
    
    const event = (body.event || '').toLowerCase();
    console.log(`[Webhook] Evento: ${event}`);

    if (event === 'messages.upsert' || event === 'messages_upsert') {
      const messageData = body.data;
      const remoteJid = messageData.key?.remoteJid || messageData.remoteJid;
      
      // 🛡️ Proteção 1: Detecção robusta de fromMe
      const fromMe = messageData.key?.fromMe === true || 
                     messageData.fromMe === true || 
                     body.fromMe === true ||
                     messageData.key?.fromMe === 'true';

      const text = messageData.message?.conversation || 
                   messageData.message?.extendedTextMessage?.text ||
                   messageData.message?.imageMessage?.caption ||
                   messageData.message?.videoMessage?.caption ||
                   messageData.content || 
                   messageData.text;

      if (fromMe) {
        console.log(`[Webhook] ✋ Ignorando mensagem enviada por nós (fromMe: ${fromMe})`);
        return NextResponse.json({ success: true });
      }

      // 🛡️ Proteção 2: Trava de velocidade (Anti-Loop)
      const now = Date.now();
      const lastTime = lastMessageTimes.get(remoteJid) || 0;
      if (now - lastTime < 1500) { // Menos de 1.5 segundos entre mensagens = Provável Loop
        console.log(`[Webhook] ⚠️ Bloqueio Anti-Loop ativado para ${remoteJid} (Velocidade excessiva)`);
        return NextResponse.json({ success: true });
      }
      lastMessageTimes.set(remoteJid, now);

      console.log(`[Webhook] 📩 Processando mensagem de: ${remoteJid}`);

      // Ignora APENAS mensagens de status e grupos (se desejar)
      if (remoteJid?.includes('status@broadcast') || remoteJid?.includes('@g.us')) {
        console.log(`[Webhook] Mensagem ignorada (Status ou Grupo): ${remoteJid}`);
        return NextResponse.json({ success: true });
      }

      if (text && remoteJid) {
        // Se for um LID, salvamos o ID inteiro para podermos responder. Se for número normal, tiramos o sufixo.
        const number = remoteJid.includes('@lid') ? remoteJid : remoteJid.split('@')[0];

        // 1. Find or create contact
        let contact = await prisma.contact.findUnique({
          where: { number }
        });

        const pushName = messageData.pushName || body.sender?.pushName || body.data?.pushName;
        const instanceName = body.instance || body.instanceName || 'TESTE';

        if (!contact) {
          const profilePic = await whatsappService.getProfilePictureUrl(instanceName, remoteJid).catch(() => null);
          contact = await prisma.contact.create({
            data: { 
              number, 
              name: pushName || number,
              profilePic
            }
          });
        } else if (pushName && (!contact.name || contact.name === contact.number || contact.name === 'TESTE')) {
          // Atualiza o nome se ele estiver vazio ou genérico
          contact = await prisma.contact.update({
            where: { id: contact.id },
            data: { name: pushName }
          });
        }

        // 2. Find or create conversation
        let conversation = await prisma.conversation.findFirst({
          where: { contactId: contact.id, status: { not: 'CLOSED' } }
        });

        const isNewConversation = !conversation;

        if (!conversation) {
          // Check if there is a default or any active flow
          const flow = await prisma.chatbotFlow.findFirst({
            where: { isActive: true }
          });

          conversation = await prisma.conversation.create({
            data: { 
              contactId: contact.id,
              status: flow ? 'BOT' : 'QUEUED',
              isBotActive: !!flow
            }
          });
        } else if (!conversation.assignedToId && !conversation.isBotActive && conversation.status !== 'CLOSED') {
          // Se não tem ninguém atendendo e o bot tá desligado, vamos ver se ligamos ele
          const flow = await prisma.chatbotFlow.findFirst({
            where: { isActive: true }
          });
          if (flow) {
            conversation = await prisma.conversation.update({
              where: { id: conversation.id },
              data: { isBotActive: true, status: 'BOT' }
            });
            console.log(`[Webhook] Ativando Bot para conversa existente: ${contact.number}`);
          }
        }

        // 3. Save message
        const savedMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            body: text,
            fromMe: fromMe || false,
          }
        });

        // 4. Update lastMessageAt
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() }
        });

        // 5. Bot Engine Processing
        // Permitimos processar se: 
        // a) O bot já está ativo na conversa
        // b) OU se a conversa não tem atendente e o bot pode ser "acordado" por um gatilho
        const canTriggerBot = !conversation.assignedToId || conversation.isBotActive;

        if (!fromMe && canTriggerBot) {
          const { botEngine } = await import('@/lib/botEngine');
          await botEngine.processMessage(conversation.id, text, instanceName, remoteJid);
        }

        // Fetch fresh conversation state after bot might have changed it (e.g. to QUEUED)
        const freshConversation = await prisma.conversation.findUnique({
          where: { id: conversation.id },
          include: { contact: true, assignedTo: true }
        });

        // 6. Notify Socket.io server
        try {
          await fetch(`${process.env.SOCKET_URL || 'http://localhost:3005'}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_message',
              data: {
                conversationId: conversation.id,
                message: savedMessage,
                conversation: freshConversation
              }
            })
          });
        } catch (err) {
          console.error('Failed to notify socket server:', err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
