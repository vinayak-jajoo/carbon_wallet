import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const issueSchema = z.object({
  monitoringReportId: z.string(),
  quantity: z.number().int().positive(),
  vintageYear: z.number().int().min(2000).max(2100),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can issue credits' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = issueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { monitoringReportId, quantity, vintageYear } = parsed.data;

    // Check report exists and is verified
    const report = await prisma.monitoringReport.findUnique({
      where: { id: monitoringReportId },
      include: { project: true, creditBatch: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Report must be verified before credits can be issued' },
        { status: 400 }
      );
    }

    // Prevent duplicate issuance
    if (report.creditBatch) {
      return NextResponse.json(
        { error: 'Credits have already been issued for this monitoring report' },
        { status: 409 }
      );
    }

    // Generate serial prefix
    const projectCode = report.project.name
      .replace(/[^A-Za-z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase();
    const serialPrefix = `CC-${projectCode}-${vintageYear}`;

    // Create batch in transaction
    const result = await prisma.$transaction(async (tx) => {
      const serialBlockStart = `${serialPrefix}-000001`;
      const serialBlockEnd = `${serialPrefix}-${String(quantity).padStart(6, '0')}`;
      
      const batch = await tx.creditBatch.create({
        data: {
          projectId: report.projectId,
          monitoringReportId,
          ownerId: report.project.ownerId,
          serialBlockStart,
          serialBlockEnd,
          quantity,
          vintageYear,
          issuedById: user.userId,
        },
      });

      return { batch, serialBlockStart, serialBlockEnd };
    });

    await logAudit({
      action: 'CREDITS_ISSUED',
      entityType: 'CreditBatch',
      entityId: result.batch.id,
      userId: user.userId,
      details: {
        projectId: report.projectId,
        projectName: report.project.name,
        quantity,
        serialPrefix,
        vintageYear,
      },
    });

    return NextResponse.json({
      batch: result.batch,
      creditsCreated: quantity,
      serialRange: {
        first: result.serialBlockStart,
        last: result.serialBlockEnd,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Credits already issued for this monitoring report' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
