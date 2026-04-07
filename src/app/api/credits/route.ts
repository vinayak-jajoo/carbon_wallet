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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const ownerId = searchParams.get('ownerId');
    const batchId = searchParams.get('batchId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    if (user.role === 'BUYER' || user.role === 'PROJECT_OWNER') {
      where.ownerId = user.userId;
    }

    if (status) where.status = status;
    if (ownerId && user.role === 'ADMIN') where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { serialBlockStart: { contains: search, mode: 'insensitive' } },
        { project: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [batches, total] = await Promise.all([
      prisma.creditBatch.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, location: true, methodology: true } },
          owner: { select: { id: true, name: true, email: true } },
          transactions: true,
          retirements: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.creditBatch.count({ where }),
    ]);

    return NextResponse.json({
      credits: batches,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
