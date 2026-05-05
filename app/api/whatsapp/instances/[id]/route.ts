import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { whatsappService } from '@/lib/whatsapp';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const instance = await prisma.whatsappInstance.findUnique({
      where: { id }
    });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    // 1. Deleta na Evolution API
    console.log(`[Evolution] Deletando instância "${instance.instanceId}"...`);
    await whatsappService.deleteInstance(instance.instanceId);

    // 2. Deleta do Banco de Dados local
    await prisma.whatsappInstance.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Erro ao deletar instância:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
