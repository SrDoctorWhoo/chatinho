import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { conversationId, text } = await req.json();

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    // Get the first connected instance
    const instance = await prisma.whatsappInstance.findFirst({
      where: { status: 'CONNECTED' }
    });

    if (!instance) {
      return NextResponse.json({ error: 'No connected WhatsApp instance found' }, { status: 400 });
    }

    // Call the background WhatsApp server API to send the message
    const sendRes = await fetch('http://localhost:3002/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceId: instance.instanceId,
        number: conversation.contact.number,
        text
      })
    });

    if (!sendRes.ok) {
      const errorData = await sendRes.json();
      throw new Error(errorData.error || 'Failed to send message via WhatsApp server');
    }

    // Save message in DB
    const message = await prisma.message.create({
      data: {
        conversationId,
        body: text,
        fromMe: true,
      }
    });

    const updateData: any = { lastMessageAt: new Date() };
    if (!conversation.assignedToId || conversation.status !== 'ACTIVE') {
      updateData.status = 'ACTIVE';
      updateData.assignedToId = session.user.id;
      updateData.isBotActive = false;
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
