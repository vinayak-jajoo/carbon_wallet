'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatusBadge, Modal, Toast, useToast } from '@/components/ui';
import { ArrowLeft, Send, CheckCircle, XCircle, Plus, FileText, Coins, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  emissionsReduced: string;
  status: string;
  verifier: { id: string; name: string } | null;
  verifiedAt: string | null;
  notes: string | null;
  creditBatch: { id: string; quantity: number } | null;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  methodology: string;
  location: string;
  status: string;
  estCredits: number;
  mrvReportUrl: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  monitoringReports: Report[];
  creditBatches: Array<{ id: string; serialBlockStart: string; serialBlockEnd: string; quantity: number; vintageYear: number; issuedAt: string; issuedBy: { name: string } | null }>;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<'approve' | 'reject' | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [docsReviewed, setDocsReviewed] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleViewReport = () => {
    if (!project?.mrvReportUrl) return;
    if (project.mrvReportUrl.startsWith('data:')) {
      const arr = project.mrvReportUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
      // setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      window.open(project.mrvReportUrl, '_blank');
    }
  };

  const handleSubmit = async () => {
    const res = await fetch(`/api/projects/${id}/submit`, { method: 'POST' });
    if (res.ok) {
      showToast('Project submitted for review');
      setShowSubmitModal(false);
      fetchProject();
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Project deleted successfully', 'success');
      window.location.href = '/projects';
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to delete project', 'error');
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    const res = await fetch(`/api/projects/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      showToast(`Project ${action === 'approve' ? 'approved' : 'rejected'}`);
      setShowReviewModal(null);
      fetchProject();
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  const handleVerifyReport = async (reportId: string, action: 'verify' | 'reject') => {
    const res = await fetch(`/api/reports/${reportId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      showToast(`Report ${action === 'verify' ? 'verified' : 'rejected'}`);
      fetchProject();
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  const handleCreateReport = async (formData: { periodStart: string; periodEnd: string; emissionsReduced: number; notes: string }) => {
    const res = await fetch(`/api/projects/${id}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      showToast('MRV report created');
      setShowReportForm(false);
      fetchProject();
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  const handleIssueCredits = async (reportId: string, quantity: number) => {
    const res = await fetch('/api/credits/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monitoringReportId: reportId,
        quantity,
        vintageYear: new Date().getFullYear(),
      }),
    });
    if (res.ok) {
      showToast('Credits issued successfully');
      fetchProject();
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>;
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
        <h2 style={{ fontSize: 24, color: '#f8fafc', marginBottom: 12 }}>Project Not Found</h2>
        <p>Could not load project details or the project does not exist.</p>
        <Link href="/projects" className="btn btn-secondary" style={{ marginTop: 24, display: 'inline-block' }}>Return to Projects</Link>
      </div>
    );
  }

  const canSubmit = (project.status === 'DRAFT' || project.status === 'REJECTED') && 
    (user?.userId === project.owner.id || user?.role === 'ADMIN');
  const canReview = (project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW') &&
    (user?.role === 'VERIFIER' || user?.role === 'ADMIN');

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title={project.name} description={project.description}>
        <Link href="/projects" className="btn btn-secondary"><ArrowLeft size={16} /> Back</Link>
        {canSubmit && (
          <button className="btn btn-primary" onClick={() => setShowSubmitModal(true)}>
            <Send size={16} /> Submit for Review
          </button>
        )}
        {(user?.userId === project.owner.id || user?.role === 'ADMIN') && (
          <button className="btn btn-danger" onClick={handleDeleteProject} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}>
             <Trash2 size={16} /> Delete Project
          </button>
        )}
        {canReview && (
          <>
            <button 
              className={`btn ${!project.mrvReportUrl || !docsReviewed ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={() => setShowReviewModal('approve')}
              disabled={!project.mrvReportUrl || !docsReviewed}
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button className="btn btn-danger" onClick={() => setShowReviewModal('reject')}>
              <XCircle size={16} /> Reject
            </button>
          </>
        )}
      </PageHeader>

      {/* Project Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Project Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Status', <StatusBadge key="s" status={project.status} />],
              ['Methodology', project.methodology],
              ['Location', project.location],
              ['Start Date', new Date(project.startDate).toLocaleDateString()],
              ['End Date', new Date(project.endDate).toLocaleDateString()],
              ['Estimated Credits', project.estCredits.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Owner Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Name</span>
              <span style={{ fontWeight: 500 }}>{project.owner.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Email</span>
              <span style={{ fontWeight: 500 }}>{project.owner.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Created</span>
              <span style={{ fontWeight: 500 }}>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Document Preview Area spanning full width */}
        <div className="glass-card" style={{ padding: '0', gridColumn: '1 / -1', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#4ade80" /> MRV Compliance Report
              </h3>
              {project.mrvReportUrl && (
                <button 
                  onClick={handleViewReport}
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                   Open Full Screen
                </button>
              )}
            </div>
            
            <div style={{ width: '100%', height: '500px', background: '#1e293b' }}>
              {!project.mrvReportUrl ? (
                 <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                    <FileText size={48} color="#475569" />
                    <p style={{ color: '#94a3b8' }}>No compliance document uploaded for this project.</p>
                 </div>
              ) : project.mrvReportUrl.startsWith('data:') ? (
                 <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                    <FileText size={48} color="#64748b" />
                    <p style={{ color: '#94a3b8' }}>Legacy document format requires opening in a new tab.</p>
                    <button onClick={handleViewReport} className="btn btn-primary">Open Legacy Document</button>
                 </div>
              ) : project.mrvReportUrl.toLowerCase().endsWith('.pdf') ? (
                 <iframe 
                   src={project.mrvReportUrl} 
                   style={{ width: '100%', height: '100%', border: 'none' }}
                   title="MRV Document"
                 />
              ) : (
                 <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                    <FileText size={48} color="#64748b" />
                    <p style={{ color: '#94a3b8' }}>Document is formatted as a Word '.doc'. Native browser inline previews are restricted.</p>
                    <button onClick={handleViewReport} className="btn btn-primary bg-blue-600 hover:bg-blue-500 border-none">Download to View Document</button>
                 </div>
              )}
            </div>
        </div>

        {/* Verification Check Area for VVB */}
        {canReview && (
          <div className="glass-card" style={{ padding: 24, gridColumn: '1 / -1', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#ffffff' }}>Due Diligence (Mandatory)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                 {project.mrvReportUrl ? <CheckCircle size={16} color="#ffffff" /> : <XCircle size={16} color="#ffffff" />}
                 <span style={{ fontSize: 14, color: '#ffffff' }}>
                   Compliance Report & Documentation
                   {!project.mrvReportUrl && (
                     <span style={{ marginLeft: 12, backgroundColor: '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Awaiting Documentation</span>
                   )}
                 </span>
               </div>
               
               {project.mrvReportUrl && (
                 <div style={{ marginTop: 8 }}>
                   <button 
                     onClick={handleViewReport}
                     className="btn btn-secondary" 
                     style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', color: '#ffffff', border: '1px solid #ffffff' }}
                   >
                     <FileText size={16} color="#ffffff" />
                     View MRV Report
                   </button>
                 </div>
               )}

               <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: (!project.mrvReportUrl) ? 'not-allowed' : 'pointer' }}>
                 <input 
                    type="checkbox" 
                    checked={docsReviewed} 
                    onChange={(e) => setDocsReviewed(e.target.checked)} 
                    disabled={!project.mrvReportUrl}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                 />
                 <span style={{ fontSize: 14, color: '#ffffff' }}>I have reviewed the compliance report and verified the physical site constraints.</span>
               </label>
            </div>
          </div>
        )}
      </div>

      {/* Monitoring Reports */}
      {!project.mrvReportUrl && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="#3b82f6" /> Monitoring Reports
            </h3>
            {project.status === 'APPROVED' && (user?.role === 'PROJECT_OWNER' || user?.role === 'ADMIN') && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowReportForm(true)}>
                <Plus size={14} /> Add Report
              </button>
            )}
          </div>

          {project.monitoringReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No monitoring reports yet</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Emissions Reduced</th>
                  <th>Status</th>
                  <th>Verifier</th>
                  <th>Credits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.monitoringReports.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 13 }}>
                      {new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}
                    </td>
                    <td>{parseFloat(r.emissionsReduced).toLocaleString()} tCO₂e</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ color: '#94a3b8' }}>{r.verifier?.name || '—'}</td>
                    <td>{r.creditBatch ? `${r.creditBatch.quantity} issued` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {r.status === 'SUBMITTED' && (user?.role === 'VERIFIER' || user?.role === 'ADMIN') && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleVerifyReport(r.id, 'verify')}>Verify</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleVerifyReport(r.id, 'reject')}>Reject</button>
                          </>
                        )}
                        {r.status === 'VERIFIED' && !r.creditBatch && user?.role === 'ADMIN' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleIssueCredits(r.id, Math.floor(parseFloat(r.emissionsReduced)))}
                          >
                            <Coins size={14} /> Issue Credits
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Credit Batches */}
      {project.creditBatches.length > 0 && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Coins size={18} color="#22c55e" /> Credit Batches
          </h3>
          <table>
            <thead>
              <tr>
                <th>Serial Block</th>
                <th>Quantity</th>
                <th>Vintage Year</th>
                <th>Issued By</th>
                <th>Issued At</th>
              </tr>
            </thead>
            <tbody>
              {project.creditBatches.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', color: '#4ade80' }}>{b.serialBlockStart}</td>
                  <td>{b.quantity}</td>
                  <td>{b.vintageYear}</td>
                  <td style={{ color: '#94a3b8' }}>{b.issuedBy?.name || 'System / Forward Funded'}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{new Date(b.issuedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showSubmitModal && (
        <Modal
          title="Submit Project"
          message="Submit this project for review? A verifier will review your project and supporting documents."
          confirmLabel="Submit"
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmitModal(false)}
        />
      )}
      {showReviewModal && (
        <Modal
          title={showReviewModal === 'approve' ? 'Approve Project' : 'Reject Project'}
          message={showReviewModal === 'approve' ? 'Approve this project? This will allow the owner to upload monitoring reports.' : 'Reject this project? The owner can make changes and resubmit.'}
          confirmLabel={showReviewModal === 'approve' ? 'Approve' : 'Reject'}
          type={showReviewModal === 'reject' ? 'danger' : 'primary'}
          onConfirm={() => handleReview(showReviewModal!)}
          onCancel={() => setShowReviewModal(null)}
        />
      )}
      {showReportForm && <ReportFormModal onClose={() => setShowReportForm(false)} onCreate={handleCreateReport} />}
    </div>
  );
}

function ReportFormModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: { periodStart: string; periodEnd: string; emissionsReduced: number; notes: string }) => void }) {
  const [form, setForm] = useState({ periodStart: '', periodEnd: '', emissionsReduced: '', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      emissionsReduced: parseFloat(form.emissionsReduced),
      notes: form.notes,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Add Monitoring Report</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Period Start</label>
                <input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Period End</label>
                <input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Emissions Reduced (tCO₂e)</label>
              <input type="number" step="0.01" value={form.emissionsReduced} onChange={(e) => setForm({ ...form, emissionsReduced: e.target.value })} required min={0.01} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Report</button>
          </div>
        </form>
      </div>
    </div>
  );
}
