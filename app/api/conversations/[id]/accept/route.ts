import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
        }
      }
    });

    console.log(`[Queue] Conversa ${id} assumida por ${session.user.name}`);

    return NextResponse.json(updatedConversation);
  } catch (error: any) {
    console.error('[Queue] Erro ao aceitar conversa:', error);
    return NextResponse.json({ error: 'Falha ao assumir conversa' }, { status: 500 });
  }
}
