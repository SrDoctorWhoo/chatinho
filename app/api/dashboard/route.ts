import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force rebuild for Prisma schema sync
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedDepartmentId = searchParams.get('departmentId');
    
    const user = session.user as any;
    const userRole = user.role;
    const userDepartmentIds = user.departmentIds || [];

    // Define allowed department IDs for the current user
    let allowedDepartmentIds: string[] = [];
    let availableDepartments: any[] = [];

    if (userRole === 'ADMIN') {
      // Admins see all departments
      availableDepartments = await prisma.department.findMany({
        select: { id: true, name: true }
      });
      allowedDepartmentIds = availableDepartments.map(d => d.id);
    } else {
      // Attendants only see their assigned departments
      availableDepartments = await prisma.department.findMany({
        where: { id: { in: userDepartmentIds } },
        select: { id: true, name: true }
      });
      allowedDepartmentIds = availableDepartments.map(d => d.id);
    }

    // Determine the final filter for the queries
    let departmentFilter: any = {};
    if (selectedDepartmentId && selectedDepartmentId !== 'all') {
      // Ensure the selected department is allowed
      if (allowedDepartmentIds.includes(selectedDepartmentId)) {
        departmentFilter = { departmentId: selectedDepartmentId };
      } else {
        return NextResponse.json({ error: 'Forbidden department access' }, { status: 403 });
      }
    } else if (userRole !== 'ADMIN') {
      // Non-admins default to their allowed departments
      departmentFilter = { departmentId: { in: allowedDepartmentIds } };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Stats
    const [
      activeCount,
      waitingCount,
      attendantsCount,
      resolvedTodayCount
    ] = await Promise.all([
      prisma.conversation.count({
        where: { 
          status: { in: ['BOT', 'QUEUED', 'ATTENDING'] },
          ...departmentFilter
        }
      }),
      prisma.conversation.count({
        where: { 
          status: 'QUEUED',
          ...departmentFilter
        }
      }),
      // Attendants count is always global or by department
      prisma.user.count({
        where: { 
          role: 'ATTENDANT',
          ...(selectedDepartmentId && selectedDepartmentId !== 'all' ? {
            departments: { some: { id: selectedDepartmentId } }
          } : (userRole !== 'ADMIN' ? {
            departments: { some: { id: { in: allowedDepartmentIds } } }
          } : {}))
        }
      }),
      prisma.conversation.count({
        where: { 
          status: 'CLOSED',
          updatedAt: { gte: today },
          ...departmentFilter
        }
      })
    ]);

    // 2. Recent Activity (Last 10 messages from last 30 days for speed)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.message.findMany({
      where: {
        conversation: departmentFilter,
        timestamp: { gte: thirtyDaysAgo }
      },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        conversation: {
          include: {
            contact: true
          }
        }
      }
    });

    // 3. Queue (Oldest waiting conversations)
    const queue = await prisma.conversation.findMany({
      where: { 
        status: 'QUEUED',
        ...departmentFilter
      },
      take: 10,
      orderBy: { lastMessageAt: 'asc' },
      include: {
        contact: true,
        department: true
      }
    });

    return NextResponse.json({
      stats: {
        active: activeCount,
        waiting: waitingCount,
        attendants: attendantsCount,
        resolvedToday: resolvedTodayCount
      },
      recentActivity: recentActivity.map(msg => ({
        id: msg.id,
        contactName: msg.conversation.contact.name || msg.conversation.contact.number,
        body: msg.body,
        timestamp: msg.timestamp,
        fromMe: msg.fromMe
      })),
      queue: queue.map(conv => ({
        id: conv.id,
        contactName: conv.contact.name || conv.contact.number,
        departmentName: conv.department?.name || 'Geral',
        waitingSince: conv.lastMessageAt
      })),
      availableDepartments
    });

  } catch (error: any) {
    console.error('[Dashboard API Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
