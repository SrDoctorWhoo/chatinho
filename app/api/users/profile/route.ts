import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        signature: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { name, image, signature } = await req.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        image,
        signature,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        signature: true,
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Erro interno ao atualizar perfil',
      details: error.message 
    }, { status: 500 });
  }
}
