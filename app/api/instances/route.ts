import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const instances = await prisma.whatsappInstance.findMany();
  return NextResponse.json(instances);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  const instanceId = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

  try {
    // 1. Save in DB
    const instance = await prisma.whatsappInstance.create({
      data: {
        name,
        instanceId,
        status: 'DISCONNECTED',
      }
    });

    // 2. The background server (whatsapp-server.ts) will detect this new instance
    // and initialize the session automatically.

    return NextResponse.json(instance);
  } catch (error: any) {
    console.error('Error creating instance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
