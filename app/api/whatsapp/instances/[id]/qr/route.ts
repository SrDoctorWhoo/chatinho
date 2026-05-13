import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { telegramService } from '@/lib/telegram';
import { whatsappService } from '@/lib/whatsapp';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const instance = await prisma.whatsappInstance.findUnique({
      where: { id },
    });

    if (!instance) return NextResponse.json({ error: 'Instance not found' }, { status: 404 });

    if (instance.integration === 'TELEGRAM') {
      if (!instance.token) {
        return NextResponse.json({ code: null, status: 'DISCONNECTED' });
      }

      try {
        await telegramService.getMe(instance.token);
        return NextResponse.json({ code: null, status: 'CONNECTED' });
      } catch {
        return NextResponse.json({ code: null, status: 'DISCONNECTED' });
      }
    }

    let currentStatus = instance.status;

    if (currentStatus !== 'CONNECTED') {
      const liveStatus = await whatsappService.getSessionStatus(instance.instanceId);
      const state = liveStatus?.instance?.state || liveStatus?.state;

      if (state === 'open') {
        currentStatus = 'CONNECTED';
        await prisma.whatsappInstance.update({
          where: { id },
          data: { status: 'CONNECTED', qrcode: null },
        });
      }
    }

    return NextResponse.json({
      code: instance.qrcode,
      status: currentStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load QR status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
