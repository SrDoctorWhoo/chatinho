import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { instanceId, name, email, whatsapp } = await req.json();

    if (!instanceId || !name || !whatsapp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify Widget Instance
    const widget = await prisma.widgetInstance.findUnique({
      where: { id: instanceId },
      include: { departments: true }
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget instance not found' }, { status: 404 });
    }

    // 2. Format WhatsApp Number (clean non-digits)
    const cleanNumber = whatsapp.replace(/\D/g, '');
    const platform = 'WIDGET';

    // 3. Upsert Contact using the unique constraint [number, platform]
    let contact = await prisma.contact.findUnique({
      where: { number_platform: { number: cleanNumber, platform } }
    });

    if (contact) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { 
          name, 
          email: email || contact.email,
          profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
        }
      });
    } else {
      contact = await prisma.contact.create({
        data: {
          name,
          number: cleanNumber,
          platform,
          email: email || undefined,
          profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
        }
      });
    }

    // 4. Find or Create Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        widgetInstanceId: instanceId,
        status: { not: 'CLOSED' }
      }
    });

    if (!conversation) {
      const defaultDeptId = widget.departments[0]?.id;

      // Check for an active chatbot flow (default or unbound)
      const flow = await prisma.chatbotFlow.findFirst({
        where: {
          isActive: true,
          OR: [
            { isDefault: true },
            { instances: { none: {} } },
          ],
        },
      });

      conversation = await prisma.conversation.create({
        data: {
          protocol: crypto.randomUUID().slice(0, 10).toUpperCase(),
          status: flow ? 'BOT' : 'PENDING',
          isBotActive: !!flow,
          platform: 'WIDGET',
          contactId: contact.id,
          widgetInstanceId: instanceId,
          departmentId: defaultDeptId
        }
      });

      // System message
      await prisma.message.create({
        data: {
          body: `✨ Novo lead via Widget: ${name} | WhatsApp: ${cleanNumber}${email ? ` | Email: ${email}` : ''}`,
          fromMe: true,
          type: 'chat',
          conversationId: conversation.id,
          timestamp: new Date()
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      conversation: {
        id: conversation.id,
        protocol: conversation.protocol,
        status: conversation.status
      }
    });
  } catch (error) {
    console.error('Widget Start Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
