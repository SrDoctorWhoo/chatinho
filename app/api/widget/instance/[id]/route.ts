import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint - no auth required
// Returns only the minimal info needed for the widget UI
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const widget = await prisma.widgetInstance.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        config: true,
      }
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    if (!widget.isActive) {
      return NextResponse.json({ error: 'Widget is disabled' }, { status: 403 });
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.error('[Widget Instance] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
