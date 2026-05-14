import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // 1. Update to ACTIVE and clear closedAt
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        closedAt: null,
        // Mantemos o protocolo para histórico, mas o ticket volta a ser ativo
      },
      include: { 
        contact: true,
        department: true,
        assignedTo: { select: { id: true, name: true } },
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    console.log(`[Reopen] Conversa ${id} reaberta por ${session.user.name}`);

    // Notify via Socket
    try {
      await fetch(process.env.SOCKET_URL || 'http://localhost:3000/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'conversation_updated',
          data: {
            conversationId: id,
            conversation: updatedConversation
          }
        })
      });
    } catch (e) {
      console.error('[Socket] Failed to notify conversation reopening:', e);
    }

    return NextResponse.json(updatedConversation);
  } catch (error: unknown) {
    console.error('[Reopen] Erro ao reabrir conversa:', error);
    return NextResponse.json({ error: 'Falha ao reabrir conversa' }, { status: 500 });
  }
}
