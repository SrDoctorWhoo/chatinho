import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { departmentId, userId } = await req.json();

  try {
    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        departmentId: departmentId || undefined,
        assignedToId: userId || null,
        status: userId ? 'ACTIVE' : 'QUEUED', // Se transferiu para um usuário, fica Ativo. Se só pro setor, vai pra Fila.
        isBotActive: false // Garante que o bot não interfira após a transferência manual
      }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error transferring conversation:', error);
    return NextResponse.json({ error: 'Failed to transfer' }, { status: 500 });
  }
}
