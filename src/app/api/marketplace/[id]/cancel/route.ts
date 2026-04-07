import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

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

    const listing = await prisma.marketListing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.sellerId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 });
    }

    await prisma.$transaction(async (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Cancel listing
      await tx.marketListing.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Status recovery for the credit batch
      await tx.creditBatch.update({
        where: { id: listing.batchId },
        data: { status: 'ACTIVE' },
      });

      // Cancel any pending requests
      await tx.purchaseRequest.updateMany({
        where: { listingId: id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
    });

    await logAudit({
      action: 'LISTING_CANCELLED',
      entityType: 'MarketListing',
      entityId: id,
      userId: user.userId,
      details: { title: listing.title },
    });

    return NextResponse.json({ message: 'Listing cancelled' });
  } catch (error) {
    console.error('Cancel listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
