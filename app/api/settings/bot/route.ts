import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
  return NextResponse.json({ enabled: settings?.isBotEnabled ?? true });
}

export async function POST(req: Request) {
  const { enabled } = await req.json();
  
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'global' },
    update: { isBotEnabled: enabled },
    create: { id: 'global', isBotEnabled: enabled }
  });

  return NextResponse.json({ enabled: settings.isBotEnabled });
}
