import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const instance = await prisma.whatsappInstance.findUnique({
      where: { id }
    });

    if (!instance) return NextResponse.json({ error: 'Instance not found' }, { status: 404 });

    // Se no banco ainda não está conectado, verifica AO VIVO na Evolution API
    let currentStatus = instance.status;
    if (currentStatus !== 'CONNECTED') {
      const liveStatus = await whatsappService.getSessionStatus(instance.instanceId);
      const state = liveStatus?.instance?.state || liveStatus?.state;
      
      if (state === 'open') {
        currentStatus = 'CONNECTED';
        // Aproveita e já atualiza o banco para economizar trabalho do background server
        await prisma.whatsappInstance.update({
          where: { id },
          data: { status: 'CONNECTED', qrcode: null }
        });
      }
    }

    return NextResponse.json({ 
      code: instance.qrcode,
      status: currentStatus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
