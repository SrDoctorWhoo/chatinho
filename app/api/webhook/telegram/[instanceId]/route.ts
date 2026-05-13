import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { processInboundConversationMessage } from '@/lib/inboundMessage';
import { prisma } from '@/lib/prisma';
import { telegramService } from '@/lib/telegram';

const lastTelegramMessageTimes = new Map<string, number>();

type TelegramIncomingMessage = {
  from?: {
    is_bot?: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  chat?: {
    id?: number | string;
    title?: string;
  };
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string }>;
  voice?: { file_id: string };
  audio?: { file_id: string };
  video?: { file_id: string };
  document?: { file_id: string };
};

function buildDisplayName(message: TelegramIncomingMessage) {
  const firstName = message?.from?.first_name?.trim();
  const lastName = message?.from?.last_name?.trim();
  const username = message?.from?.username?.trim();
  const chatTitle = message?.chat?.title?.trim();

  return [firstName, lastName].filter(Boolean).join(' ') || username || chatTitle || null;
}

function getTelegramMessageType(message: TelegramIncomingMessage) {
  if (message.photo?.length) return 'image';
  if (message.voice || message.audio) return 'audio';
  if (message.video) return 'video';
  if (message.document) return 'document';
  return 'chat';
}

function getTelegramText(message: TelegramIncomingMessage, messageType: string) {
  return (
    message.text ||
    message.caption ||
    (messageType === 'image'
      ? '[Imagem]'
      : messageType === 'audio'
      ? '[Audio]'
      : messageType === 'video'
      ? '[Video]'
      : messageType === 'document'
      ? '[Documento]'
      : '')
  );
}

function getTelegramFileId(message: TelegramIncomingMessage) {
  if (message.photo?.length) {
    return message.photo[message.photo.length - 1]?.file_id;
  }

  return message.voice?.file_id || message.audio?.file_id || message.video?.file_id || message.document?.file_id || null;
}

async function saveTelegramMediaLocally(token: string, fileId: string, messageType: string) {
  const downloadedFile = await telegramService.downloadFile(token, fileId);
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const extensionFromPath = path.extname(downloadedFile.filePath).replace('.', '').toLowerCase();
  const fallbackExtension =
    messageType === 'image' ? 'jpg' : messageType === 'audio' ? 'ogg' : messageType === 'video' ? 'mp4' : 'bin';
  const extension = extensionFromPath || fallbackExtension;
  const fileName = `telegram-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

  fs.writeFileSync(path.join(uploadDir, fileName), downloadedFile.buffer);
  return `/uploads/${fileName}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { instanceId } = await params;
    const body = await req.json();

    const instance = await prisma.whatsappInstance.findUnique({
      where: { instanceId },
    });

    if (!instance || instance.integration !== 'TELEGRAM') {
      return NextResponse.json({ error: 'Telegram instance not found' }, { status: 404 });
    }

    if (!instance.token) {
      return NextResponse.json({ error: 'Telegram token not configured' }, { status: 400 });
    }

    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret = telegramService.buildWebhookSecret(instanceId, instance.token);

    if (secretHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid Telegram webhook secret' }, { status: 401 });
    }

    if (!instance.isActive) {
      return NextResponse.json({ success: true });
    }

    const message = (body.message || body.edited_message) as TelegramIncomingMessage | undefined;
    if (!message || message.from?.is_bot) {
      return NextResponse.json({ success: true });
    }

    const remoteJid = String(message.chat?.id || '');
    if (!remoteJid) {
      return NextResponse.json({ success: true });
    }

    const now = Date.now();
    const lastTime = lastTelegramMessageTimes.get(remoteJid) || 0;
    if (now - lastTime < 1000) {
      return NextResponse.json({ success: true });
    }
    lastTelegramMessageTimes.set(remoteJid, now);

    const messageType = getTelegramMessageType(message);
    const text = getTelegramText(message, messageType);
    const fileId = getTelegramFileId(message);
    const localMediaUrl = fileId ? await saveTelegramMediaLocally(instance.token, fileId, messageType) : null;

    await processInboundConversationMessage({
      instanceName: instance.instanceId,
      platform: 'TELEGRAM',
      remoteJid,
      text,
      fromMe: false,
      pushName: buildDisplayName(message),
      messageType,
      mediaUrl: localMediaUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Telegram webhook error';
    console.error('[Telegram Webhook] Error:', message);
    return NextResponse.json({ error: 'Telegram webhook failed', details: message }, { status: 500 });
  }
}
