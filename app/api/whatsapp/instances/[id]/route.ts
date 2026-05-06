import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { whatsappService } from '@/lib/whatsapp';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const instance = await prisma.whatsappInstance.findUnique({ where: { id } });
    if (!instance) return NextResponse.json({ error: 'Instance not found' }, { status: 404 });

    const updateData: any = {};
    
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.integration !== undefined) updateData.integration = body.integration;
    if (body.token !== undefined) updateData.token = body.token;
    if (body.phoneNumberId !== undefined) updateData.phoneNumberId = body.phoneNumberId;
    if (body.wabaId !== undefined) updateData.wabaId = body.wabaId;
    
    if (body.departmentIds !== undefined) {
      updateData.departments = {
        set: body.departmentIds.map((id: string) => ({ id }))
      };
    }

    // Se for uma instância Meta e os dados de config mudaram, atualiza na Evolution também
    if (instance.integration === 'WHATSAPP-BUSINESS' && (body.token || body.phoneNumberId || body.wabaId)) {
      try {
        await whatsappService.updateMetaSettings(instance.instanceId, {
          token: body.token || instance.token || '',
          phoneNumberId: body.phoneNumberId || instance.phoneNumberId || '',
          wabaId: body.wabaId || instance.wabaId || ''
        });
        console.log(`[API] Configurações Meta sincronizadas para ${instance.instanceId}`);
      } catch (err: any) {
        console.error(`[API] Erro ao sincronizar com Evolution:`, err.message);
        // Opcional: retornar erro aqui se a sincronização for crítica
      }
    }

    const updatedInstance = await prisma.whatsappInstance.update({
      where: { id },
      data: updateData,
      include: {
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedInstance);
  } catch (error: any) {
    console.error('[API] Erro ao atualizar instância:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
