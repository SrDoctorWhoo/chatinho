import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveConnectedInstanceForConversation } from '@/lib/instanceResolver';
import { generateProtocol } from '@/lib/protocol';
import { whatsappService } from '@/lib/whatsapp';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Generate Protocol
    const protocol = await generateProtocol();

    // 1. Update to CLOSED with protocol and closedAt FIRST
    // This ensures the UX is fast and the state is preserved even if message fails
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'CLOSED',
        isBotActive: false,
        // Mantemos o departmentId e assignedToId para histórico e filtros
        currentFlowId: null,
        currentStepId: null,
        protocol: protocol,
        closedAt: new Date()
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

    // 2. Try to send the protocol message in the background/secondary
    // We still await but in a separate block to ensure it doesn't crash the main update
    try {
      const instance = await resolveConnectedInstanceForConversation({
        departmentId: conversation.departmentId,
        platform: conversation.platform === 'TELEGRAM' ? 'TELEGRAM' : 'WHATSAPP',
      });

      if (instance) {
        const closureMessage = `*Atendimento Finalizado*\n\nSeu protocolo de atendimento é: *${protocol}*\n\nObrigado por entrar em contato!`;
        
        // We use a shorter timeout for this specific notification to not hang the UI
        await whatsappService.sendMessage(instance.instanceId, conversation.contact.number, closureMessage);
        
        // Save the closure message in DB for history
        await prisma.message.create({
          data: {
            conversationId: id,
            body: closureMessage,
            fromMe: true,
          }
        });
      }
    } catch (msgError) {
      console.error('[Protocol] Falha ao enviar notificação de fechamento:', msgError);
      // We don't fail the request if just the message fails
    }

    console.log(`[Protocol] Conversa ${id} encerrada com protocolo ${protocol} por ${session.user.name}`);

    // Notify via Socket
    try {
      await fetch(process.env.SOCKET_URL || 'http://localhost:3000/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'conversation_updated',
          data: {
            conversationId: id,
            conversation: updatedConversation
          }
        })
      });
    } catch (e) {
      console.error('[Socket] Failed to notify conversation closure:', e);
    }

    return NextResponse.json(updatedConversation);
  } catch (error: unknown) {
    console.error('[Protocol] Erro ao encerrar conversa:', error);
    return NextResponse.json({ error: 'Falha ao encerrar conversa' }, { status: 500 });
  }
}
