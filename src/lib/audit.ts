import { prisma } from './db';
import { AuditAction } from '@prisma/client';

export async function logAudit(params: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      details: (params.details || {}) as Record<string, string | number | boolean>,
      ipAddress: params.ipAddress || null,
    },
  });
}
