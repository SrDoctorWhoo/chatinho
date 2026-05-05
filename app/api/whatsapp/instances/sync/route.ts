import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // 1. Busca instâncias na Evolution API
    const evolutionInstances = await whatsappService.getInstances();
    
    if (!Array.isArray(evolutionInstances)) {
      return NextResponse.json({ error: 'Evolution API did not return an array' }, { status: 500 });
    }

    let syncedCount = 0;

    // 2. Sincroniza cada instância com o banco local
    for (const evo of evolutionInstances) {
      const name = evo.instanceName || evo.name || evo.instance?.instanceName || evo.instance?.name;
      
      if (!name) {
        console.warn('[Sync] Instância sem nome ignorada:', evo);
        continue;
      }

      const connectionState = evo.connectionStatus?.state || evo.status || evo.instance?.status;
      const status = connectionState === 'open' || connectionState === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED';

      await prisma.whatsappInstance.upsert({
        where: { instanceId: name },
        update: {
          name: name,
          status: status,
        },
        create: {
          name: name,
          instanceId: name,
          status: status,
        }
      });

      // Se estiver conectada, garante que o webhook esteja configurado
      if (status === 'CONNECTED') {
        console.log(`[Sync] Configurando Webhook para ${name}`);
        await whatsappService.setWebhook(name);
      }

      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('Error syncing instances:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
