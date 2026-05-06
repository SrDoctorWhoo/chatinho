// Force rebuild for Prisma schema sync
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

    // Get the best connected and active instance
    let instance = null;

    // 1. Try to find an instance assigned to the conversation's department
    if (conversation.departmentId) {
      instance = await prisma.whatsappInstance.findFirst({
        where: { 
          status: 'CONNECTED',
          isActive: true,
          departments: { some: { id: conversation.departmentId } }
        }
      });
    }

    // 2. If no department-specific instance, try to find an active instance with NO department assignment (catch-all)
    if (!instance) {
      instance = await prisma.whatsappInstance.findFirst({
        where: { 
          status: 'CONNECTED',
          isActive: true,
          departments: { none: {} }
        }
      });
    }

    // 3. Fallback to any active connected instance
    if (!instance) {
      instance = await prisma.whatsappInstance.findFirst({
        where: { 
          status: 'CONNECTED',
          isActive: true
        }
      });
    }

    if (!instance) {
      return NextResponse.json({ error: 'Nenhuma instância do WhatsApp ativa e conectada foi encontrada para este departamento.' }, { status: 400 });
    }

    // Get user signature
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signature: true }
    });

    const finalBody = user?.signature ? `*${user.signature}*\n${text}` : text;

    // Call the background WhatsApp server API to send the message
    const sendRes = await fetch('http://localhost:3002/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceId: instance.instanceId,
        number: conversation.contact.number,
        text: finalBody
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
        body: finalBody,
        fromMe: true,
      }
    });

    const updateData: any = { lastMessageAt: new Date() };
    if (!conversation.assignedToId || conversation.status !== 'ACTIVE') {
      updateData.status = 'ACTIVE';
      updateData.assignedToId = session.user.id;
      updateData.isBotActive = false;
    }

    // UPDATE the conversation in DB
    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });

    // Fetch fresh conversation state
    const freshConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true, assignedTo: { select: { id: true, name: true } } }
    });

    // Notify Socket.io server for real-time updates
    try {
      await fetch(process.env.SOCKET_URL || 'http://127.0.0.1:3005/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_message',
          data: {
            conversationId,
            message,
            conversation: freshConversation
          }
        })
      });
    } catch (err) {
      console.error('Failed to notify socket server:', err);
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
