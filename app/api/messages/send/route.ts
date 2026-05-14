// Force rebuild for Prisma schema sync
import { NextResponse } from 'next/server';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveConnectedInstanceForConversation } from '@/lib/instanceResolver';

type ConversationUpdateData = {
  lastMessageAt: Date;
  status?: string;
  assignedToId?: string;
  isBotActive?: boolean;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Validate that the user actually exists in the database (prevents stale session foreign key errors)
  const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!userExists) {
    return NextResponse.json({ error: 'Sessão inválida. Por favor, faça login novamente.' }, { status: 401 });
  }

  const { conversationId, text, type = 'chat' } = await req.json();

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    // Se for mensagem interna, apenas salva no banco e notifica o socket
    if (type === 'internal') {
      const message = await prisma.message.create({
        data: {
          conversationId,
          body: text,
          fromMe: true,
          type: 'internal'
        }
      });

      // Atualiza timestamp da conversa
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      const freshConversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true, assignedTo: { select: { id: true, name: true } } }
      });

      try {
        await fetch(process.env.SOCKET_URL || 'http://localhost:3000/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new_message',
            data: { conversationId, message, conversation: freshConversation }
          })
        });
      } catch {}

      return NextResponse.json(message);
    }

    const platform = String(conversation.platform || '').toUpperCase() === 'TELEGRAM' ? 'TELEGRAM' : 'WHATSAPP';
    console.log(`[SendRoute] Plataforma detectada: ${platform} para conversa ${conversationId}`);
    
    const instance = await resolveConnectedInstanceForConversation({
      departmentId: conversation.departmentId,
      platform,
    });
    console.log(`[SendRoute] Instancia resolvida: ${instance?.name} (${instance?.instanceId})`);

    if (!instance) {
      return NextResponse.json({ error: 'Nenhuma instância do WhatsApp ativa e conectada foi encontrada para este departamento.' }, { status: 400 });
    }

    // Get user signature
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signature: true }
    });

    const finalBody = user?.signature ? `*${user.signature}*\n${text}` : text;

    console.log(`[SendRoute] Proxying para http://localhost:3002/send-message com instanciaId: ${instance.instanceId}`);
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

    const updateData: ConversationUpdateData = { lastMessageAt: new Date() };
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
      const socketUrl = process.env.SOCKET_URL || 'http://127.0.0.1:3000';
      const notifyUrl = `${socketUrl.replace(/\/$/, '')}/api/internal/notify-socket`;
      
      await fetch(notifyUrl, {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : '';
    const errorLog = `
--- ERROR AT ${new Date().toISOString()} ---
Message: ${message}
Stack: ${stack}
Code: ${code}
Session User ID: ${session?.user?.id}
Session User Name: ${session?.user?.name}
    `;
    fs.appendFileSync('scratch/server_errors.log', errorLog);
    console.error('Error sending message:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
