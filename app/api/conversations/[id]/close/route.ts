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
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Atualiza para CLOSED
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'CLOSED',
        isBotActive: false,
        departmentId: null,
        assignedToId: null,
        currentFlowId: null,
        currentStepId: null
      }
    });

    console.log(`[Queue] Conversa ${id} encerrada por ${session.user.name}`);

    return NextResponse.json(updatedConversation);
  } catch (error: any) {
    console.error('[Queue] Erro ao encerrar conversa:', error);
    return NextResponse.json({ error: 'Falha ao encerrar conversa' }, { status: 500 });
  }
}
