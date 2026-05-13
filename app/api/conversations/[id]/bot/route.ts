import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { active } = await req.json();

    // Busca o estado atual antes de atualizar
    const current = await prisma.conversation.findUnique({
      where: { id }
    });

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { 
        isBotActive: active,
        ...(active ? { status: 'BOT' } : {})
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

    // Se estiver ativando e não houver um passo atual, dispara o robô agora mesmo
    if (active && !conversation.currentStepId) {
      const { botEngine } = await import('@/lib/botEngine');
      // Usamos um texto vazio para simular a entrada e disparar o fluxo inicial
      // O motor vai procurar o fluxo padrão/ativo e mandar o primeiro nó.
      await botEngine.processMessage(conversation.id, '', 'TESTE', conversation.contact.number + '@s.whatsapp.net');
    }

    // Notify via Socket
    try {
      await fetch('http://127.0.0.1:3005/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'conversation_updated',
          data: {
            conversationId: id,
            conversation
          }
        })
      });
    } catch (e) {
      console.error('[Socket] Failed to notify bot toggle:', e);
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error toggling bot:', error);
    return NextResponse.json({ error: 'Failed to toggle bot' }, { status: 500 });
  }
}
