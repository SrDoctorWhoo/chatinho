import { prisma } from './prisma';
import { whatsappService } from './whatsapp';
import { notifySocket } from './socket';

export type MessageType = 'chat' | 'image' | 'audio' | 'video' | 'document' | 'bot' | 'internal';

export interface SendMessageParams {
  conversationId: string;
  body: string;
  type?: MessageType;
  fromMe?: boolean;
  instanceName?: string;
  remoteJid?: string;
}

export const messageDispatcher = {
  async send(params: SendMessageParams) {
    const { 
      conversationId, 
      body, 
      type = 'chat', 
      fromMe = true,
      instanceName,
      remoteJid 
    } = params;

    // 1. Fetch Conversation to know the platform
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 2. Save Message in DB
    const savedMessage = await prisma.message.create({
      data: {
        conversationId,
        body,
        fromMe,
        type: type === 'bot' || type === 'internal' ? type : 'chat',
        timestamp: new Date()
      }
    });

    // 3. Update Conversation lastMessageAt and status
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        lastMessageAt: new Date(),
        status: (fromMe && conversation.status === 'CLOSED') ? 'PENDING' : conversation.status
      }
    });

    // 4. Send to External Channel (if from agent/bot and not internal)
    if (fromMe && type !== 'internal') {
      const platform = conversation.platform;

      if (platform !== 'WIDGET') {
        const targetInstance = instanceName || conversation.widgetInstanceId;
        
        if (!targetInstance) {
          console.warn(`[MessageDispatcher] Warning: No instanceName provided for ${platform} message. Delivery might fail.`);
        }

        const targetJid = remoteJid || (platform === 'TELEGRAM' ? conversation.contact.number : `${conversation.contact.number}@s.whatsapp.net`);

        try {
          if (targetInstance) {
            await whatsappService.sendMessage(targetInstance, targetJid, body);
          }
        } catch (err) {
          console.error(`[MessageDispatcher] Error sending to ${platform}:`, err);
          // We don't throw here to ensure the message is at least saved in our DB
        }
      }
    }

    // 5. Notify via Socket
    await notifySocket(savedMessage.id);

    return savedMessage;
  }
};
