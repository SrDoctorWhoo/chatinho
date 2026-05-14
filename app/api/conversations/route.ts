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
  const search = searchParams.get('search');
  const departmentId = searchParams.get('departmentId');
  const contactId = searchParams.get('contactId');

  const where: any = {};

  // Filtro de recência: Por padrão, só buscamos conversas ativas ou recentes (últimos 60 dias)
  // Isso evita timeouts em bancos de dados muito grandes.
  if (!contactId && !search) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    where.lastMessageAt = { gte: sixtyDaysAgo };
  }
  
  if (contactId) {
    where.contactId = contactId;
  }
  
  // O status não entra no 'where' do Prisma para permitir a unificação correta depois
  // mas guardamos o valor para filtrar no final da função
  
  if (mine) {
    where.assignedToId = session.user.id;
  }

  // Se for passado um filtro de departamento (ex: Admin querendo ver Vendas)
  if (departmentId) {
    where.departmentId = departmentId;
  }

  // Isolamento de dados por Regra de Acesso
  // Verificamos ADMIN e ADMINISTRADOR para evitar problemas de tradução/schema
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'ADMINISTRADOR';

  if (!isAdmin) {
    const deptIds = (session.user as any).departmentIds || [];
    
    // Se não for Admin, ele SÓ pode ver os setores dele
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

  // 1. Buscamos as conversas
  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      contact: true,
      department: true,
      ...(!contactId ? {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      } : {})
    },
    orderBy: { lastMessageAt: 'desc' },
    take: contactId ? 500 : 200
  });

  // Se estivermos buscando especificamente por um contato (ex: histórico para relatório),
  // retornamos TUDO sem unificar, para que todos os tickets (fechados e abertos) apareçam na lista.
  if (contactId) {
    return NextResponse.json(conversations);
  }

  // 2. Unificação por Contato (Apenas para a lista lateral): Mantém APENAS a conversa mais recente
  const unifiedMap = new Map<string, any>();
  
  conversations.forEach(conv => {
    const cid = conv.contactId;
    if (!unifiedMap.has(cid)) {
      unifiedMap.set(cid, conv);
    }
  });

  let result = Array.from(unifiedMap.values());

  // 3. Aplicamos o filtro de status no resultado unificado
  if (status) {
    result = result.filter(c => c.status === status);
  }

  return NextResponse.json(result);
}
