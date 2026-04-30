import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    },
    orderBy: { lastMessageAt: 'desc' }
  });

  return NextResponse.json(conversations);
}
