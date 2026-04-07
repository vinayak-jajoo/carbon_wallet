import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const verifySchema = z.object({
  action: z.enum(['verify', 'reject']),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'VERIFIER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reportId } = await params;
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const report = await prisma.monitoringReport.findUnique({
      where: { id: reportId },
      include: { project: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Report is not in submittable state' },
        { status: 400 }
      );
    }

    const newStatus = parsed.data.action === 'verify' ? 'VERIFIED' : 'REJECTED';

    const updated = await prisma.monitoringReport.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        verifierId: user.userId,
        verifiedAt: new Date(),
        notes: parsed.data.notes || report.notes,
      },
    });

    await logAudit({
      action: newStatus === 'VERIFIED' ? 'REPORT_VERIFIED' : 'REPORT_REJECTED',
      entityType: 'MonitoringReport',
      entityId: reportId,
      userId: user.userId,
      details: {
        projectId: report.projectId,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json({ report: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
