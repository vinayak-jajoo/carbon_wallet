'use client';

import { useState, useEffect } from 'react';
import { PageHeader, StatusBadge } from '@/components/ui';
import { Search, Globe, FileText, Activity, Layers, ActivitySquare, ShoppingCart, Info } from 'lucide-react';
import Link from 'next/link';

interface PublicCredit {
  serialNumber: string;
  status: string;
  projectName: string;
  projectLocation: string;
  methodology: string;
  vintageYear: number;
  quantity: number;
  owner: string;
  transactions: {
    date: string;
    amount: number;
    from: string;
    to: string;
  }[];
  retirement: {
    date: string;
    reason: string;
    certificateNumber: string;
  } | null;
}

interface PublicProject {
  id: string;
  name: string;
  location: string;
  methodology: string;
  status: string;
  estCredits: number;
  createdAt: string;
  owner: { name: string };
}

interface PublicActivity {
  id: string;
  action: string;
  entityType: string;
  date: string;
  actor: string;
  details: any;
}

export default function RegistryPage() {
  const [activeTab, setActiveTab] = useState<'activity' | 'projects' | 'credits'>('activity');
  const [credits, setCredits] = useState<PublicCredit[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [activity, setActivity] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/registry?${params}`);
    const data = await res.json();
    setCredits(data.credits || []);
    setProjects(data.projects || []);
    setActivity(data.activity || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search, statusFilter]);

  const formatAction = (action: string) => {
    return action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div>
      <PageHeader title="Public Registry" description="Live market overview and public carbon credit registry">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 13 }}>
          <Globe size={16} />
          Publicly Accessible
        </div>
      </PageHeader>

      {/* Buyer Access Notice */}
      <div style={{ background: 'linear-gradient(to right, rgba(56, 189, 248, 0.1), rgba(59, 130, 246, 0.1))', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '16px 20px', borderRadius: 8, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <ShoppingCart color="#38bdf8" />
        <div>
          <h4 style={{ color: '#bae6fd', fontWeight: 600, fontSize: 15, margin: 0 }}>Looking to trade on the Carbon Wallet?</h4>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0 0' }}>To purchase credits or access the full marketplace, you must register and authenticate with a Buyer role account.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #334155' }}>
        <button 
          onClick={() => setActiveTab('activity')}
          style={{ padding: '12px 20px', borderBottom: activeTab === 'activity' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'activity' ? '#60a5fa' : '#94a3b8', background: 'transparent', display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <ActivitySquare size={16} /> Market Activity
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          style={{ padding: '12px 20px', borderBottom: activeTab === 'projects' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'projects' ? '#60a5fa' : '#94a3b8', background: 'transparent', display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <Layers size={16} /> Project Directory
        </button>
        <button 
          onClick={() => setActiveTab('credits')}
          style={{ padding: '12px 20px', borderBottom: activeTab === 'credits' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'credits' ? '#60a5fa' : '#94a3b8', background: 'transparent', display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <FileText size={16} /> Issued Credits
        </button>
      </div>

      {/* Conditional Filtering for Credits Search */}
      {activeTab === 'credits' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input placeholder="Search credits by serial or project..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading Registry...</div>
      ) : activeTab === 'activity' ? (
        // Market Activity Rendering
        <div className="glass-card" style={{ padding: 24 }}>
           {activity.length === 0 ? (
             <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No market activity recorded yet.</div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {activity.map(log => (
                 <div key={log.id} style={{ display: 'flex', gap: 16, borderBottom: '1px solid #1e293b', paddingBottom: 16 }}>
                   <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Activity size={18} color="#3b82f6" />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                       <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 15 }}>{formatAction(log.action)}</span>
                       <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(log.date).toLocaleString()}</span>
                     </div>
                     <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
                       Initiated by <strong style={{ color: '#cbd5e1' }}>{log.actor}</strong> {' '}
                       {log.details?.name && `for ${log.details.name}`}
                       {log.details?.quantity && `(${log.details.quantity.toLocaleString()} credits)`}
                       {log.details?.totalPrice && `[Volume: ₹${log.details.totalPrice}]`}
                     </p>
                   </div>
                 </div>
               ))}
               <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 16 }}>Showing latest 100 events</div>
             </div>
           )}
        </div>

      ) : activeTab === 'projects' ? (
        // Project Directory Rendering
        <div className="glass-card" style={{ overflow: 'hidden' }}>
           {projects.length === 0 ? (
             <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>No public projects registered.</div>
           ) : (
             <table>
               <thead>
                 <tr>
                   <th>Project Name</th>
                   <th>Location</th>
                   <th>Methodology</th>
                   <th>Est. Credits</th>
                   <th>Status</th>
                   <th>Created</th>
                 </tr>
               </thead>
               <tbody>
                 {projects.map((p) => (
                   <tr key={p.id}>
                     <td style={{ fontWeight: 500 }}>{p.name}</td>
                     <td style={{ color: '#94a3b8' }}>{p.location}</td>
                     <td style={{ color: '#94a3b8', fontSize: 13 }}>{p.methodology}</td>
                     <td style={{ color: '#cbd5e1' }}>{p.estCredits.toLocaleString()} tCO₂e</td>
                     <td><StatusBadge status={p.status} /></td>
                     <td style={{ color: '#64748b', fontSize: 13 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>

      ) : (
        // Issued Credits Rendering
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {credits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Globe size={48} color="#475569" style={{ marginBottom: 16 }} />
              <p style={{ color: '#64748b' }}>No verified credits match this criteria.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Serial Number</th>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Methodology</th>
                  <th>Vintage</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Owner (History)</th>
                  <th>Retirement</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c) => (
                  <tr key={c.serialNumber}>
                    <td style={{ fontFamily: 'monospace', color: '#4ade80', fontSize: 13 }}>{c.serialNumber}</td>
                    <td>{c.projectName}</td>
                    <td style={{ color: '#94a3b8' }}>{c.projectLocation}</td>
                    <td style={{ color: '#94a3b8', fontSize: 13 }}>{c.methodology}</td>
                    <td>{c.vintageYear}</td>
                    <td style={{ fontWeight: 'bold' }}>{c.quantity}t</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: '#94a3b8' }}>
                      <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{c.owner}</div>
                      {c.transactions && c.transactions.length > 0 && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {c.transactions.length} transfers recorded
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {c.retirement ? (
                        <div>
                          <div>{new Date(c.retirement.date).toLocaleDateString()}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.retirement.certificateNumber}</div>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
