import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

  try {
    const { name, description, instanceIds, triggerDepartmentId } = await req.json();

    const flow = await prisma.chatbotFlow.create({
      data: {
        name: String(name),
        description: description ? String(description) : null,
        isActive: true,
        isDefault: false,
        triggerKeywords: "",
        triggerDepartmentId: triggerDepartmentId || null,
        instances: (instanceIds && Array.isArray(instanceIds) && instanceIds.length > 0) ? {
          connect: instanceIds.map((id: string) => ({ id }))
        } : undefined
      }
    });

    // 📝 Registrar Log
    try {
      const { createAuditLog } = await import('@/lib/audit');
      await createAuditLog({
        userId: session?.user?.id,
        action: 'CREATE',
        description: `Novo fluxo criado: ${name}`,
        target: 'Fluxos',
        type: 'success'
      });
    } catch (e) {}

    return NextResponse.json(flow);
  } catch (error: any) {
    // Registrar log de erro
    try {
      const { createAuditLog } = await import('@/lib/audit');
      await createAuditLog({
        action: 'LOG',
        description: `Falha ao criar fluxo: ${error.message || 'Erro desconhecido'}`,
        target: 'Fluxos',
        type: 'error'
      });
    } catch (e) {}

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
