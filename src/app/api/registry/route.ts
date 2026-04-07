import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const batchWhere: Record<string, unknown> = {};

    if (search) {
      batchWhere.OR = [
        { serialBlockStart: { contains: search, mode: 'insensitive' } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== '') {
      batchWhere.status = status;
    }

    const [batches, totalBatches, projects, rawActivity] = await Promise.all([
      prisma.creditBatch.findMany({
        where: batchWhere,
        include: {
          project: { select: { name: true, location: true, methodology: true } },
          owner: { select: { name: true } },
          retirements: {
            select: { retirementDate: true, reason: true, certificateNumber: true },
          },
          transactions: {
            include: { from: { select: { name: true } }, to: { select: { name: true } } },
            orderBy: { transferDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.creditBatch.count({ where: batchWhere }),
      
      // Load public project directory
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          methodology: true,
          status: true,
          estCredits: true,
          createdAt: true,
          owner: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to 100 most recent for the prototype registry
      }),

      // Load specific public-facing activity trails
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'PROJECT_CREATED',
              'PROJECT_APPROVED',
              'PROJECT_SUBMITTED',
              'CREDITS_ISSUED',
              'CREDIT_TRANSFERRED',
              'CREDIT_RETIRED',
              'PURCHASE_REQUESTED'
            ],
          },
        },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to 100 recent events
      }),
    ]);

    // Map to public-safe format
    const publicCredits = batches.map((c) => ({
      serialNumber: `${c.serialBlockStart}-${c.serialBlockEnd}`,
      quantity: c.quantity,
      status: c.status,
      projectName: c.project.name,
      projectLocation: c.project.location,
      methodology: c.project.methodology,
      vintageYear: c.vintageYear,
      owner: c.owner.name,
      transactions: c.transactions.map((t) => ({
        date: t.transferDate,
        amount: t.amount,
        from: t.from.name,
        to: t.to.name,
      })),
      retirement:
        c.retirements.length > 0
          ? {
              date: c.retirements[0].retirementDate,
              reason: c.retirements[0].reason,
              certificateNumber: c.retirements[0].certificateNumber,
            }
          : null,
    }));

    const activity = rawActivity.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      date: log.createdAt,
      actor: log.user.name,
      details: log.details,
    }));

    return NextResponse.json({
      credits: publicCredits,
      projects,
      activity,
      pagination: { 
        page, 
        limit, 
        total: totalBatches, 
        pages: Math.ceil(totalBatches / limit) 
      },
    });
  } catch (error: any) {
    console.error('Registry API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
