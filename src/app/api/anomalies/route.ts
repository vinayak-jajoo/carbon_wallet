import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved');

    const where: Record<string, unknown> = {};
    if (resolved !== null) {
      where.resolved = resolved === 'true';
    }

    const anomalies = await prisma.anomalyFlag.findMany({
      where,
      include: {
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ anomalies });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
