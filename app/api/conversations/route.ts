import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const mine = searchParams.get('mine') === 'true';

  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (mine) {
    where.assignedToId = session.user.id;
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      contact: true,
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1
      },
      assignedTo: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { lastMessageAt: 'desc' }
  });

  return NextResponse.json(conversations);
}
