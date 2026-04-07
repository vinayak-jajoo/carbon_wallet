import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === 'ADMIN';

    const [
      totalProjects,
      approvedProjects,
      totalCredits,
      activeCredits,
      retiredCredits,
      totalTransfers,
      unresolvedAnomalies,
      recentAuditLogs,
      projectsByStatus,
      creditsByMonth,
      userCount,
      pendingVerifications,
      activeRequests,
      verifierPendingProjects,
    ] = await Promise.all([
      prisma.project.count(isAdmin ? undefined : { where: { ownerId: user.userId } }),
      prisma.project.count({ where: isAdmin ? { status: 'APPROVED' } : { ownerId: user.userId, status: 'APPROVED' } }),
      prisma.creditBatch.aggregate({ where: isAdmin ? undefined : { project: { ownerId: user.userId } }, _sum: { quantity: true } }),
      prisma.creditBatch.aggregate({ where: isAdmin ? { status: 'ACTIVE' } : { ownerId: user.userId, status: 'ACTIVE' }, _sum: { quantity: true } }),
      prisma.creditBatch.aggregate({ where: isAdmin ? { status: 'RETIRED' } : { ownerId: user.userId, status: 'RETIRED' }, _sum: { quantity: true } }),
      prisma.transaction.count({
        where: isAdmin ? undefined : { OR: [{ fromUserId: user.userId }, { toUserId: user.userId }] }
      }),
      prisma.anomalyFlag.count({ where: { resolved: false } }),
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.project.groupBy({
        by: ['status'],
        _count: true,
        ...(isAdmin ? {} : { where: { ownerId: user.userId } }),
      }),
      prisma.creditBatch.findMany({
        where: isAdmin ? undefined : { ownerId: user.userId },
        select: { issuedAt: true, quantity: true },
        orderBy: { issuedAt: 'asc' },
      }),
      prisma.user.count(),
      prisma.project.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.purchaseRequest.count({ where: { buyerId: user.userId, status: 'PENDING' } }),
      prisma.project.findMany({ 
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const monthlyCredits: Record<string, number> = {};
    for (const batch of creditsByMonth) {
      const month = batch.issuedAt.toISOString().substring(0, 7);
      monthlyCredits[month] = (monthlyCredits[month] || 0) + batch.quantity;
    }

    return NextResponse.json({
      stats: {
        totalProjects,
        approvedProjects,
        totalCredits: totalCredits._sum.quantity || 0,
        activeCredits: activeCredits._sum.quantity || 0,
        retiredCredits: retiredCredits._sum.quantity || 0,
        totalTransfers,
        unresolvedAnomalies,
        userCount,
        pendingVerifications,
        activeRequests,
      },
      projectsByStatus: projectsByStatus.map((p) => ({
        status: p.status,
        count: p._count,
      })),
      creditsByMonth: Object.entries(monthlyCredits).map(([month, count]) => ({
        month,
        credits: count,
      })),
      recentActivity: recentAuditLogs,
      verifierPendingProjects,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
