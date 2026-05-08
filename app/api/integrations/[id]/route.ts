import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const model = (prisma as any).externalIntegration;
    if (!model) throw new Error('Modelo externalIntegration não encontrado');

    const integration = await model.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        method: body.method || 'POST',
        apiKey: body.apiKey || null,
        baseUrl: body.baseUrl || null,
        config: body.config ? (typeof body.config === 'string' ? body.config : JSON.stringify(body.config)) : null,
        isActive: body.isActive
      }
    });
    return NextResponse.json(integration);
  } catch (error) {
    console.error('[Integrations PUT] Error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar integração' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.externalIntegration.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar integração' }, { status: 500 });
  }
}

