import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { scanForAnomalies } from '@/lib/anomaly-scanner';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'VERIFIER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const anomalies = await scanForAnomalies();

    return NextResponse.json({
      anomalies,
      count: anomalies.length,
      message: `Scan complete. Found ${anomalies.length} potential issues.`,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
