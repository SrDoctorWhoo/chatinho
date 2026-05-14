import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, conversations: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, idleTimeout, idleCloseMessage } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: { 
        name, 
        description,
        idleTimeout: idleTimeout ? parseInt(idleTimeout) : null,
        idleCloseMessage
      }
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error('Error creating department:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um setor com este nome' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
