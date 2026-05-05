import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const dbInstances = await prisma.whatsappInstance.findMany();
    // In a real scenario, we would merge this with live status from Evolution API
    return NextResponse.json(dbInstances);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch instances' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // 1. Cria na Evolution API primeiro
    console.log(`[Evolution] Criando instância "${name}"...`);
    const evolutionData = await whatsappService.createInstance(name);
    
    // 2. Salva no banco local
    const instance = await prisma.whatsappInstance.create({
      data: {
        name: name,
        instanceId: name,
        status: 'DISCONNECTED',
      }
    });

    return NextResponse.json(instance);
  } catch (error: any) {
    console.error('Error creating instance:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create instance' 
    }, { status: 500 });
  }
}
