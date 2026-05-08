import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Mapeamento de MimeTypes para Evolution/Meta
    let contentType = 'application/octet-stream';
    const ext = path.extname(filename).toLowerCase();
    const audioExts = ['.webm', '.mp3', '.m4a', '.ogg', '.mp4', '.aac'];
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const videoExts = ['.mp4', '.mov', '.avi'];

    if (audioExts.includes(ext)) {
      contentType = ext === '.mp3' ? 'audio/mpeg' : 'audio/mp4';
    } else if (imageExts.includes(ext)) {
      contentType = `image/${ext.replace('.', '')}`;
      if (contentType === 'image/jpg') contentType = 'image/jpeg';
    } else if (videoExts.includes(ext)) {
      contentType = 'video/mp4';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving media:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
