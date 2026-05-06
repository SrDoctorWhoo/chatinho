import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  console.log('--- Iniciando Limpeza via API ---');
  
  try {
    // 1. Busca instâncias na Evolution
    const evoRes = await whatsappService.getInstances();
    const evoInstances = Array.isArray(evoRes) ? evoRes.map((i: any) => i.name) : [];
    console.log('Instâncias na Evolution:', evoInstances);

    // 2. Busca instâncias no Banco Local
    const localInstances = await prisma.whatsappInstance.findMany();
    const localIds = localInstances.map(i => i.instanceId);
    console.log('Instâncias no Banco Local:', localIds);

    // 3. Identifica as que estão no banco mas NÃO na Evolution
    const toDelete = localInstances.filter(i => !evoInstances.includes(i.instanceId));
    
    const results = [];
    if (toDelete.length === 0) {
      console.log('Nenhuma instância fantasma encontrada.');
    } else {
      for (const inst of toDelete) {
        await prisma.whatsappInstance.delete({ where: { id: inst.id } });
        results.push({ name: inst.name, instanceId: inst.instanceId });
        console.log(`- Removida: ${inst.name}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      cleanedCount: results.length,
      removed: results,
      foundInEvo: evoInstances
    });
  } catch (err: any) {
    console.error('Erro na limpeza:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
