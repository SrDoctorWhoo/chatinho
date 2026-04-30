import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { type, content } = await req.json();

  const node = await prisma.chatbotNode.create({
    data: {
      flowId: id,
      type: type || 'MESSAGE',
      content: content || 'Nova mensagem...',
    }
  });

  return NextResponse.json(node);
}
