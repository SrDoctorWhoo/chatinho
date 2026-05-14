import { NextResponse } from 'next/server';
import { processInboundConversationMessage } from '@/lib/inboundMessage';
import { prisma } from '@/lib/prisma';
import { MediaService } from '@/lib/mediaService';
import { whatsappService } from '@/lib/whatsapp';

const lastMessageTimes = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('\n%c--- 🌐 WEBHOOK RECEBIDO (WHATSAPP) ---', 'background: #25d366; color: black; padding: 4px; font-weight: bold');
    console.log(`[Webhook] Path: ${req.url}`);
    console.log(JSON.stringify(body, null, 2));
    console.log('------------------------------------\n');

    const event = (body.event || '').toLowerCase();
    console.log(`[Webhook] Evento: ${event}`);

    const instanceName = body.instance || body.instanceName || body.instanceId;
    const statusData = body.statuses?.[0] || body.data?.status;

    if (statusData && (event === 'messages.update' || event === 'message_update')) {
      const id = statusData.id || statusData.key?.id;
      const status = statusData.status || statusData.state;
      const errors = statusData.errors;

      console.log(`[Status Update] Mensagem ${id} -> ${status}`);

      if (status === 'failed' || status === 'error') {
        console.error('[Message Failed] Erro:', JSON.stringify(errors, null, 2));
      }

      return NextResponse.json({ success: true });
    }

    if (instanceName && (event === 'connection_update' || event === 'connection.update')) {
      const state = body.data?.state || body.state || body.status;
      const owner = body.data?.owner || body.owner || body.data?.number || body.number || body.data?.wuid;

      console.log(`[Webhook] Atualizando status de ${instanceName}: ${state}`);
      await prisma.whatsappInstance.upsert({
        where: { instanceId: instanceName },
        update: {
          status: state === 'open' || state === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
          number: owner ? String(owner).split('@')[0] : undefined,
        },
        create: {
          instanceId: instanceName,
          name: instanceName,
          status: state === 'open' || state === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
          number: owner ? String(owner).split('@')[0] : undefined,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (event === 'messages.upsert' || event === 'messages_upsert' || event === 'message') {
      const messageData = body.data || body;
      console.log(`[Webhook] Mensagem de ${messageData.key?.remoteJid || 'N/A'} na instancia ${body.instance || 'N/A'}`);

      let remoteJid =
        messageData.key?.remoteJid ||
        messageData.remoteJid ||
        messageData.from ||
        body.sender?.remoteJid;

      const dbInstance = instanceName
        ? await prisma.whatsappInstance.findUnique({
            where: { instanceId: instanceName },
          })
        : null;

      if (dbInstance && !dbInstance.isActive) {
        console.log(`[Webhook] Instancia "${instanceName}" esta inativa. Ignorando mensagem.`);
        return NextResponse.json({ success: true });
      }

      const isTelegram = dbInstance?.integration === 'TELEGRAM';
      const platform = isTelegram ? 'TELEGRAM' : 'WHATSAPP';

      if (remoteJid && !remoteJid.includes('@') && !isTelegram) {
        remoteJid = `${remoteJid}@s.whatsapp.net`;
      }

      if (!remoteJid && body.sender?.number) {
        remoteJid = isTelegram ? String(body.sender.number) : `${body.sender.number}@s.whatsapp.net`;
      }

      const fromMe =
        messageData.key?.fromMe === true ||
        messageData.fromMe === true ||
        body.fromMe === true ||
        messageData.key?.fromMe === 'true' ||
        body.sender?.isMe === true;

      const text =
        messageData.message?.conversation ||
        messageData.message?.extendedTextMessage?.text ||
        messageData.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        messageData.message?.buttonsResponseMessage?.selectedButtonId ||
        messageData.message?.templateButtonReplyMessage?.selectedId ||
        messageData.message?.imageMessage?.caption ||
        messageData.message?.videoMessage?.caption ||
        messageData.content ||
        messageData.text ||
        messageData.message?.text ||
        (messageData.message?.imageMessage
          ? '[Imagem]'
          : messageData.message?.audioMessage
          ? '[Audio]'
          : messageData.message?.videoMessage
          ? '[Video]'
          : messageData.message?.documentMessage
          ? '[Documento]'
          : null) ||
        (typeof messageData.message === 'string' ? messageData.message : null) ||
        body.message?.text;

      if (!remoteJid) {
        return NextResponse.json({ success: true });
      }

      const antiLoopKey = `${platform}:${remoteJid}`;
      const now = Date.now();
      const lastTime = lastMessageTimes.get(antiLoopKey) || 0;

      if (now - lastTime < 1500) {
        console.log(`[Webhook] Bloqueio anti-loop ativado para ${remoteJid}`);
        return NextResponse.json({ success: true });
      }

      lastMessageTimes.set(antiLoopKey, now);

      if (!isTelegram && (remoteJid.includes('status@broadcast') || remoteJid.includes('@g.us'))) {
        console.log(`[Webhook] Mensagem ignorada (status ou grupo): ${remoteJid}`);
        return NextResponse.json({ success: true });
      }

      if (text) {
        const rawMessageType = (messageData.messageType || body.messageType || '').toLowerCase();
        const messageType = rawMessageType.includes('image')
          ? 'image'
          : rawMessageType.includes('audio') || rawMessageType.includes('ptt')
          ? 'audio'
          : rawMessageType.includes('video')
          ? 'video'
          : rawMessageType.includes('document')
          ? 'document'
          : messageData.message?.imageMessage
          ? 'image'
          : messageData.message?.audioMessage || messageData.message?.pttMessage
          ? 'audio'
          : 'chat';

        const localMediaUrl = await MediaService.downloadMedia(instanceName, messageData, messageType);
        const pushName = messageData.pushName || body.sender?.pushName || body.data?.pushName || body.pushName;
        const profilePic = await whatsappService.getProfilePictureUrl(instanceName, remoteJid).catch(() => null);

        await processInboundConversationMessage({
          instanceName: instanceName || 'TESTE',
          platform,
          remoteJid,
          text: text || `[${messageType}]`,
          fromMe: fromMe || false,
          pushName,
          messageType,
          mediaUrl: localMediaUrl,
          profilePicUrl: profilePic,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error';
    console.error('Webhook error:', message);
    return NextResponse.json({ error: 'Webhook failed', details: message }, { status: 500 });
  }
}
