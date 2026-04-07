import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'VERIFIER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'SUBMITTED' && project.status !== 'UNDER_REVIEW') {
      return NextResponse.json(
        { error: 'Project is not in reviewable state' },
        { status: 400 }
      );
    }

    const newStatus = parsed.data.action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.project.update({
      where: { id },
      data: { status: newStatus },
    });

    await logAudit({
      action: newStatus === 'APPROVED' ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED',
      entityType: 'Project',
      entityId: id,
      userId: user.userId,
      details: { name: project.name, notes: parsed.data.notes },
    });

    return NextResponse.json({ project: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
