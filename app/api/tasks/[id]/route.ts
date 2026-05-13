import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, status, priority, assignedToId, departmentId, dueDate } = body;

    const resolvedParams = await params;
    const task = await prisma.task.update({
      where: { id: resolvedParams.id },
      data: {
        title,
        description,
        status,
        priority,
        assignedToId,
        departmentId,
        dueDate: dueDate ? new Date(dueDate) : undefined
      },
      include: {
        department: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('[Task API PATCH Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    await prisma.task.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Task API DELETE Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
