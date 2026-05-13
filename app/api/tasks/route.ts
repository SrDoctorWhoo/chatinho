import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const assignedToId = searchParams.get('assignedToId');

    const filter: any = {};
    if (departmentId && departmentId !== 'all') filter.departmentId = departmentId;
    if (status) filter.status = status;
    if (assignedToId) filter.assignedToId = assignedToId;

    const tasks = await prisma.task.findMany({
      where: filter,
      include: {
        department: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('[Tasks API GET Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, departmentId, assignedToId, priority, dueDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        departmentId,
        assignedToId,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: session.user.id
      },
      include: {
        department: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('[Tasks API POST Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
