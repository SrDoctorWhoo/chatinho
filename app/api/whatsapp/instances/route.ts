import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { telegramService } from '@/lib/telegram';
import { whatsappService } from '@/lib/whatsapp';

type ProviderResponseData = {
  response?: { message?: string };
  message?: string;
  error?: string;
};

type ProviderError = {
  response?: {
    status?: number;
    data?: ProviderResponseData;
  };
  message?: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const dbInstances = await prisma.whatsappInstance.findMany({
      include: {
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const updatedInstances = await Promise.all(
      dbInstances.map(async (inst) => {
        try {
          if (inst.integration === 'TELEGRAM') {
            if (!inst.token) {
              if (inst.status !== 'DISCONNECTED') {
                await prisma.whatsappInstance.update({
                  where: { id: inst.id },
                  data: { status: 'DISCONNECTED' },
                });
              }

              return { ...inst, status: 'DISCONNECTED' };
            }

            try {
              const me = await telegramService.getMe(inst.token);
              const displayHandle = me.username ? `@${me.username}` : String(me.id);
              const nextData: Record<string, string> = {};

              if (inst.status !== 'CONNECTED') {
                nextData.status = 'CONNECTED';
              }

              if (inst.number !== displayHandle) {
                nextData.number = displayHandle;
              }

              if (Object.keys(nextData).length > 0) {
                await prisma.whatsappInstance.update({
                  where: { id: inst.id },
                  data: nextData,
                });
              }

              return { ...inst, status: 'CONNECTED', number: displayHandle };
            } catch {
              if (inst.status !== 'DISCONNECTED') {
                await prisma.whatsappInstance.update({
                  where: { id: inst.id },
                  data: { status: 'DISCONNECTED' },
                });
              }

              return { ...inst, status: 'DISCONNECTED' };
            }
          }

          const stateRes = await whatsappService.getSessionStatus(inst.instanceId);
          const rawState = stateRes?.instance?.state || stateRes?.state || stateRes?.status;

          const isOfficial = inst.integration === 'WHATSAPP-BUSINESS';
          const isOnline =
            rawState === 'open' ||
            rawState === 'connected' ||
            rawState === 'CONNECTED' ||
            rawState === 'online' ||
            (isOfficial &&
              rawState &&
              rawState !== 'close' &&
              rawState !== 'closed' &&
              rawState !== 'DISCONNECTED');

          const realStatus = isOnline ? 'CONNECTED' : 'DISCONNECTED';

          if (realStatus !== inst.status) {
            await prisma.whatsappInstance.update({
              where: { id: inst.id },
              data: { status: realStatus },
            });
          }

          return { ...inst, status: realStatus };
        } catch {
          return inst;
        }
      })
    );

    return NextResponse.json(updatedInstances);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch instances' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, integration, token, phoneNumberId, wabaId, number } = await req.json();

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedToken = typeof token === 'string' ? token.trim() : '';
    const normalizedPhoneNumberId = typeof phoneNumberId === 'string' ? phoneNumberId.trim() : '';
    const normalizedWabaId = typeof wabaId === 'string' ? wabaId.trim() : '';
    const normalizedNumber = typeof number === 'string' ? number.trim() : '';
    const integrationType = integration || 'WHATSAPP-BAILEYS';

    if (!normalizedName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (integrationType === 'TELEGRAM' && !normalizedToken) {
      return NextResponse.json({ error: 'Telegram bot token is required' }, { status: 400 });
    }

    if (integrationType === 'WHATSAPP-BUSINESS' && (!normalizedToken || !normalizedWabaId || !normalizedNumber)) {
      return NextResponse.json(
        { error: 'Token, Business ID and number are required for WhatsApp Business' },
        { status: 400 }
      );
    }

    let initialStatus = integrationType === 'WHATSAPP-BUSINESS' ? 'CONNECTED' : 'DISCONNECTED';
    let displayNumber: string | null = null;

    if (integrationType === 'WHATSAPP-BUSINESS') {
      await whatsappService.createCloudInstance(normalizedName, {
        token: normalizedToken,
        businessId: normalizedWabaId,
        number: normalizedNumber,
      });
      displayNumber = normalizedNumber || null;
    } else if (integrationType === 'TELEGRAM') {
      const botIdentity = await telegramService.getMe(normalizedToken);
      await telegramService.setWebhook(normalizedName, normalizedToken);
      initialStatus = 'CONNECTED';
      displayNumber = botIdentity.username ? `@${botIdentity.username}` : String(botIdentity.id);
    } else {
      await whatsappService.createInstance(normalizedName);
    }

    const instance = await prisma.whatsappInstance.create({
      data: {
        name: normalizedName,
        instanceId: normalizedName,
        status: initialStatus,
        integration: integrationType,
        number: displayNumber,
        token: normalizedToken || null,
        phoneNumberId: normalizedPhoneNumberId || null,
        wabaId: normalizedWabaId || null,
      },
    });

    if (integrationType !== 'TELEGRAM') {
      await whatsappService.setWebhook(normalizedName);
    }

    return NextResponse.json(instance);
  } catch (error: unknown) {
    console.error('Error creating instance:', error);
    const providerErrorObject = error as ProviderError;

    const status =
      typeof providerErrorObject.response?.status === 'number'
        ? providerErrorObject.response.status
        : 500;
    const providerError =
      providerErrorObject.response?.data?.response?.message ||
      providerErrorObject.response?.data?.message ||
      providerErrorObject.response?.data?.error ||
      providerErrorObject.message ||
      'Failed to create instance';

    return NextResponse.json(
      { error: providerError },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
