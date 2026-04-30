import { NextResponse } from 'next/server';
import { evolutionService } from '@/lib/evolution';
import { prisma } from '@/lib/prisma';
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
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // 1. Create in Evolution API
    const evolutionData = await evolutionService.createInstance(name);
    
    // 2. Save in DB
    const instance = await prisma.whatsappInstance.create({
      data: {
        name,
        instanceId: evolutionData.instance.instanceId,
        status: 'DISCONNECTED',
      }
    });

    return NextResponse.json(instance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create instance' }, { status: 500 });
  }
}
