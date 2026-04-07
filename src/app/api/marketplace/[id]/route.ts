import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const txs = await prisma.transaction.aggregate({
      where: { batch: { projectId: project.id } },
      _sum: { amount: true }
    });
    const soldQty = txs._sum.amount || 0;
    const estQty = (project as any).estCredits || 0;

    // Mock it into a Listing shape for frontend compatibility
    const listing = {
      id: project.id,
      title: `${project.name} - Forward Funding`,
      description: project.description,
      pricePerCredit: "1250.00",
      currency: "INR",
      totalQuantity: estQty,
      availableQty: Math.max(0, estQty - soldQty),
      status: estQty - soldQty <= 0 ? "SOLD_OUT" : "ACTIVE",
      projectName: project.name,
      vintageYear: new Date(project.startDate).getFullYear(),
      methodology: project.methodology,
      createdAt: project.createdAt.toISOString(),
      seller: project.owner,
      _count: { purchaseRequests: 0 }
    };

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
