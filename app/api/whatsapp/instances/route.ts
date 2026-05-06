import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Atualiza o status real consultando a Evolution API em paralelo
    const updatedInstances = await Promise.all(
      dbInstances.map(async (inst) => {
        try {
          const stateRes = await whatsappService.getSessionStatus(inst.instanceId);
          const rawState = stateRes?.instance?.state || stateRes?.state || stateRes?.status;

          const isOfficial = inst.integration === 'WHATSAPP-BUSINESS';
          const isOnline = (
            rawState === 'open' ||
            rawState === 'connected' ||
            rawState === 'CONNECTED' ||
            rawState === 'online' ||
            (isOfficial && rawState && rawState !== 'close' && rawState !== 'closed' && rawState !== 'DISCONNECTED')
          );

          const realStatus = isOnline ? 'CONNECTED' : 'DISCONNECTED';

          // Atualiza no banco se mudou
          if (realStatus !== inst.status) {
            await prisma.whatsappInstance.update({
              where: { id: inst.id },
              data: { status: realStatus }
            });
          }

          return { ...inst, status: realStatus };
        } catch {
          // Se falhar a consulta, mantém o status do banco
          return inst;
        }
      })
    );

    return NextResponse.json(updatedInstances);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch instances' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, integration, token, phoneNumberId, wabaId, number } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const integrationType = integration || 'WHATSAPP-BAILEYS';

    // 1. Cria na Evolution API
    console.log(`[Evolution] Criando instância "${name}" (${integrationType})...`);
    
    if (integrationType === 'WHATSAPP-BUSINESS') {
      // Cloud API: envia com as credenciais da Meta
      await whatsappService.createCloudInstance(name, { token: token || '', businessId: wabaId || '', number: number || '' });
    } else {
      await whatsappService.createInstance(name);
    }
    
    // 2. Salva no banco local
    const instance = await prisma.whatsappInstance.create({
      data: {
        name: name,
        instanceId: name,
        status: integrationType === 'WHATSAPP-BUSINESS' ? 'CONNECTED' : 'DISCONNECTED',
        integration: integrationType,
        token: token || null,
        phoneNumberId: phoneNumberId || null,
        wabaId: wabaId || null,
      }
    });

    // 3. Configura webhook
    await whatsappService.setWebhook(name);

    return NextResponse.json(instance);
  } catch (error: any) {
    console.error('Error creating instance:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create instance' 
    }, { status: 500 });
  }
}
