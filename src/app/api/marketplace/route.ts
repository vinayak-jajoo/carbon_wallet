import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const listingSchema = z.object({
  creditIds: z.array(z.string()).min(1, 'Select at least 1 credit'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  pricePerCredit: z.number().positive('Price must be positive'),
  currency: z.string().default('INR'),
});

// GET - List all active marketplace listings (Forward Funding / Approved Projects)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const mine = searchParams.get('mine') === 'true';

    const where: any = { status: 'APPROVED' };

    if (mine) {
      where.ownerId = user.userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const listings = await Promise.all(projects.map(async p => {
      const estQty = (p as any).estCredits || 0;
      
      // Calculate how many credits have already been transacted for this forward-funding project
      const txs = await prisma.transaction.aggregate({
        where: { batch: { projectId: p.id } },
        _sum: { amount: true }
      });
      const soldQty = txs._sum.amount || 0;

      return {
        id: p.id,
        title: `${p.name} - Forward Funding`,
        description: p.description,
        pricePerCredit: "1250.00",
        currency: "INR",
        totalQuantity: estQty,
        availableQty: Math.max(0, estQty - soldQty),
        status: estQty - soldQty <= 0 ? "SOLD_OUT" : "ACTIVE",
        projectName: p.name,
        vintageYear: new Date(p.startDate).getFullYear(),
        methodology: p.methodology,
        createdAt: p.createdAt.toISOString(),
        seller: p.owner,
        _count: { purchaseRequests: 0 }
      };
    }));

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Marketplace list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new listing
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'PROJECT_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Only credit owners can create listings' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Direct manual listing is disabled. Approved projects are automatically listed.' }, { status: 400 });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
