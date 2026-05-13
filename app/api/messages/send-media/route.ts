import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveConnectedInstanceForConversation } from '@/lib/instanceResolver';
import { telegramService } from '@/lib/telegram';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

type AudioPayload = {
  number: string;
  audio?: string;
  mimetype?: string;
  fileName?: string;
  ptt?: boolean;
  mediatype?: 'image' | 'video' | 'document';
  media?: string;
  caption?: string;
};

type ConversationUpdateData = {
  lastMessageAt: Date;
  status?: string;
  assignedToId?: string;
  isBotActive?: boolean;
};

type AudioTargetFormat = 'ogg' | 'mp3';

const ffmpegStaticValue = ffmpegStatic as string | { path?: string };
let ffmpegPath = typeof ffmpegStaticValue === 'string' ? ffmpegStaticValue : (ffmpegStaticValue.path || '');

if (ffmpegPath && (ffmpegPath.startsWith('\\ROOT') || !path.isAbsolute(ffmpegPath))) {
  const relativePath = ffmpegPath.replace('\\ROOT', '').replace(/^\/+/, '');
  ffmpegPath = path.join(process.cwd(), relativePath);
}

if (ffmpegPath && fs.existsSync(ffmpegPath)) {
  console.log('[FFMPEG] Binary found at:', ffmpegPath);
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.error('[FFMPEG] Binary not found at:', ffmpegPath);
  const fallbackPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  if (fs.existsSync(fallbackPath)) {
    console.log('[FFMPEG] Using fallback:', fallbackPath);
    ffmpeg.setFfmpegPath(fallbackPath);
    ffmpegPath = fallbackPath;
  }
}

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

function getExtensionFromName(fileName: string) {
  const normalizedName = fileName.toLowerCase().trim();

  if (!normalizedName.includes('.') || normalizedName.startsWith('blob:')) {
    return '';
  }

  return normalizedName.split('.').pop() || '';
}

function detectMimeFromBuffer(buffer: Buffer) {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'OggS') {
    return { mimeType: 'audio/ogg', extension: 'ogg', isAudio: true };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return { mimeType: 'audio/wav', extension: 'wav', isAudio: true };
  }

  if (buffer.length >= 3 && buffer.subarray(0, 3).toString('ascii') === 'ID3') {
    return { mimeType: 'audio/mpeg', extension: 'mp3', isAudio: true };
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return { mimeType: 'audio/mpeg', extension: 'mp3', isAudio: true };
  }

  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { mimeType: 'audio/webm', extension: 'webm', isAudio: true };
  }

  if (buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return { mimeType: 'audio/mp4', extension: 'm4a', isAudio: true };
  }

  return null;
}

