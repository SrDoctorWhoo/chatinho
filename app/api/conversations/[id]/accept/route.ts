import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Validate that the user actually exists in the database (prevents stale session foreign key errors)
  const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!userExists) {
    return NextResponse.json({ error: 'Sessão inválida. Por favor, faça login novamente.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. Verifica se a conversa existe e se está aguardando (QUEUED ou BOT)
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // 2. Atualiza para ACTIVE e atribui ao usuário atual
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        assignedToId: session.user.id,
        isBotActive: false, // Desativa o bot ao assumir manualmente
      },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        department: true,
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    console.log(`[Queue] Conversa ${id} assumida por ${session.user.name}`);

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
      console.error('[Socket] Failed to notify conversation acceptance:', e);
    }

    return NextResponse.json(updatedConversation);
  } catch (error: any) {
    console.error('[Queue] Erro ao aceitar conversa:', error);
    return NextResponse.json({ error: 'Falha ao assumir conversa' }, { status: 500 });
  }
}
