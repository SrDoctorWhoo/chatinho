import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const convId = searchParams.get('convId');

  if (!convId) {
    return NextResponse.json({ error: 'Conversation ID missing' }, { status: 400 });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: convId }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const variables = JSON.parse(conversation.variables || '{}');
    const isAuthenticated = variables.user_logged_in === 'true';

    return NextResponse.json({ 
      isAuthenticated,
      name: variables.nome || variables.name || ''
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
