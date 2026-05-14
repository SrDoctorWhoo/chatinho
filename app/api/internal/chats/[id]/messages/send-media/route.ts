import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caption = (formData.get('caption') as string) || '';

    if (!id || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const extension = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-internal-media.${extension}`;
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const type = file.type.startsWith('image/') 
      ? 'image' 
      : file.type.startsWith('audio/') 
      ? 'audio' 
      : file.type.startsWith('video/') 
      ? 'video' 
      : 'document';

    const message = await prisma.internalMessage.create({
      data: {
        chatId: id,
        senderId: session.user.id,
        body: caption || (type === 'audio' ? 'Áudio' : file.name),
        type,
        mediaUrl: `/uploads/${fileName}`
      },
      include: {
        sender: { select: { id: true, name: true } }
      }
    });

    // Update chat timestamp
    await prisma.internalChat.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Notify via Socket
    try {
      await fetch(process.env.SOCKET_URL || 'http://localhost:3000/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_internal_message',
          data: {
            chatId: id,
            message
          }
        })
      });
    } catch (e) {
      console.error('Internal Socket notification failed:', e);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending internal media:', error);
    return NextResponse.json({ error: 'Failed to send media' }, { status: 500 });
  }
}
