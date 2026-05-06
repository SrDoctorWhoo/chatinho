import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const conversationId = formData.get('conversationId') as string;
    const caption = formData.get('caption') as string || '';
    const file = formData.get('file') as File;

    // Get user signature
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signature: true }
    });

    const finalCaption = user?.signature ? `*${user.signature}*\n${caption}` : caption;

    if (!conversationId || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Convert file to Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimetype = file.type;
    const fileName = file.name;

    // TODO: Determine the instance. For now hardcoding 'TESTE' or fetching first active
    const instance = await prisma.whatsappInstance.findFirst({
      where: { status: 'CONNECTED' }
    });
    
    const instanceName = instance?.name || 'TESTE';

    // Send via Evolution API
    const evolutionRes = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY || ''
      },
      body: JSON.stringify({
        number: conversation.contact.number,
        mediatype: mimetype.includes('image') ? 'image' : mimetype.includes('video') ? 'video' : 'document',
        mimetype: mimetype,
        caption: finalCaption,
        media: base64,
        fileName: fileName
      })
    });

    if (!evolutionRes.ok) {
      const errorData = await evolutionRes.json();
      throw new Error(errorData.error || 'Failed to send media via Evolution');
    }

    // Save message in DB
    const savedMessage = await prisma.message.create({
      data: {
        conversationId,
        body: finalCaption || '📷 Arquivo de Mídia',
        fromMe: true,
        type: mimetype.includes('image') ? 'image' : mimetype.includes('video') ? 'video' : 'document',
        mediaUrl: fileName // Can be enhanced later to save in S3/Cloudinary
      }
    });

    // Update conversation timestamp
    const updateData: any = { lastMessageAt: new Date() };
    if (!conversation.assignedToId || conversation.status !== 'ACTIVE') {
      updateData.status = 'ACTIVE';
      updateData.assignedToId = session.user.id;
      updateData.isBotActive = false;
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (error) {
    console.error('Error sending media:', error);
    return NextResponse.json({ error: 'Failed to send media' }, { status: 500 });
  }
}
