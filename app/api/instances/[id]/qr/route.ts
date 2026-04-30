import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp';
import { prisma } from '@/lib/prisma';

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

    // Use the QR code stored in the database
    const qr = instance.qrcode;
    
    return NextResponse.json({ 
      code: qr,
      status: instance.status
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
