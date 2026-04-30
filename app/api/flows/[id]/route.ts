import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const flow = await prisma.chatbotFlow.findUnique({
    where: { id: params.id },
    include: {
      nodes: {
        include: { options: true }
      }
    }
  });

  if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 });

  return NextResponse.json(flow);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, isActive, isDefault } = await req.json();

  const flow = await prisma.chatbotFlow.update({
    where: { id: params.id },
    data: { name, description, isActive, isDefault }
  });

  return NextResponse.json(flow);
}
