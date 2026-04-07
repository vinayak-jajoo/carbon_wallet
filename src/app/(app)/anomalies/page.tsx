'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, SeverityBadge, Toast, useToast } from '@/components/ui';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

interface Anomaly {
  id: string;
  type: string;
  severity: string;
  description: string;
  entityType: string;
  entityId: string;
  resolved: boolean;
  resolvedBy: { name: string } | null;
  resolvedAt: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  DUPLICATE_PROJECT_NAME: 'Duplicate Project Name',
  HIGH_CREDIT_ISSUANCE: 'High Credit Issuance',
  MISSING_MRV_DATA: 'Missing MRV Data',
  REPEATED_SUBMISSIONS: 'Repeated Submissions',
  PERIOD_REUSE: 'Period Reuse',
  RAPID_TRANSFER: 'Rapid Transfer',
};

export default function AnomaliesPage() {
  const { user } = useAuth();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchAnomalies = async () => {
    const params = new URLSearchParams();
    if (!showResolved) params.set('resolved', 'false');
    const res = await fetch(`/api/anomalies?${params}`);
    const data = await res.json();
    setAnomalies(data.anomalies || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnomalies(); }, [showResolved]);

  const handleScan = async () => {
    setScanning(true);
    const res = await fetch('/api/anomalies/scan', { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Scan complete');
    setScanning(false);
    fetchAnomalies();
  };

  const handleResolve = async (id: string) => {
    const res = await fetch(`/api/anomalies/${id}/resolve`, { method: 'POST' });
    if (res.ok) {
      showToast('Anomaly resolved');
      fetchAnomalies();
    } else {
      showToast('Failed to resolve', 'error');
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Anomaly Flags" description="AI-detected suspicious records and patterns">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show Resolved
        </label>
        {(user?.role === 'ADMIN' || user?.role === 'VERIFIER') && (
          <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
            <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Run Scan'}
          </button>
        )}
      </PageHeader>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>
        ) : anomalies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
            <p style={{ color: '#64748b' }}>No anomaly flags found. System looks healthy!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Entity</th>
                <th>Detected</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={14} color={a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'HIGH' ? '#f59e0b' : '#64748b'} />
                      {TYPE_LABELS[a.type] || a.type}
                    </div>
                  </td>
                  <td><SeverityBadge severity={a.severity} /></td>
                  <td style={{ color: '#94a3b8', fontSize: 13, maxWidth: 300 }}>{a.description}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{a.entityType}<br /><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.entityId.slice(0, 12)}...</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>
                    {a.resolved ? (
                      <span className="badge badge-green">Resolved</span>
                    ) : (
                      <span className="badge badge-red">Active</span>
                    )}
                  </td>
                  <td>
                    {!a.resolved && (user?.role === 'ADMIN' || user?.role === 'VERIFIER') && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleResolve(a.id)}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
