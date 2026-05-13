import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usage = await prisma.aIUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const totalRequests = usage.length;
    const avgDuration = usage.length > 0 
      ? usage.reduce((acc, curr) => acc + (curr.duration || 0), 0) / usage.length 
      : 0;
    
    const transfers = usage.filter(u => u.action === 'TRANSFER').length;

    return NextResponse.json({
      history: usage,
      stats: {
        totalRequests,
        avgDuration: Math.round(avgDuration),
        transfers,
        transferRate: totalRequests > 0 ? Math.round((transfers / totalRequests) * 100) : 0
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch AI usage' }, { status: 500 });
  }
}
