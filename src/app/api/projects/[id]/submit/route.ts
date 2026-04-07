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

    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (project.status !== 'DRAFT' && project.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Project can only be submitted from DRAFT or REJECTED status' },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submissionCount: { increment: 1 },
      },
    });

    await logAudit({
      action: 'PROJECT_SUBMITTED',
      entityType: 'Project',
      entityId: id,
      userId: user.userId,
      details: { name: project.name, submissionCount: updated.submissionCount },
    });

    return NextResponse.json({ project: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
