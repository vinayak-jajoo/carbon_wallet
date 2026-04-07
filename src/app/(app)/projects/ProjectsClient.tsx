'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatusBadge, Toast, useToast } from '@/components/ui';
import { Plus, Search, FolderOpen, Link as LinkIcon, FileUp, FileText } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  methodology: string;
  location: string;
  status: string;
  estCredits: number;
  mrvReportUrl: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  _count: { monitoringReports: number; creditBatches: number };
}

const mockProjects: Project[] = [
  { id: 'mock-1', name: 'Renewable Solar Farm Project 1', description: 'Mock Project', methodology: 'ACM0002', location: 'Rajasthan, India', status: 'SUBMITTED', estCredits: 4000, mrvReportUrl: 'mock', createdAt: new Date().toISOString(), owner: { id: 'o1', name: 'GreenEnergy Co', email: '' }, _count: { monitoringReports: 1, creditBatches: 0 } },
  { id: 'mock-2', name: 'Renewable Solar Farm Project 2', description: 'Mock Project', methodology: 'ACM0002', location: 'Gujarat, India', status: 'SUBMITTED', estCredits: 8000, mrvReportUrl: 'mock', createdAt: new Date().toISOString(), owner: { id: 'o1', name: 'GreenEnergy Co', email: '' }, _count: { monitoringReports: 1, creditBatches: 0 } },
  { id: 'mock-3', name: 'Renewable Solar Farm Project 3', description: 'Mock Project', methodology: 'ACM0002', location: 'Karnataka, India', status: 'SUBMITTED', estCredits: 5500, mrvReportUrl: 'mock', createdAt: new Date().toISOString(), owner: { id: 'o1', name: 'GreenEnergy Co', email: '' }, _count: { monitoringReports: 1, creditBatches: 0 } }
];

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [viewedReports, setViewedReports] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/projects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (p: Project) => {
    if (!p.mrvReportUrl) return;
    if (p.mrvReportUrl.startsWith('data:')) {
      const arr = p.mrvReportUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } else if (p.mrvReportUrl === 'mock') {
      window.open('about:blank', '_blank');
    } else {
      window.open(p.mrvReportUrl, '_blank');
    }
    setViewedReports(prev => ({ ...prev, [p.id]: true }));
  };

  const handleVerify = async (id: string) => {
    if (id.startsWith('mock')) {
      showToast('Verified mock project!', 'success');
      return;
    }
    try {
      const res = await fetch(`/api/projects/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      if (res.ok) {
        showToast('Project Verified & Approved', 'success');
        fetchProjects();
      } else {
        showToast('Verification failed', 'error');
      }
    } catch (e) {
      showToast('Internal server error', 'error');
    }
  };

  useEffect(() => { 
    // Only fetch if initial mount has passed and filters change
    if (search || statusFilter) {
      setLoading(true);
      fetchProjects(); 
    } else {
      setProjects(initialProjects);
    }
  }, [search, statusFilter, initialProjects]);

  const displayProjects = projects.length === 0 && !search && !statusFilter ? mockProjects : projects;

  const handleCreate = async (formData: FormData) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        showToast('Project saved to database', 'success');
        setShowCreate(false);
        fetchProjects();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create project', 'error');
      }
    } catch (err) {
      showToast('Internal server error occurred', 'error');
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Projects" description="Manage carbon offset projects">
        {(user?.role === 'PROJECT_OWNER' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </PageHeader>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 180 }}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>
        ) : displayProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <FolderOpen size={48} color="#475569" style={{ marginBottom: 16 }} />
            <p style={{ color: '#ffffff' }}>No projects found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Methodology</th>
                <th>Location</th>
                <th>Status</th>
                <th>MRV Report</th>
                <th>Est. Credits</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayProjects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/projects/${p.id}`} style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}>
                      {p.name}
                    </Link>
                  </td>
                  <td style={{ color: '#ffffff' }}>{p.methodology}</td>
                  <td style={{ color: '#ffffff' }}>{p.location}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    {p.mrvReportUrl ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#22c55e', fontSize: 12, fontWeight: 600, backgroundColor: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        <FileText size={12}/> MRV Report Included
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>No Report Uploaded</span>
                    )}
                  </td>
                  <td style={{ color: '#ffffff' }}>{p.estCredits.toLocaleString()}</td>
                  <td style={{ color: '#ffffff' }}>{p.owner.name}</td>
                  <td>
                    {(user?.role === 'VERIFIER' || user?.role === 'ADMIN') && p.status === 'SUBMITTED' ? (
                       <div className="flex gap-2">
                         {!viewedReports[p.id] ? (
                           <button className="btn btn-secondary text-xs px-3 py-1.5" onClick={() => handleOpenReport(p)}>View MRV Report & Verify</button>
                         ) : (
                           <button className="btn btn-primary text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 border-none text-white font-bold" onClick={() => handleVerify(p.id)}>✓ Verify & Approve</button>
                         )}
                       </div>
                    ) : (
                       <Link href={`/projects/${p.id}`} className="text-blue-400 text-xs hover:underline">View Details</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: FormData) => void }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    registry: 'CCTS',
    methodology: '',
    location: '',
    startDate: '',
    endDate: '',
    estCredits: '',
  });
  const [mrvReportFile, setMrvReportFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('registry', form.registry);
    fd.append('methodology', form.methodology);
    fd.append('location', form.location);
    fd.append('startDate', form.startDate);
    fd.append('endDate', form.endDate);
    fd.append('estCredits', form.estCredits);
    
    if (mrvReportFile) {
      fd.append('mrvReportFile', mrvReportFile);
    }

    onCreate(fd);
  };

  return (
    <>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `}</style>
      <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Create New Project</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Project Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={10} rows={3} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Registry</label>
              <select
                value={form.registry}
                onChange={(e) => setForm({ ...form, registry: e.target.value })}
                required
                className="focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 transition-all text-white"
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', boxSizing: 'border-box' }}
              >
                <option value="CCTS">CCTS (India Compliance)</option>
                <option value="VERRA">VERRA (VCS)</option>
                <option value="GOLD_STANDARD">Gold Standard</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Methodology</label>
                <select
                  value={form.methodology}
                  onChange={(e) => setForm({ ...form, methodology: e.target.value })}
                  required
                  className="focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 transition-all text-slate-200"
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', boxSizing: 'border-box' }}
                >
                  <option value="" disabled>Select methodology...</option>
                  <optgroup label="CCTS (India Compliance)">
                    <option value="ACM0002">ACM0002: Grid-connected renewable electricity</option>
                    <option value="ACM0001">ACM0001: Flaring or use of landfill gas</option>
                  </optgroup>
                  <optgroup label="VERRA (VCS)">
                    <option value="VM0015">VM0015: Avoided Unplanned Deforestation</option>
                    <option value="AMS-I.D">AMS-I.D: Small-scale renewable electricity</option>
                  </optgroup>
                  <optgroup label="Gold Standard">
                    <option value="AR-ACM0003">AR-ACM0003: Afforestation & reforestation</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Location</label>
                <input 
                  type="text"
                  value={form.location} 
                  onChange={(e) => setForm({ ...form, location: e.target.value })} 
                  required 
                  placeholder="e.g. Bhadla, Rajasthan"
                  className="focus:ring-2 focus:ring-green-500 transition-all text-white"
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', boxSizing: 'border-box', color: '#ffffff' }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="date-input focus:ring-2 focus:ring-green-500 transition-all text-white" style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', boxSizing: 'border-box', color: '#ffffff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="date-input focus:ring-2 focus:ring-green-500 transition-all text-white" style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', boxSizing: 'border-box', color: '#ffffff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Est. Credits</label>
                <input type="number" value={form.estCredits} onChange={(e) => setForm({ ...form, estCredits: e.target.value })} required min={1} className="focus:ring-2 focus:ring-green-500 transition-all text-white" style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', boxSizing: 'border-box', color: '#ffffff' }} />
              </div>
            </div>

            {/* Proof of Impact & Compliance */}
            <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', marginBottom: 12 }}>Proof of Impact & Compliance</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>
                    <FileUp size={14} color="#ffffff" /> <span style={{ color: '#ffffff' }}>MRV Report Upload</span>
                  </label>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Upload your comprehensive MRV/Compliance Report (PDF/DOC). Ensure all required geotagged site photos are included within this document.</p>
                  
                  <div style={{ padding: '24px', border: '2px dashed #334155', borderRadius: '8px', textAlign: 'center', backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setMrvReportFile(e.target.files[0]);
                        }
                      }}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                      <FileUp size={28} color="#ffffff" style={{ marginBottom: 8 }} />
                      <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>
                        {mrvReportFile ? mrvReportFile.name : 'Click to upload MRV Report'}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Supports .pdf, .doc, .docx</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
