import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`[API] Fetching messages for conversation: ${id}`);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { contactId: true }
    });

    if (!conversation) {
      console.warn(`[API] Conversation not found: ${id}`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const scope = searchParams.get('scope') || 'ticket'; // 'ticket' ou 'all'
    const contactIdParam = searchParams.get('contactId');

    const messages = await prisma.message.findMany({
      where: { 
        ...(scope === 'all' ? {
          conversation: {
            contactId: contactIdParam || conversation.contactId
          }
        } : {
          conversationId: id
        })
      },
      include: {
        conversation: {
          select: {
            id: true,
            protocol: true,
            status: true,
            department: { select: { name: true } }
          }
        }
      },
      take: limit,
      ...(cursor ? {
        skip: 1,
        cursor: { id: cursor },
      } : {}),
      orderBy: { timestamp: 'desc' }
    });

    console.log(`[API] Found ${messages.length} messages for conversation: ${id}`);
    return NextResponse.json(messages);
  } catch (error) {
    console.error(`[API] Error fetching messages:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

