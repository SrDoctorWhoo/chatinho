import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { telegramService } from '@/lib/telegram';
import { whatsappService } from '@/lib/whatsapp';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const instance = await prisma.whatsappInstance.findUnique({ where: { id } });
    if (!instance) return NextResponse.json({ error: 'Instance not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};

    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.integration !== undefined) updateData.integration = body.integration;
    if (body.token !== undefined) updateData.token = body.token;
    if (body.phoneNumberId !== undefined) updateData.phoneNumberId = body.phoneNumberId;
    if (body.wabaId !== undefined) updateData.wabaId = body.wabaId;

    if (body.departmentIds !== undefined) {
      updateData.departments = {
        set: body.departmentIds.map((departmentId: string) => ({ id: departmentId })),
      };
    }

    if (instance.integration === 'WHATSAPP-BUSINESS' && (body.token || body.phoneNumberId || body.wabaId)) {
      await whatsappService.updateMetaSettings(instance.instanceId, {
        token: body.token || instance.token || '',
        phoneNumberId: body.phoneNumberId || instance.phoneNumberId || '',
        wabaId: body.wabaId || instance.wabaId || '',
      });
      console.log(`[API] Configuracoes Meta sincronizadas para ${instance.instanceId}`);
    }

    if ((body.integration === 'TELEGRAM' || instance.integration === 'TELEGRAM') && body.token !== undefined) {
      const nextToken = typeof body.token === 'string' ? body.token.trim() : '';

      if (!nextToken) {
        return NextResponse.json({ error: 'Telegram bot token is required' }, { status: 400 });
      }

      const botIdentity = await telegramService.getMe(nextToken);
      await telegramService.setWebhook(instance.instanceId, nextToken);
      updateData.status = 'CONNECTED';
      updateData.number = botIdentity.username ? `@${botIdentity.username}` : String(botIdentity.id);
    }

    const updatedInstance = await prisma.whatsappInstance.update({
      where: { id },
      data: updateData,
      include: {
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedInstance);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update instance';
    console.error('[API] Erro ao atualizar instancia:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const instance = await prisma.whatsappInstance.findUnique({
      where: { id },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (instance.integration === 'TELEGRAM') {
      if (instance.token) {
        await telegramService.deleteWebhook(instance.token);
      }
    } else {
      console.log(`[Evolution] Deletando instancia "${instance.instanceId}"...`);
      await whatsappService.deleteInstance(instance.instanceId);
    }

    await prisma.whatsappInstance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete instance';
    console.error('[API] Erro ao deletar instancia:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