async function convertAudio(
  inputBuffer: Buffer,
  inputExtension: string,
  uploadDir: string,
  targetFormat: AudioTargetFormat
) {
  const tempBaseName = `temp_${Date.now()}`;
  const safeExtension = inputExtension || 'bin';
  const tempIn = path.join(uploadDir, `${tempBaseName}_in.${safeExtension}`);
  const tempOut = path.join(uploadDir, `${tempBaseName}_out.${targetFormat}`);

  try {
    console.log('[FFMPEG] Writing source audio to:', tempIn);
    await writeFile(tempIn, inputBuffer);

    console.log(`[FFMPEG] Starting conversion to ${targetFormat.toUpperCase()}...`);
    await new Promise((resolve, reject) => {
      const command = ffmpeg(tempIn).audioChannels(1);

      if (targetFormat === 'ogg') {
        command.toFormat('ogg').audioCodec('libopus').audioFrequency(48000);
      } else {
        command.toFormat('mp3').audioCodec('libmp3lame').audioFrequency(44100);
      }

      command
        .on('start', (cmd) => console.log('[FFMPEG] Command:', cmd))
        .on('error', (err, _stdout, stderr) => {
          console.error('[FFMPEG] ERROR:', err.message);
          console.error('[FFMPEG] STDERR:', stderr);
          reject(err);
        })
        .on('end', () => {
          console.log('[FFMPEG] Conversion finished successfully.');
          resolve(true);
        })
        .save(tempOut);
    });

    return await readFile(tempOut);
  } finally {
    await unlink(tempIn).catch(() => undefined);
    await unlink(tempOut).catch(() => undefined);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const conversationId = formData.get('conversationId') as string;
    const caption = (formData.get('caption') as string) || '';
    const file = formData.get('file') as File;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signature: true }
    });

    const finalCaption = user?.signature ? `*${user.signature}*\n${caption}` : caption;

    if (!conversationId || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const instance = await resolveConnectedInstanceForConversation({
      departmentId: conversation.departmentId,
      platform: conversation.platform === 'TELEGRAM' ? 'TELEGRAM' : 'WHATSAPP',
    });

    if (!instance) {
      return NextResponse.json({ error: 'Nenhuma instancia conectada encontrada.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const browserMimeType = file.type || 'application/octet-stream';
    const originalFileName = file.name || 'blob';
    const detectedFromBuffer = detectMimeFromBuffer(buffer);
    const originalExtension = detectedFromBuffer?.extension || getExtensionFromName(originalFileName) || 'bin';
    const mimetype = detectedFromBuffer?.mimeType || browserMimeType;
    const isAudio =
      detectedFromBuffer?.isAudio === true ||
      browserMimeType.startsWith('audio/') ||
      ['ogg', 'oga', 'opus', 'mp3', 'wav', 'webm', 'm4a', 'mp4', 'aac', 'amr'].includes(originalExtension);

    console.log('--- [DEBUG MEDIA START] ---');
    console.log('Browser MimeType:', browserMimeType);
    console.log('Detected MimeType:', mimetype);
    console.log('FileName:', originalFileName);
    console.log('Detected Extension:', originalExtension);
    console.log('IsAudio:', isAudio);
    console.log('FFMPEG Path:', ffmpegPath);

    let finalBuffer = buffer;
    let finalMimeType = mimetype;
    let extension = originalExtension;
    const wantsCloudAudio = instance.integration === 'WHATSAPP-BUSINESS';
    const targetAudioFormat: AudioTargetFormat = wantsCloudAudio ? 'mp3' : 'ogg';

    if (isAudio) {
      const alreadyInTargetFormat =
        (targetAudioFormat === 'ogg' && finalMimeType.startsWith('audio/ogg') && extension === 'ogg') ||
        (targetAudioFormat === 'mp3' && finalMimeType === 'audio/mpeg' && extension === 'mp3');

      if (!alreadyInTargetFormat) {
        try {
          finalBuffer = await convertAudio(buffer, originalExtension, uploadDir, targetAudioFormat);
          finalMimeType = targetAudioFormat === 'ogg' ? 'audio/ogg; codecs=opus' : 'audio/mpeg';
          extension = targetAudioFormat;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown ffmpeg error';
          console.error('[FFMPEG] Conversion failed:', message);
          throw new Error('Falha ao converter o audio para um formato aceito pelo WhatsApp.');
        }
      } else {
        finalMimeType = targetAudioFormat === 'ogg' ? 'audio/ogg; codecs=opus' : 'audio/mpeg';
        extension = targetAudioFormat;
      }
    } else if (originalFileName.includes('.') && !originalFileName.startsWith('blob:')) {
      extension = originalFileName.split('.').pop()?.toLowerCase() || 'bin';
    } else {
      extension = mimetype.split('/').pop()?.split(';')[0] || 'bin';
    }

    if (isAudio && extension === 'ogg') {
      finalMimeType = 'audio/ogg; codecs=opus';
    } else if (isAudio && extension === 'mp3') {
      finalMimeType = 'audio/mpeg';
    }

    if (isAudio) {
      console.log('[DEBUG AUDIO FINAL] Integration:', instance.integration);
      console.log('[DEBUG AUDIO FINAL] Target format:', targetAudioFormat);
      console.log('[DEBUG AUDIO FINAL] Final mime:', finalMimeType);
      console.log('[DEBUG AUDIO FINAL] Final extension:', extension);
    }

    extension = extension.replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}-media.${extension}`;
    fs.writeFileSync(path.join(uploadDir, fileName), finalBuffer);

    if (instance.integration === 'TELEGRAM') {
      if (!instance.token) {
        throw new Error('Token do Telegram nao configurado para esta instancia.');
      }

      await telegramService.sendMedia(instance.token, conversation.contact.number, {
        buffer: finalBuffer,
        fileName,
        mimeType: finalMimeType,
        caption: finalCaption || undefined,
      });
    } else {
      const instanceId = instance.instanceId;
      const cleanNumber = conversation.contact.number.replace(/\D/g, '');
      const targetNumber =
        instance.integration === 'WHATSAPP-BUSINESS'
          ? cleanNumber
          : `${cleanNumber}@s.whatsapp.net`;

      const endpoint = isAudio ? 'sendWhatsAppAudio' : 'sendMedia';
      const base64Media = finalBuffer.toString('base64');
      const payload: AudioPayload = {
        number: targetNumber,
      };

      if (isAudio) {
        payload.audio = base64Media;
        payload.mimetype = finalMimeType;
        payload.fileName = fileName;
        payload.ptt = true;
      } else {
        payload.mediatype = finalMimeType.includes('image')
          ? 'image'
          : finalMimeType.includes('video')
          ? 'video'
          : 'document';
        payload.mimetype = finalMimeType;
        payload.media = base64Media;
        payload.fileName = fileName;
        if (finalCaption) payload.caption = finalCaption;
      }

      const evolutionUrl = `${process.env.EVOLUTION_API_URL}/message/${endpoint}/${instanceId}`;
      console.log(
        `[Evolution] Sending ${isAudio ? 'voice note' : 'media'} via ${endpoint} using instance=${instance.instanceId} integration=${instance.integration} to ${targetNumber}`
      );
      console.log(`[Evolution] Request URL: ${evolutionUrl}`);

      const evolutionRes = await fetch(evolutionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.EVOLUTION_API_KEY || ''
        },
        body: JSON.stringify(payload)
      });

      const rawEvolutionResponse = await evolutionRes.text();
      let evolutionData: unknown = rawEvolutionResponse;

      try {
        evolutionData = JSON.parse(rawEvolutionResponse);
      } catch {
        console.warn('[Evolution] Non-JSON response body:', rawEvolutionResponse);
      }

      console.log('[Evolution] Response status:', evolutionRes.status);
      console.log('[Evolution] Response body:', typeof evolutionData === 'string' ? evolutionData : JSON.stringify(evolutionData, null, 2));

      const looksLikeProviderError =
        typeof evolutionData === 'object' &&
        evolutionData !== null &&
        (
          ('error' in evolutionData && Boolean(evolutionData.error)) ||
          ('status' in evolutionData && (evolutionData.status === false || evolutionData.status === 'error'))
        );

      if (!evolutionRes.ok || looksLikeProviderError) {
        const providerMessage =
          typeof evolutionData === 'object' &&
          evolutionData !== null &&
          'error' in evolutionData &&
          typeof evolutionData.error === 'string'
            ? evolutionData.error
            : 'Failed to send media';

        console.error('[Evolution Error]', typeof evolutionData === 'string' ? evolutionData : JSON.stringify(evolutionData, null, 2));
        throw new Error(providerMessage);
      }
    }

    const savedMessage = await prisma.message.create({
      data: {
        conversationId,
        body: finalCaption || (isAudio ? 'Audio' : 'Arquivo'),
        fromMe: true,
        type: isAudio ? 'audio' : (mimetype.includes('image') ? 'image' : mimetype.includes('video') ? 'video' : 'document'),
        mediaUrl: `/uploads/${fileName}`
      }
    });

    const updateData: ConversationUpdateData = { lastMessageAt: new Date() };
    if (!conversation.assignedToId || conversation.status !== 'ACTIVE') {
      updateData.status = 'ACTIVE';
      updateData.assignedToId = session.user.id;
      updateData.isBotActive = false;
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send media';
    console.error('Error sending media:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
