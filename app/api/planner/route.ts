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

    console.log('Prisma models:', Object.keys(prisma));
    const user = session.user as any;
    const userRole = user.role;
    const userDepartmentIds = user.departmentIds || [];

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const userId = searchParams.get('userId');
    
    // Filter logic similar to dashboard
    let filter: any = {};
    
    // Department filtering
    if (departmentId && departmentId !== 'all') {
      filter.departmentId = departmentId;
    } else if (userRole !== 'ADMIN') {
      filter.departmentId = { in: userDepartmentIds };
    }

    // User filtering (Individual Planner)
    if (userId && userId !== 'all') {
      filter.assignedToId = userId;
    } else if (userId === 'me') {
      filter.assignedToId = user.id;
    }

    // Fetch all relevant conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { status: { in: ['QUEUED', 'ACTIVE', 'BOT'] }, ...filter },
          { status: 'CLOSED', updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, ...filter }
        ]
      },
      include: {
        contact: true,
        department: true,
        assignedTo: { select: { name: true, image: true } },
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Fetch standalone tasks
    if (!(prisma as any).task) {
        console.error('CRITICAL: prisma.task is still undefined!');
        return NextResponse.json({ 
            error: 'Database schema out of sync', 
            details: 'The Task model is missing from the generated Prisma client. Please restart the server.' 
        }, { status: 500 });
    }

    const tasks = await (prisma as any).task.findMany({
      where: filter,
      include: {
        department: true,
        assignedTo: {
          select: { id: true, name: true, image: true }
        },
        createdBy: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const columns = {
      todo: [
        ...conversations.filter(c => c.status === 'QUEUED' || c.status === 'BOT').map(c => ({ ...c, itemType: 'CONVERSATION' })),
        ...tasks.filter((t: any) => t.status === 'TODO').map((t: any) => ({ ...t, itemType: 'TASK' }))
      ],
      doing: [
        ...conversations.filter(c => c.status === 'ACTIVE').map(c => ({ ...c, itemType: 'CONVERSATION' })),
        ...tasks.filter((t: any) => t.status === 'DOING').map((t: any) => ({ ...t, itemType: 'TASK' }))
      ],
      done: [
        ...conversations.filter(c => c.status === 'CLOSED').map(c => ({ ...c, itemType: 'CONVERSATION' })),
        ...tasks.filter((t: any) => t.status === 'DONE').map((t: any) => ({ ...t, itemType: 'TASK' }))
      ]
    };

    // Sort each column by updatedAt
    columns.todo.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    columns.doing.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    columns.done.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(columns);

  } catch (error: any) {
    console.error('[Planner API Error]:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
