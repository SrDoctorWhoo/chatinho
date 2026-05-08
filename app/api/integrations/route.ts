import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const integrations = await prisma.externalIntegration.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(integrations);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar integrações' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Integrations API] Body:', body);
    
    // Diagnostic log
    const models = Object.keys(prisma);
    console.log('[Integrations API] Available Prisma Models:', models.filter(m => !m.startsWith('_')));

    const model = (prisma as any).externalIntegration;
    if (!model) {
      throw new Error('Modelo "externalIntegration" não encontrado no Prisma Client. Tente reiniciar o servidor.');
    }

    const integration = await model.create({
      data: {
        name: body.name,
        type: body.type,
        method: body.method || 'POST',
        apiKey: body.apiKey || null,
        baseUrl: body.baseUrl || null,
        config: body.config ? (typeof body.config === 'string' ? body.config : JSON.stringify(body.config)) : null,
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json(integration);
  } catch (error) {
    console.error('[Integrations API] Error:', error);
    return NextResponse.json({ error: 'Erro ao criar integração' }, { status: 500 });
  }
}
