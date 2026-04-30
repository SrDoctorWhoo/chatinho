import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body.event;

    console.log(`Received WhatsApp event: ${event}`);

    if (event === 'messages.upsert') {
      const messageData = body.data;
      const remoteJid = messageData.key.remoteJid;
      const text = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text;
      const fromMe = messageData.key.fromMe;

      if (text && remoteJid) {
        const number = remoteJid.split('@')[0];

        // 1. Find or create contact
        let contact = await prisma.contact.findUnique({
          where: { number }
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: { number, name: body.instanceName }
          });
        }

        // 2. Find or create conversation
        let conversation = await prisma.conversation.findFirst({
          where: { contactId: contact.id, status: { not: 'CLOSED' } }
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: { contactId: contact.id }
          });
        }

        // 3. Save message
        await prisma.message.create({
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

        // 5. Notify Socket.io server
        try {
          await fetch(`${process.env.SOCKET_URL || 'http://localhost:3001'}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_message',
              data: {
                conversationId: conversation.id,
                message: {
                  body: text,
                  fromMe: fromMe || false,
                  timestamp: new Date(),
                }
              }
            })
          });
        } catch (err) {
          console.error('Failed to notify socket server:', err);
        }

        // 6. Process automation if not from me
        if (!fromMe) {
          const { flowEngine } = await import('@/services/flowEngine');
          await flowEngine.processMessage(conversation.id, text, body.instanceName);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
