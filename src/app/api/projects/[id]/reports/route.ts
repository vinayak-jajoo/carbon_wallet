import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const createReportSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  emissionsReduced: z.number().positive(),
  notes: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const reports = await prisma.monitoringReport.findMany({
      where: { projectId: id },
      include: {
        verifier: { select: { id: true, name: true } },
        creditBatch: true,
      },
      orderBy: { periodStart: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Project must be approved before adding MRV reports' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

    // Check for duplicate monitoring period
    const existing = await prisma.monitoringReport.findFirst({
      where: {
        projectId: id,
        periodStart,
        periodEnd,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A monitoring report already exists for this period' },
        { status: 409 }
      );
    }

    const report = await prisma.monitoringReport.create({
      data: {
        projectId: id,
        periodStart,
        periodEnd,
        emissionsReduced: data.emissionsReduced,
        notes: data.notes,
        status: 'SUBMITTED',
      },
      include: {
        project: { select: { name: true } },
      },
    });

    await logAudit({
      action: 'REPORT_CREATED',
      entityType: 'MonitoringReport',
      entityId: report.id,
      userId: user.userId,
      details: {
        projectName: report.project.name,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
