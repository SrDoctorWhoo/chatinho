import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAndTriggerDepartmentFlow } from '@/lib/bot/triggerHandler';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { departmentId, userId } = await req.json();

  try {
    const targetDept = departmentId ? await prisma.department.findUnique({ where: { id: departmentId } }) : null;
    const targetUser = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const currentUserName = session.user.name || 'Sistema';

    const validUserId = targetUser ? targetUser.id : null;

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        departmentId: departmentId || undefined,
        assignedToId: validUserId,
        status: validUserId ? 'ACTIVE' : 'QUEUED',
        isBotActive: false
      },
      include: { 
        contact: true, 
        department: true,
        assignedTo: { select: { id: true, name: true } },
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    let systemContent = `🔄 ${currentUserName} transferiu para `;
    if (targetUser) systemContent += `o atendente **${targetUser.name}**`;
    else if (targetDept) systemContent += `o setor **${targetDept.name}**`;
    else systemContent += `a fila geral`;

    const systemMessage = await prisma.message.create({
      data: {
        conversationId: id,
        body: systemContent,
        fromMe: true,
        type: 'system'
      },
      include: { conversation: { include: { contact: true, department: true } } }
    });

    // Notify socket
    try {
      await fetch(process.env.SOCKET_URL || 'http://localhost:3000/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_message',
          data: {
            message: systemMessage,
            conversationId: id,
            conversation: updatedConversation
          }
        })
      });
    } catch (err) {
      console.error('Failed to notify transfer socket:', err);
    }

    // 🚀 VERIFICAR GATILHO DE FLUXO POR DEPARTAMENTO
    if (departmentId && !validUserId) {
      await checkAndTriggerDepartmentFlow(id, departmentId);
    }

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error transferring conversation:', error);
    return NextResponse.json({ error: 'Failed to transfer' }, { status: 500 });
  }
}
