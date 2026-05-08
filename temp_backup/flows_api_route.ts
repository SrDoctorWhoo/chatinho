import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const flows = await prisma.chatbotFlow.findMany({
      include: {
        _count: {
          select: { nodes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(flows);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar fluxos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const flow = await prisma.chatbotFlow.create({
      data: {
        name: body.name || 'Novo Fluxo',
        description: body.description || '',
        triggerKeywords: body.triggerKeywords || '',
        isActive: true,
        nodes: {
          create: [
            {
              type: 'MESSAGE',
              content: 'Olá! Sou o assistente virtual. Como posso ajudar?',
            }
          ]
        }
      }
    });
    return NextResponse.json(flow);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar fluxo' }, { status: 500 });
  }
}
