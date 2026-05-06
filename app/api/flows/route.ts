import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const flows = await prisma.chatbotFlow.findMany({
    include: {
      _count: { select: { nodes: true } },
      instances: { select: { id: true, name: true } }
    }
  });
  return NextResponse.json(flows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, instanceIds } = await req.json();

  const flow = await prisma.chatbotFlow.create({
    data: {
      name,
      description,
      instances: instanceIds?.length ? {
        connect: instanceIds.map((id: string) => ({ id }))
      } : undefined
    }
  });

  return NextResponse.json(flow);
}
