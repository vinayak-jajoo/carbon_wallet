import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import ProjectsClient from './ProjectsClient';

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null; // Route is protected anyway
  }

  const where: any = {};
  if (user.role === 'PROJECT_OWNER') {
    where.ownerId = user.userId;
  }

  const dbProjects = await prisma.project.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { monitoringReports: true, creditBatches: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <ProjectsClient initialProjects={dbProjects as any} />;
}
