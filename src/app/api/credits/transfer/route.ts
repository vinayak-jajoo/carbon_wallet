import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const transferSchema = z.object({
  batchId: z.string(),
  quantity: z.number().int().positive(),
  toUserId: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = transferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { batchId, quantity, toUserId, notes } = parsed.data;

    // Verify target user exists
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (toUserId === user.userId) {
      return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 });
    }

    // Process transfers in transaction
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.creditBatch.findUnique({ where: { id: batchId } });

      if (!batch) {
        throw new Error(`Credit batch not found`);
      }

      if (batch.ownerId !== user.userId && user.role !== 'ADMIN') {
        throw new Error(`You do not own this credit batch`);
      }

      if (batch.status === 'RETIRED' || batch.status === 'CANCELLED') {
        throw new Error(`Batch is in an invalid state for transfer: ${batch.status}`);
      }

      if (batch.quantity < quantity) {
        throw new Error(`Insufficient credits. You only have ${batch.quantity}.`);
      }

      // Create transaction record
      const transfer = await tx.transaction.create({
        data: {
          batchId: batch.id,
          fromUserId: batch.ownerId,
          toUserId,
          amount: quantity,
          notes,
        },
      });

      if (batch.quantity === quantity) {
        // Full transfer
        await tx.creditBatch.update({
          where: { id: batchId },
          data: { ownerId: toUserId },
        });
      } else {
        // Partial transfer requires slicing the batch
        // 1. Reduce current batch
        await tx.creditBatch.update({
          where: { id: batchId },
          data: { quantity: batch.quantity - quantity },
        });

        // 2. Create new batch for target user
        await tx.creditBatch.create({
          data: {
            projectId: batch.projectId,
            monitoringReportId: undefined, // sliced batches lose unique tie
            ownerId: toUserId,
            status: 'ACTIVE',
            vintageYear: batch.vintageYear,
            serialBlockStart: batch.serialBlockStart, 
            serialBlockEnd: `${batch.serialBlockEnd}-T`, // Basic suffix tagging for slice
            quantity: quantity,
            issuedById: batch.issuedById,
          }
        });
      }

      return [transfer];
    });

    // Log each transfer
    for (const transfer of result) {
      await logAudit({
        action: 'CREDIT_TRANSFERRED',
        entityType: 'Credit',
        entityId: transfer.batchId,
        userId: user.userId,
        details: {
          fromUserId: user.userId,
          toUserId,
          toUserName: toUser.name,
          notes,
        },
      });
    }

    return NextResponse.json({
      transfers: result,
      count: result.length,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
