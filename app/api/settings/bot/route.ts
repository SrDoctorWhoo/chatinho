import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
    return NextResponse.json(settings || { 
      isBotEnabled: true, 
      difyEnabled: false, 
      difyApiKey: '', 
      difyUrl: '', 
      chatExpirationMinutes: 60 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: { 
        isBotEnabled: body.isBotEnabled,
        difyEnabled: body.difyEnabled,
        difyApiKey: body.difyApiKey,
        difyUrl: body.difyUrl,
        chatExpirationMinutes: parseInt(body.chatExpirationMinutes) || 60
      },
      create: { 
        id: 'global', 
        isBotEnabled: body.isBotEnabled ?? true,
        difyEnabled: body.difyEnabled ?? false,
        difyApiKey: body.difyApiKey || '',
        difyUrl: body.difyUrl || '',
        chatExpirationMinutes: parseInt(body.chatExpirationMinutes) || 60
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[Settings API] Error:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
