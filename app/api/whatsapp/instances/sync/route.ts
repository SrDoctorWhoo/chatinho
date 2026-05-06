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
    console.log(`[Sync] Evolution API retornou ${evolutionInstances?.length || 0} instâncias.`);
    
    if (!Array.isArray(evolutionInstances)) {
      console.error('[Sync] Erro: Evolution API não retornou um array:', evolutionInstances);
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

      // Log para diagnóstico (aparecerá no terminal)
      console.log(`[Sync] Dados recebidos para ${name}:`, JSON.stringify(evo));

      const connectionState = 
        evo.connectionStatus?.state || 
        evo.status || 
        evo.instanceStatus ||
        evo.instance?.status || 
        evo.instance?.state ||
        evo.instance?.instanceStatus ||
        evo.state;

      console.log(`[Sync] Status detectado para ${name}: "${connectionState}"`);

      const number = evo.owner || evo.number || evo.instance?.owner || evo.instance?.number;
      const integrationFromEvo = evo.instanceType || evo.instance?.instanceType || evo.type;
      
      // Busca a instância atual para não sobrescrever o tipo manualmente definido se a Evolution não enviar
      const existingInstance = await prisma.whatsappInstance.findUnique({
        where: { instanceId: name }
      });

      const integration = integrationFromEvo || existingInstance?.integration || 'WHATSAPP-BAILEYS';

      // Para instâncias Oficiais (Cloud), se houver qualquer sinal de vida (não for closed/disconnected), 
      // consideramos como CONNECTED pois a Meta não cai como o Baileys
      const isOfficial = integration === 'WHATSAPP-BUSINESS' || name.toUpperCase().includes('META');
      const isOnlineState = (
        connectionState === 'open' || 
        connectionState === 'CONNECTED' || 
        connectionState === 'online' || 
        connectionState === 'connected' ||
        connectionState === 'ACTIVE' ||
        (isOfficial && connectionState && connectionState !== 'close' && connectionState !== 'closed' && connectionState !== 'DISCONNECTED')
      );

      const status = isOnlineState ? 'CONNECTED' : 'DISCONNECTED';
      const finalIntegration = isOfficial ? 'WHATSAPP-BUSINESS' : integration;

      await prisma.whatsappInstance.upsert({
        where: { instanceId: name },
        update: {
          name: name,
          status: status,
          number: number ? String(number).split('@')[0] : undefined,
          integration: finalIntegration
        },
        create: {
          name: name,
          instanceId: name,
          status: status,
          number: number ? String(number).split('@')[0] : undefined,
          integration: finalIntegration
        }
      });

      // Garante que o webhook esteja sempre apontando para a URL atual do Serveo
      console.log(`[Sync] Atualizando Webhook para ${name}...`);
      await whatsappService.setWebhook(name);

      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('Error syncing instances:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
