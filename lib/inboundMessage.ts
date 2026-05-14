import { prisma } from './prisma';
import { notifySocket } from './socket';

type IncomingPlatform = 'WHATSAPP' | 'TELEGRAM';
type IncomingMessageType = 'chat' | 'image' | 'audio' | 'video' | 'document';

function getContactNumber(platform: IncomingPlatform, remoteJid: string) {
  if (platform === 'TELEGRAM') {
    return remoteJid;
  }

  return remoteJid.includes('@lid') ? remoteJid : remoteJid.split('@')[0];
}

export async function processInboundConversationMessage(params: {
  instanceName: string;
  platform: IncomingPlatform;
  remoteJid: string;
  text: string;
  fromMe: boolean;
  pushName?: string | null;
  messageType?: IncomingMessageType;
  mediaUrl?: string | null;
  profilePicUrl?: string | null;
}) {
  const {
    instanceName,
    platform,
    remoteJid,
    text,
    fromMe,
    pushName,
    messageType = 'chat',
    mediaUrl = null,
    profilePicUrl = null,
  } = params;

  const number = getContactNumber(platform, remoteJid);

  let contact = await prisma.contact.findUnique({
    where: {
      number_platform: { number, platform },
    },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        number,
        platform,
        name: pushName || number,
        profilePic: profilePicUrl,
      },
    });
  } else if (pushName && (!contact.name || contact.name === contact.number || contact.name === 'TESTE')) {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: { name: pushName },
    });
  }

  let conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id, platform, status: { not: 'CLOSED' } },
  });

  if (!conversation) {
    let flow = await prisma.chatbotFlow.findFirst({
      where: { isActive: true, instances: { some: { instanceId: instanceName } } },
    });

    if (!flow) {
      flow = await prisma.chatbotFlow.findFirst({
        where: { isActive: true, isDefault: true },
      });
    }

    if (!flow) {
      flow = await prisma.chatbotFlow.findFirst({
        where: { isActive: true, instances: { none: {} } },
      });
    }

    const { generateProtocol } = await import('./protocol');
    conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        platform,
        status: flow ? 'BOT' : 'QUEUED',
        isBotActive: !!flow,
        protocol: generateProtocol(),
      },
    });
  } else if (!conversation.assignedToId && !conversation.isBotActive && conversation.status !== 'CLOSED') {
    let flow = await prisma.chatbotFlow.findFirst({
      where: { isActive: true, instances: { some: { instanceId: instanceName } } },
    });

    if (!flow) {
      flow = await prisma.chatbotFlow.findFirst({
        where: { isActive: true, isDefault: true },
      });
    }

    if (!flow) {
      flow = await prisma.chatbotFlow.findFirst({
        where: { isActive: true, instances: { none: {} } },
      });
    }

    if (flow) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { isBotActive: true, status: 'BOT' },
      });
    }
  }

  const savedMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      body: text || `[${messageType}]`,
      fromMe,
      type: messageType,
      mediaUrl,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  const hasApplicableFlow = await prisma.chatbotFlow.findFirst({
    where: {
      isActive: true,
      OR: [
        { instances: { some: { instanceId: instanceName } } },
        { isDefault: true },
        { instances: { none: {} } },
      ],
    },
  });

  if (!hasApplicableFlow && conversation.isBotActive) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isBotActive: false, status: 'QUEUED', currentFlowId: null, currentStepId: null },
    });
  }

  const canTriggerBot = (!conversation.assignedToId || conversation.isBotActive) && !!hasApplicableFlow;

  if (!fromMe && canTriggerBot) {
    const { botEngine } = await import('./botEngine');
    await botEngine.processMessage(conversation.id, text || '', instanceName, remoteJid);
  }

  await notifySocket(savedMessage.id);

  return savedMessage;
}
