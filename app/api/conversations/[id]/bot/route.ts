import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

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
      include: { contact: true }
    });

    // Se estiver ativando e não houver um passo atual, dispara o robô agora mesmo
    if (active && !conversation.currentStepId) {
      const { botEngine } = await import('@/lib/botEngine');
      // Usamos um texto vazio para simular a entrada e disparar o fluxo inicial
      // O motor vai procurar o fluxo padrão/ativo e mandar o primeiro nó.
      await botEngine.processMessage(conversation.id, '', 'TESTE', conversation.contact.number + '@s.whatsapp.net');
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error toggling bot:', error);
    return NextResponse.json({ error: 'Failed to toggle bot' }, { status: 500 });
  }
}
