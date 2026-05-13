import { prisma } from './prisma';

type ConversationPlatform = 'WHATSAPP' | 'TELEGRAM';

export async function resolveConnectedInstanceForConversation(params: {
  departmentId: string | null;
  platform: ConversationPlatform;
}) {
  const integrationFilter =
    params.platform === 'TELEGRAM'
      ? { integration: 'TELEGRAM' as const }
      : { integration: { not: 'TELEGRAM' as const } };

  let instance = null;

  if (params.departmentId) {
    instance = await prisma.whatsappInstance.findFirst({
      where: {
        status: 'CONNECTED',
        isActive: true,
        ...integrationFilter,
        departments: { some: { id: params.departmentId } },
      },
    });
  }

  if (!instance) {
    instance = await prisma.whatsappInstance.findFirst({
      where: {
        status: 'CONNECTED',
        isActive: true,
        ...integrationFilter,
        departments: { none: {} },
      },
    });
  }

  if (!instance) {
    instance = await prisma.whatsappInstance.findFirst({
      where: {
        status: 'CONNECTED',
        isActive: true,
        ...integrationFilter,
      },
    });
  }

  return instance;
}
