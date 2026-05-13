import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const mine = searchParams.get('mine') === 'true';
  const departmentId = searchParams.get('departmentId');

  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (mine) {
    where.assignedToId = session.user.id;
  }

  // Se for passado um filtro de departamento (ex: Admin querendo ver Vendas)
  if (departmentId) {
    where.departmentId = departmentId;
  }

  // Isolamento de dados por Regra de Acesso
  if (session.user.role !== 'ADMIN') {
    const deptIds = (session.user as any).departmentIds || [];
    
    // Se não for Admin, ele SÓ pode ver os setores dele
    // Se ele tentou filtrar por um setor que não é dele, forçamos o filtro dos setores dele
    if (departmentId && !deptIds.includes(departmentId)) {
       return NextResponse.json({ error: 'Você não tem permissão para este setor' }, { status: 403 });
    }

    if (!departmentId) {
      where.OR = [
        { departmentId: { in: deptIds } },
        { assignedToId: session.user.id }
      ];
    }
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      contact: true,
      department: true,
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1
      },
      assignedTo: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { lastMessageAt: 'desc' }
  });

  // Unificação por Contato: Mantém apenas a conversa mais recente/relevante de cada contato
  const unifiedMap = new Map<string, any>();
  
  conversations.forEach(conv => {
    const contactId = conv.contactId;
    const existing = unifiedMap.get(contactId);
    
    if (!existing) {
      unifiedMap.set(contactId, conv);
    } else {
      // Se a conversa atual não estiver fechada e a existente estiver, troca
      if (conv.status !== 'CLOSED' && existing.status === 'CLOSED') {
        unifiedMap.set(contactId, conv);
      }
      // Ou se ambas tiverem o mesmo status de "fechado/aberto", a primeira (mais recente por orderBy) já é a correta
    }
  });

  return NextResponse.json(Array.from(unifiedMap.values()));
}
