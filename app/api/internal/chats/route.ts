import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Garante que todos os departamentos tenham um chat de grupo
    const departments = await prisma.department.findMany();
    for (const dept of departments) {
      await prisma.internalChat.upsert({
        where: { id: `dept-${dept.id}` },
        update: { name: `Setor: ${dept.name}` },
        create: {
          id: `dept-${dept.id}`,
          type: 'GROUP',
          departmentId: dept.id,
          name: `Setor: ${dept.name}`
        }
      });
    }

    const chats = await prisma.internalChat.findMany({
      where: {
        OR: [
          { participants: { some: { userId: session.user.id } } },
          { type: 'GROUP' } 
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching internal chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, targetId, departmentId, name } = await req.json();

  try {
    if (type === 'DIRECT') {
      // Check if 1:1 chat already exists
      const existingChat = await prisma.internalChat.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: session.user.id } } },
            { participants: { some: { userId: targetId } } }
          ]
        },
        include: {
          participants: { include: { user: true } }
        }
      });

      if (existingChat) return NextResponse.json(existingChat);

      const newChat = await prisma.internalChat.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { userId: session.user.id },
              { userId: targetId }
            ]
          }
        },
        include: {
          participants: { include: { user: true } }
        }
      });
      return NextResponse.json(newChat);
    }

    if (type === 'GROUP' && departmentId) {
      const existingGroup = await prisma.internalChat.findFirst({
        where: { type: 'GROUP', departmentId },
        include: { participants: { include: { user: true } } }
      });

      if (existingGroup) return NextResponse.json(existingGroup);

      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      const newGroup = await prisma.internalChat.create({
        data: {
          type: 'GROUP',
          departmentId,
          name: name || `Setor: ${dept?.name || 'Geral'}`,
          // Note: In a real app, you might want to add all department users as participants
          // For now, we'll keep it open or add the creator
          participants: {
            create: { userId: session.user.id }
          }
        },
        include: {
          participants: { include: { user: true } }
        }
      });
      return NextResponse.json(newGroup);
    }

    return NextResponse.json({ error: 'Invalid chat type' }, { status: 400 });
  } catch (error) {
    console.error('Error creating internal chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
