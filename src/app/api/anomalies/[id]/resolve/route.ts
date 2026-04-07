import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'VERIFIER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const anomaly = await prisma.anomalyFlag.update({
      where: { id },
      data: {
        resolved: true,
        resolvedById: user.userId,
        resolvedAt: new Date(),
      },
    });

    await logAudit({
      action: 'ANOMALY_RESOLVED',
      entityType: 'AnomalyFlag',
      entityId: id,
      userId: user.userId,
      details: { type: anomaly.type },
    });

    return NextResponse.json({ anomaly });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
