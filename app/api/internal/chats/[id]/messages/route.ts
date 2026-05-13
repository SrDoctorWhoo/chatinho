import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    // Optional: Check if user is participant
    const chat = await prisma.internalChat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    
    const isParticipant = chat.participants.some(p => p.userId === session.user.id);
    if (chat.type === 'DIRECT' && !isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.internalMessage.findMany({
      where: { chatId: id },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching internal messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { body, type, mediaUrl } = await req.json();

  try {
    const message = await prisma.internalMessage.create({
      data: {
        chatId: id,
        senderId: session.user.id,
        body,
        type: type || 'chat',
        mediaUrl
      },
      include: {
        sender: { select: { id: true, name: true, image: true } }
      }
    });

    // Update chat timestamp for sorting
    await prisma.internalChat.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Notify via Socket
    try {
      await fetch('http://127.0.0.1:3005/notify', {
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
    console.error('Error sending internal message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
