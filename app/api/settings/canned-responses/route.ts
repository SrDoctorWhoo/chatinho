import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const responses = await prisma.cannedResponse.findMany({
      orderBy: { shortcut: 'asc' }
    });
    return NextResponse.json(responses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch canned responses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { shortcut, content } = await req.json();
    if (!shortcut || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const response = await prisma.cannedResponse.create({
      data: { shortcut: shortcut.toLowerCase().replace(/[^a-z0-9]/g, ''), content }
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create canned response' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await req.json();
    await prisma.cannedResponse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
