import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const retireSchema = z.object({
  batchId: z.string().min(1),
  quantity: z.number().int().positive(),
  reason: z.string().min(5),
  beneficiaryName: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = retireSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { batchId, quantity, reason, beneficiaryName } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.creditBatch.findUnique({ where: { id: batchId } });

      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      if (batch.ownerId !== user.userId && user.role !== 'ADMIN') {
        throw new Error('You do not own this batch');
      }

      if (batch.status !== 'ACTIVE') {
        throw new Error('Batch is not in ACTIVE status');
      }

      if (batch.quantity < quantity) {
        throw new Error('Insufficient credits in batch');
      }

      const certificateNumber = `RET-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

      const retirement = await tx.retirement.create({
        data: {
          batchId,
          retiredById: user.userId,
          quantity,
          reason,
          beneficiaryName,
          certificateNumber,
        },
      });

      if (batch.quantity === quantity) {
        await tx.creditBatch.update({
          where: { id: batchId },
          data: { status: 'RETIRED' },
        });
      } else {
        await tx.creditBatch.update({
          where: { id: batchId },
          data: { quantity: batch.quantity - quantity },
        });
      }

      return retirement;
    });

    await logAudit({
      action: 'CREDIT_RETIRED',
      entityType: 'CreditBatch',
      entityId: batchId,
      userId: user.userId,
      details: { reason, beneficiaryName, quantity, certificateNumber: result.certificateNumber },
    });

    return NextResponse.json({
      retirement: result,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
