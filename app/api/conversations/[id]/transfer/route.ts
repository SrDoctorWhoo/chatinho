import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        assignedToId: userId,
        status: 'ACTIVE', // ensure it moves out of queue if it was there
        isBotActive: false
      }
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error transferring conversation:', error);
    return NextResponse.json({ error: 'Failed to transfer conversation' }, { status: 500 });
  }
}
