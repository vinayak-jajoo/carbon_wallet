import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNotes: z.string().optional(),
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
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, reviewNotes } = parsed.data;

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            batch: true,
          },
        },
        buyer: true,
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 });
    }

    if (purchaseRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    // Only the listing seller or admin can review
    if (purchaseRequest.listing.sellerId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to review this request' }, { status: 403 });
    }

    if (action === 'reject') {
      await prisma.purchaseRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewNotes: reviewNotes || null,
        },
      });

      // Avoid TS strict AuditAction type issues
      const actionType: any = 'PURCHASE_REJECTED';
      await logAudit({
        action: actionType,
        entityType: 'PurchaseRequest',
        entityId: id,
        userId: user.userId,
        details: {
          buyerName: purchaseRequest.buyer.name,
          quantity: purchaseRequest.quantity,
          reviewNotes,
        },
      });

      return NextResponse.json({ message: 'Purchase request rejected' });
    }

    // APPROVE: issue a transaction of credits to buyer
    const batchQty = purchaseRequest.listing.batch?.quantity || 1000;
    if (batchQty < purchaseRequest.quantity) {
      return NextResponse.json(
        { error: `Only ${batchQty} credits available in forward funding block, but ${purchaseRequest.quantity} requested.` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Approve the request
      await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewNotes: reviewNotes || null,
        },
      });

      // 1. Deduct volume from the Seller's parent batch
      const parentBatch = await tx.creditBatch.update({
        where: { id: purchaseRequest.listing.batchId },
        data: { quantity: { decrement: purchaseRequest.quantity } },
      });

      // 1.5 Evaluate whether listing should be closed
      if (parentBatch.quantity <= 0 || parentBatch.quantity < purchaseRequest.listing.minPurchaseQty) {
         await tx.marketListing.update({
            where: { id: purchaseRequest.listing.id },
            data: { status: 'FULFILLED' }
         });
      }

      // 2. Clone a dedicated sub-batch for the Buyer
      const splitHash = Date.now().toString().slice(-5);
      const buyerBatch = await tx.creditBatch.create({
        data: {
          projectId: parentBatch.projectId,
          ownerId: purchaseRequest.buyerId, // The buyer
          vintageYear: parentBatch.vintageYear,
          serialBlockStart: `${parentBatch.serialBlockStart}-T${splitHash}`,
          serialBlockEnd: `${parentBatch.serialBlockStart}-T${splitHash}X`,
          quantity: purchaseRequest.quantity,
          status: 'ACTIVE',
          issuedById: parentBatch.issuedById,
        },
      });

      // 3. Issue the structural Ledger Transaction settling them
      await tx.transaction.create({
        data: {
          batchId: buyerBatch.id, // Record tied to the newly carved batch
          fromUserId: purchaseRequest.listing.sellerId,
          toUserId: purchaseRequest.buyerId,
          amount: purchaseRequest.quantity,
          priceAmount: purchaseRequest.listing.pricePerTon,
          currency: purchaseRequest.listing.currency,
          notes: `Marketplace forward-funding settlement loop. Listing Ref: ${purchaseRequest.listing.title}`,
        },
      });
    });

    const actionType: any = 'PURCHASE_APPROVED';
    await logAudit({
      action: actionType,
      entityType: 'PurchaseRequest',
      entityId: id,
      userId: user.userId,
      details: {
        buyerName: purchaseRequest.buyer.name,
        quantity: purchaseRequest.quantity,
        totalPrice: Number(purchaseRequest.listing.pricePerTon) * purchaseRequest.quantity,
      },
    });

    return NextResponse.json({
      message: `Approved! ${purchaseRequest.quantity} credits transferred to ${purchaseRequest.buyer.name}`,
    });
  } catch (error) {
    console.error('Review request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
