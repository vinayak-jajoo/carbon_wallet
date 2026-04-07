import { prisma } from './db';
import { AnomalyType, Severity } from '@prisma/client';

interface AnomalyResult {
  type: AnomalyType;
  severity: Severity;
  description: string;
  entityType: string;
  entityId: string;
}

export async function scanForAnomalies(): Promise<AnomalyResult[]> {
  const anomalies: AnomalyResult[] = [];

  // 1. Duplicate project names
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
  });
  const nameMap = new Map<string, string[]>();
  for (const p of projects) {
    const normalized = p.name.toLowerCase().trim();
    if (!nameMap.has(normalized)) nameMap.set(normalized, []);
    nameMap.get(normalized)!.push(p.id);
  }
  for (const [name, ids] of nameMap) {
    if (ids.length > 1) {
      for (const id of ids) {
        anomalies.push({
          type: 'DUPLICATE_PROJECT_NAME',
          severity: 'MEDIUM',
          description: `Project has duplicate name "${name}" (${ids.length} projects share this name)`,
          entityType: 'Project',
          entityId: id,
        });
      }
    }
  }

  // 2. High credit issuance (> 2x estimated)
  const batches = await prisma.creditBatch.findMany({
    include: { project: true },
  });
  for (const batch of batches) {
    if (batch.quantity > batch.project.estCredits * 2) {
      anomalies.push({
        type: 'HIGH_CREDIT_ISSUANCE',
        severity: 'HIGH',
        description: `Credit batch issued ${batch.quantity} credits, which is more than 2x the project estimate of ${batch.project.estCredits}`,
        entityType: 'CreditBatch',
        entityId: batch.id,
      });
    }
  }

  // 3. Missing MRV data (approved projects with no reports)
  const approvedProjects = await prisma.project.findMany({
    where: { status: 'APPROVED' },
    include: { monitoringReports: true },
  });
  for (const project of approvedProjects) {
    if (project.monitoringReports.length === 0) {
      anomalies.push({
        type: 'MISSING_MRV_DATA',
        severity: 'MEDIUM',
        description: `Approved project "${project.name}" has no monitoring reports`,
        entityType: 'Project',
        entityId: project.id,
      });
    }
  }

  // 4. Repeated submissions (> 3 times)
  const repeatedProjects = await prisma.project.findMany({
    where: { submissionCount: { gt: 3 } },
  });
  for (const project of repeatedProjects) {
    anomalies.push({
      type: 'REPEATED_SUBMISSIONS',
      severity: 'LOW',
      description: `Project "${project.name}" has been submitted ${project.submissionCount} times`,
      entityType: 'Project',
      entityId: project.id,
    });
  }

  // 5. Period reuse — credits issued for overlapping monitoring periods
  const reportsByProject = await prisma.monitoringReport.findMany({
    where: { creditBatch: { isNot: null } },
    include: { creditBatch: true },
    orderBy: { periodStart: 'asc' },
  });
  const projectPeriods = new Map<string, typeof reportsByProject>();
  for (const report of reportsByProject) {
    if (!projectPeriods.has(report.projectId)) {
      projectPeriods.set(report.projectId, []);
    }
    projectPeriods.get(report.projectId)!.push(report);
  }
  for (const [, reports] of projectPeriods) {
    for (let i = 0; i < reports.length; i++) {
      for (let j = i + 1; j < reports.length; j++) {
        if (reports[i].periodEnd > reports[j].periodStart) {
          anomalies.push({
            type: 'PERIOD_REUSE',
            severity: 'CRITICAL',
            description: `Overlapping monitoring periods detected: ${reports[i].periodStart.toISOString().split('T')[0]} - ${reports[i].periodEnd.toISOString().split('T')[0]} overlaps with ${reports[j].periodStart.toISOString().split('T')[0]} - ${reports[j].periodEnd.toISOString().split('T')[0]}`,
            entityType: 'MonitoringReport',
            entityId: reports[j].id,
          });
        }
      }
    }
  }

  // 6. Rapid transfers (within 5 minutes of issuance)
  const recentTransfers = await prisma.transaction.findMany({
    include: { batch: true },
  });
  for (const transfer of recentTransfers) {
    const issuedAt = transfer.batch.issuedAt;
    const diff = transfer.transferDate.getTime() - issuedAt.getTime();
    if (diff < 5 * 60 * 1000) {
      anomalies.push({
        type: 'RAPID_TRANSFER',
        severity: 'HIGH',
        description: `Credit transfer occurred within ${Math.round(diff / 1000)} seconds of issuance`,
        entityType: 'Transaction',
        entityId: transfer.id,
      });
    }
  }

  // Store new anomalies (avoid duplicates)
  for (const anomaly of anomalies) {
    const existing = await prisma.anomalyFlag.findFirst({
      where: {
        type: anomaly.type,
        entityType: anomaly.entityType,
        entityId: anomaly.entityId,
        resolved: false,
      },
    });
    if (!existing) {
      await prisma.anomalyFlag.create({
        data: anomaly,
      });
    }
  }

  return anomalies;
}
