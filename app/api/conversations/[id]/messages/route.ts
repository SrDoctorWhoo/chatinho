import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const cursor = searchParams.get('cursor');

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    take: limit,
    ...(cursor ? {
      skip: 1, // Skip the cursor itself
      cursor: { id: cursor },
    } : {}),
    orderBy: { timestamp: 'desc' } // Get most recent first
  });

  // Return in ASC order for the UI
  return NextResponse.json(messages.reverse());
}
