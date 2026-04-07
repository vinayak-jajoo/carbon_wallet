import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const buySchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
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

    const { id } = await params;
    const body = await request.json();
    const parsed = buySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { quantity, notes } = parsed.data;

    // The id passed from our custom Marketplace is the Project ID.
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId === user.userId) {
      return NextResponse.json({ error: 'Cannot buy from your own project' }, { status: 400 });
    }

    // Lazy load or generate actual MarketListing & CreditBatch for this project 
    // to strictly satisfy the relational schema for Forward Funding purchase requests
    let listing = await prisma.marketListing.findFirst({
      where: { batch: { projectId: id } }
    });

    if (!listing) {
      const estQ = (project as any).estCredits || 1000;
      
      const batch = await prisma.creditBatch.create({
        data: {
          projectId: id,
          ownerId: project.ownerId,
          vintageYear: new Date(project.startDate).getFullYear(),
          serialBlockStart: 'FWD-0001',
          serialBlockEnd: `FWD-${estQ}`,
          quantity: estQ,
          status: 'ACTIVE'
        }
      });

      listing = await prisma.marketListing.create({
        data: {
          batchId: batch.id,
          sellerId: project.ownerId,
          title: `${project.name} - Forward Funding`,
          description: project.description,
          pricePerTon: 15,
          minPurchaseQty: 1,
          status: 'ACTIVE'
        }
      });
    }

    const existing = await prisma.purchaseRequest.findFirst({
      where: {
        listingId: listing.id,
        buyerId: user.userId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending request for this listing' },
        { status: 400 }
      );
    }

    // Verify quantity capacity
    const currentBatch = await prisma.creditBatch.findUnique({ where: { id: listing.batchId }});
    if (!currentBatch || currentBatch.quantity < quantity) {
      return NextResponse.json(
        { error: `Requested quantity exceeds available batch supply (${currentBatch?.quantity || 0} left).` },
        { status: 400 }
      );
    }

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        listingId: listing.id,
        buyerId: user.userId,
        quantity,
        notes: notes || null,
      },
    });

    await logAudit({
      action: 'PURCHASE_REQUESTED' as any,
      entityType: 'PurchaseRequest',
      entityId: purchaseRequest.id,
      userId: user.userId,
      details: {
        listingId: listing.id,
        listingTitle: listing.title,
        quantity,
        sellerName: project.owner.name,
        totalPrice: Number(listing.pricePerTon) * quantity,
      },
    });

    return NextResponse.json({ purchaseRequest }, { status: 201 });
  } catch (error) {
    console.error('Buy request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
