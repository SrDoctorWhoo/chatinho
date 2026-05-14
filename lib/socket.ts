import { prisma } from './prisma';

export async function notifySocket(messageId: string) {
  try {
    const enrichedMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            contact: true,
            department: true,
            assignedTo: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!enrichedMessage) {
      return;
    }

    const internalUrl = 'http://127.0.0.1:3000/api/internal/notify-socket';
    
    await fetch(internalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'new_message',
        data: {
          message: enrichedMessage,
          conversationId: enrichedMessage.conversationId,
          conversation: enrichedMessage.conversation,
        },
      }),
    });
  } catch (err) {
    console.error('[SocketNotify] Erro ao notificar socket:', err);
  }
}
