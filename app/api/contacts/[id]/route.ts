import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        observations: body.observations !== undefined ? body.observations : undefined,
        email: body.email !== undefined ? body.email : undefined,
      }
    });

    return NextResponse.json(updatedContact);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ 
      error: 'Failed to update contact', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    // Need to delete all conversations and messages associated with the contact
    const conversations = await prisma.conversation.findMany({
      where: { contactId: id }
    });

    const conversationIds = conversations.map(c => c.id);

    await prisma.message.deleteMany({
      where: { conversationId: { in: conversationIds } }
    });

    await prisma.conversation.deleteMany({
      where: { contactId: id }
    });

    await prisma.contact.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
