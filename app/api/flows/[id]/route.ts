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

  try {
    const flow = await prisma.chatbotFlow.findUnique({
      where: { id },
      include: {
        nodes: {
          include: { options: true },
          orderBy: { id: 'asc' }
        },
        instances: { select: { id: true, name: true } }
      }
    });

    if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    return NextResponse.json(flow);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { nodes, name, description, isActive, isDefault, triggerKeywords, instanceIds } = await req.json();

    // 1. Atualiza dados básicos do fluxo + vínculo de instâncias
    await prisma.chatbotFlow.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        isDefault,
        triggerKeywords,
        // set substitui todas as instâncias vinculadas
        instances: {
          set: instanceIds?.length
            ? instanceIds.map((iid: string) => ({ id: iid }))
            : []
        }
      }
    });

    // 2. Sincronização complexa de nós (Deletar e recriar é mais seguro para fluxos pequenos, 
    // mas vamos tentar manter IDs se possível ou usar transação para garantir integridade)
    await prisma.$transaction(async (tx) => {
      // Deleta todos os nós e opções atuais para este fluxo
      await tx.chatbotNode.deleteMany({ where: { flowId: id } });

      const idMap = new Map<string, string>(); // Maps old/temp IDs to new DB IDs

      // Primeiro passo: Cria todos os nós para gerar os IDs e popular o idMap
      for (const node of nodes) {
        const isNew = node.id.startsWith('new-');
        const createdNode = await tx.chatbotNode.create({
          data: {
            id: isNew ? undefined : node.id,
            flowId: id,
            type: node.type,
            content: node.content,
            // Não seta o nextStepId ainda, pois pode depender de um nó que ainda não foi criado
          }
        });
        idMap.set(node.id, createdNode.id);
      }

      // Segundo passo: Atualiza as relações (nextStepId) e cria as opções (targetNodeId) com os IDs reais mapeados
      for (const node of nodes) {
        const realNodeId = idMap.get(node.id)!;
        
        // Atualiza nextStepId se houver
        if (node.nextStepId) {
          const realNextStepId = idMap.get(node.nextStepId);
          if (realNextStepId) {
            await tx.chatbotNode.update({
              where: { id: realNodeId },
              data: { nextStepId: realNextStepId }
            });
          }
        }

        // Cria as opções
        if (node.options && node.options.length > 0) {
          for (const opt of node.options) {
            const realTargetId = idMap.get(opt.targetNodeId);
            if (realTargetId) {
              await tx.chatbotOption.create({
                data: {
                  nodeId: realNodeId,
                  keyword: opt.keyword,
                  label: opt.label,
                  targetNodeId: realTargetId
                }
              });
            }
          }
        }
      }
    });

    const updatedFlow = await prisma.chatbotFlow.findUnique({
      where: { id },
      include: { nodes: { include: { options: true } } }
    });

    return NextResponse.json(updatedFlow);
  } catch (error: any) {
    console.error('[Flows API] Error updating flow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
