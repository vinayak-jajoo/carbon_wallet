import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - List purchase requests (for seller: incoming requests, for buyer: their requests)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'incoming'; // 'incoming' or 'outgoing'

    const where: Record<string, unknown> = {};

    if (type === 'incoming') {
      // Seller's incoming requests
      where.listing = { sellerId: user.userId };
    } else {
      // Buyer's outgoing requests
      where.buyerId = user.userId;
    }

    if (user.role === 'ADMIN') {
      // Admin sees all
      delete where.listing;
      delete where.buyerId;
    }

    const requests = await prisma.purchaseRequest.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            pricePerTon: true,
            currency: true,
            seller: { select: { id: true, name: true } },
          },
        },
        buyer: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('List requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
