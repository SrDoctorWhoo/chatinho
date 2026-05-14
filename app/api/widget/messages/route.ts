import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { conversationId, body } = await req.json();

    if (!conversationId || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify Conversation belongs to a Widget
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation || !conversation.widgetInstanceId) {
      return NextResponse.json({ error: 'Conversation not found or not a widget conversation' }, { status: 404 });
    }

    // 2. Save Message in DB
    const message = await prisma.message.create({
      data: {
        conversationId,
        body,
        fromMe: false,
        type: 'chat',
        timestamp: new Date()
      }
    });

    // 3. Update Conversation Timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        lastMessageAt: new Date(),
        status: conversation.status === 'CLOSED' ? 'PENDING' : conversation.status 
      }
    });

    // 4. Trigger Bot Engine (same logic as WhatsApp/Telegram webhook)
    try {
      const canTriggerBot = (!conversation.assignedToId || conversation.isBotActive);
      
      if (canTriggerBot) {
        // Find an applicable chatbot flow (default or unbound)
        const flow = await prisma.chatbotFlow.findFirst({
          where: {
            isActive: true,
            OR: [
              { isDefault: true },
              { instances: { none: {} } },
            ],
          },
        });

        if (flow) {
          // Ensure conversation is in BOT mode
          if (!conversation.isBotActive) {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { isBotActive: true, status: 'BOT' }
            });
          }

          const { botEngine } = await import('@/lib/botEngine');
          await botEngine.processMessage(
            conversationId,
            body,
            conversation.widgetInstanceId, // instanceName
            `widget_${conversation.contact.number}` // remoteJid equivalent
          );
        }
      }
    } catch (botErr) {
      console.error('[Widget] Bot processing failed (non-fatal):', botErr);
    }

    // 5. Notify Socket Server
    try {
      const enrichedMessage = await prisma.message.findUnique({
        where: { id: message.id },
        include: {
          conversation: {
            include: {
              contact: true,
              department: true,
              assignedTo: { select: { id: true, name: true } },
            },
          },
        },
      });

      const internalUrl = 'http://127.0.0.1:3000/api/internal/notify-socket';
      await fetch(internalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_message',
          data: {
            message: enrichedMessage,
            conversationId,
            conversation: enrichedMessage?.conversation,
          }
        })
      });
    } catch (err) {
      console.error('[Widget] Socket notify failed:', err);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Widget Message Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
