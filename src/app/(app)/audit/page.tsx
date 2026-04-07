'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui';
import { 
  ClipboardList, 
  Filter
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
  user: { name: string; role: string };
}

const ACTION_ICONS: Record<string, { color: string }> = {
  LOGIN: { color: '#3b82f6' },
  PROJECT_CREATED: { color: '#22c55e' },
  PROJECT_SUBMITTED: { color: '#f59e0b' },
  PROJECT_APPROVED: { color: '#22c55e' },
  PROJECT_REJECTED: { color: '#ef4444' },
  REPORT_CREATED: { color: '#3b82f6' },
  REPORT_VERIFIED: { color: '#22c55e' },
  REPORT_REJECTED: { color: '#ef4444' },
  CREDITS_ISSUED: { color: '#22c55e' },
  CREDIT_TRANSFERRED: { color: '#a855f7' },
  CREDIT_RETIRED: { color: '#f59e0b' },
  CREDIT_CANCELLED: { color: '#ef4444' },
  ANOMALY_FLAGGED: { color: '#ef4444' },
  ANOMALY_RESOLVED: { color: '#22c55e' },
  PURCHASE_REQUESTED: { color: '#3b82f6' },
  PURCHASE_APPROVED: { color: '#22c55e' },
  PURCHASE_REJECTED: { color: '#ef4444' },
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    const params = new URLSearchParams({ page: String(p), limit: '30' });
    if (actionFilter) params.set('action', actionFilter);
    const res = await fetch(`/api/audit?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotalPages(data.pagination?.pages || 1);
    setPage(p);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [actionFilter]);

  const formatAction = (action: string) => action.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

  return (
    <div>
      <PageHeader title="Audit Log" description="Complete history of all system actions" />

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ width: 220 }}>
          <option value="">All Actions</option>
          {Object.keys(ACTION_ICONS).map((action) => (
            <option key={action} value={action}>{formatAction(action)}</option>
          ))}
        </select>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <ClipboardList size={48} color="#475569" style={{ marginBottom: 16 }} />
            <p style={{ color: '#64748b' }}>No audit entries found</p>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 40 }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: 15,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'linear-gradient(to bottom, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.05))',
            }} />

            {logs.map((log, i) => {
              const cfg = ACTION_ICONS[log.action] || { color: '#0ea5e9' };
              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    gap: 16,
                    paddingBottom: 24,
                    position: 'relative',
                    animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                  }}
                >
                  {/* Dot */}
                  <div style={{
                    position: 'absolute',
                    left: -32,
                    top: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: `${cfg.color}25`,
                    border: `2px solid ${cfg.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                  }} />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{formatAction(log.action)}</span>
                      <span style={{ color: '#475569', fontSize: 12 }}>•</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{log.entityType}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                      by <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{log.user.name}</span>
                      <span style={{ color: '#475569' }}> ({log.user.role})</span>
                    </div>
                    {Object.keys(log.details as object).length > 0 && (
                      <div style={{
                        fontSize: 12,
                        color: '#64748b',
                        background: 'rgba(148, 163, 184, 0.05)',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontFamily: 'monospace',
                        marginTop: 4,
                      }}>
                        {Object.entries(log.details as Record<string, unknown>).map(([k, v]) => (
                          <span key={k} style={{ marginRight: 12 }}>{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap', paddingTop: 2 }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 16 }}>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
              <button key={i} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => fetchLogs(i + 1)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
