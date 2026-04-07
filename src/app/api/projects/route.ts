import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const createProjectSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10),
  registry: z.string().optional(),
  methodology: z.string().min(3),
  location: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
  estCredits: z.number().int().positive(),
  mrvReportUrl: z.string().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    // Project owners only see their own projects
    if (user.role === 'PROJECT_OWNER') {
      where.ownerId = user.userId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { monitoringReports: true, creditBatches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'PROJECT_OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const payload = Object.fromEntries(formData.entries());

    let fileUrl = null;
    const file = formData.get('mrvReportFile') as File | null;
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
      const uploadDir = join(process.cwd(), 'public/uploads');
      try {
        await writeFile(join(uploadDir, filename), buffer);
        fileUrl = `/uploads/${filename}`;
      } catch (err) {
        console.error('File write error', err);
        // fallback to base64 if write fails
        fileUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      }
    }

    const payloadObj = {
      ...payload,
      estCredits: Number(formData.get('estCredits')),
      mrvReportUrl: fileUrl || null,
    };

    const parsed = createProjectSchema.safeParse(payloadObj);

    if (!parsed.success) {
      const messages = Object.values(parsed.error.flatten().fieldErrors).flat().join(', ');
      return NextResponse.json(
        { error: messages || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        registry: data.registry || 'CCTS',
        methodology: data.methodology,
        location: data.location,
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        estCredits: Number(formData.get('estCredits')),
        mrvReportUrl: data.mrvReportUrl || null,
        ownerId: user.userId,
        status: 'SUBMITTED',
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project.id,
      userId: user.userId,
      details: { name: project.name },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
