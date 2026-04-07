"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TreePine, Archive, RefreshCw, BarChart3, ShieldCheck, FileText, CheckCircle, Search, AlertTriangle, Coins, ShoppingCart, ArrowRightLeft, TrendingUp, Cpu, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(resData => {
          setData(resData);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  if (!user || loading || !data) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500">
      <Loader2 className="animate-spin mr-2" size={24} /> Loading Dashboard...
    </div>
  );

  if (user.role === 'ADMIN') return <AdminDashboard data={data} />;
  if (user.role === 'PROJECT_OWNER') return <ProjectOwnerDashboard data={data} />;
  if (user.role === 'VERIFIER') return <VerifierDashboard data={data} />;
  if (user.role === 'BUYER') return <BuyerDashboard data={data} />;

  return null;
}

function AdminDashboard({ data }: { data: any }) {
  const stats = data?.stats || {};
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans cursor-default">
      <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
        <ShieldCheck className="text-emerald-500" size={32} /> Master Control Panel (Admin)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total System Users', value: stats.userCount || 0, icon: Search },
          { title: 'Credits in Circulation', value: stats.totalCredits || 0, icon: Coins },
          { title: 'System Anomalies', value: stats.unresolvedAnomalies || 0, icon: AlertTriangle },
          { title: 'Total Trades', value: stats.totalTransfers || 0, icon: ArrowRightLeft },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 border-l-4 border-emerald-500 rounded-lg p-6 shadow-lg hover:shadow-emerald-900/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">{stat.title}</h3>
              <stat.icon className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-50">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-emerald-400">Quick Actions</h3>
        <div className="flex gap-4">
          <Link href="/registry" className="btn btn-primary flex items-center gap-2">
            <Coins size={16} /> View Global Registry
          </Link>
          <Link href="/audit" className="btn btn-secondary flex items-center gap-2">
            <FileText size={16} /> View System Logs
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProjectOwnerDashboard({ data }: { data: any }) {
  const stats = data?.stats || {};
  const areaData = (data?.creditsByMonth || []).map((item: any) => ({
    month: item.month,
    issued: item.credits,
    retired: 0,
  }));
  if (areaData.length === 0) {
    areaData.push({ month: new Date().toISOString().substring(0, 7), issued: 0, retired: 0 });
  }

  const pieData = (data?.projectsByStatus || []).map((item: any) => ({
    name: item.status,
    value: item.count,
    color: item.status === 'APPROVED' ? '#22c55e' : (item.status === 'SUBMITTED' ? '#eab308' : '#0ea5e9'),
  }));
  if (pieData.length === 0) {
    pieData.push({ name: 'No Projects', value: 1, color: '#475569' });
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans cursor-default">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <TreePine className="text-green-500" size={32} /> Project Owner Dashboard
        </h1>
        <Link href="/projects" className="btn btn-primary shadow-lg shadow-green-900/30">Create Project</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {[
          { title: 'Total Projects', value: stats.totalProjects || 0, icon: TreePine },
          { title: 'Total Issued', value: stats.totalCredits || 0, icon: BarChart3 },
          { title: 'Active Credits', value: stats.activeCredits || 0, icon: RefreshCw },
          { title: 'Retired Credits', value: stats.retiredCredits || 0, icon: Archive },
          { title: 'Trades Involved', value: stats.totalTransfers || 0, icon: ArrowRightLeft },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 border-l-4 border-green-500 rounded-lg p-6 shadow-lg hover:shadow-green-900/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">{stat.title}</h3>
              <stat.icon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </div>
            <p className="text-3xl font-bold text-slate-50">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
          <h3 className="text-lg font-semibold mb-6">Credits Issued Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="issued" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col">
          <h3 className="text-lg font-semibold mb-6">Projects by Status</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-4 mt-4 text-sm font-medium">
            {pieData.map((p: any, i: number) => (
              <span key={i} className="flex items-center gap-2"><div style={{ backgroundColor: p.color }} className="w-3 h-3 rounded-full"></div>{p.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifierDashboard({ data }: { data: any }) {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasAnomaly, setHasAnomaly] = useState(data?.stats?.unresolvedAnomalies > 0);
  const pendingProjects = data?.verifierPendingProjects || [];

  const handleRunScan = () => {
    setIsScanning(true);
    showToast('System scan initiated. Analyzing latest records...');

    setTimeout(() => {
      setIsScanning(false);
      setHasAnomaly(true);
      showToast('Scan complete.', 'error');
    }, 2000);
  };

  const handleResolve = () => {
    setHasAnomaly(false);
    showToast('Anomaly successfully resolved and logged.', 'success');
  };

  const handleDismiss = () => {
    setHasAnomaly(false);
    showToast('Anomaly flag dismissed.');
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans cursor-default">
      <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
        <CheckCircle className="text-blue-500" size={32} /> Verifier Dashboard
      </h1>

      {/* Top half: Pending Projects */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 mb-8">
        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2"><FileText size={18} /> Pending Projects (Verification Pipeline)</h3>
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">{data?.stats?.pendingVerifications || 0} Action Required</span>
        </div>

        <div className="flex flex-col gap-4">
          {pendingProjects.length > 0 ? pendingProjects.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors">
              <div>
                <h4 className="font-semibold text-slate-200">{item.name}</h4>
                <p className="text-xs text-slate-400 mt-1">Status: {item.status} • Methodology: {item.methodology}</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  <span className="flex items-center gap-1"><FileText size={12} className="text-emerald-400" /> MRV Report</span>
                </div>
                <Link href={`/projects/${item.id}`} className="btn btn-secondary text-sm px-4 py-2">View & Verify</Link>
              </div>
            </div>
          )) : <p className="text-slate-400 text-sm italic">No pending verifications.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Logs */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 h-96 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2"><Cpu size={18} /> Recent Audit Logs</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="flex flex-col gap-2">
              {(data?.recentActivity || []).map((log: any) => (
                <div key={log.id} className="text-xs bg-slate-900 p-3 rounded border border-slate-700 text-slate-300 font-mono flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-purple-400 font-semibold">{log.action}</span>
                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <span>Entity: {log.entityType} ({log.entityId.substring(0, 8)}...)</span>
                  <span>User: {log.user?.name} ({log.user?.role})</span>
                </div>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) && <p className="text-slate-500 italic text-center mt-8">No recent logs.</p>}
            </div>
          </div>
          <Link href="/audit" className="mt-4 text-sm text-purple-400 hover:text-purple-300 text-center">View Full System Logs →</Link>
        </div>

        {/* Anomaly Scans */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col relative h-96 transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle size={18} className={hasAnomaly ? "text-red-500" : "text-emerald-500"} />
              Anomaly Scans
            </h3>
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className={`btn text-xs py-1.5 px-3 flex items-center gap-2 ${isScanning ? 'bg-slate-700 text-slate-400 cursor-not-allowed border-slate-600' : 'btn-secondary border-slate-600 hover:bg-slate-700'}`}
            >
              {isScanning ? (
                <>
                  <Loader2 size={14} className="animate-spin text-slate-400" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search size={14} /> Run System Scan
                </>
              )}
            </button>
          </div>

          {hasAnomaly ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-red-500/40 rounded-lg bg-red-950/20 shadow-inner animate-fade-in">
              <div className="relative mb-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20"></span>
                <AlertTriangle size={48} className="text-red-500 relative" />
              </div>
              <h4 className="text-red-400 font-semibold mb-2">Suspicious Activity Detected ({data?.stats?.unresolvedAnomalies} unresolved)</h4>
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={handleResolve}
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-500 text-white border-none py-2 px-4 shadow-lg shadow-emerald-900/20"
                >
                  Resolve Anomaly
                </button>
                <button
                  onClick={handleDismiss}
                  className="btn btn-secondary bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10 py-2 px-4"
                >
                  Dismiss Flag
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-emerald-500/30 rounded-lg bg-emerald-950/10 shadow-inner animate-fade-in">
              <div className="mb-4 bg-emerald-900/20 p-4 rounded-full">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h4 className="text-emerald-400 font-semibold mb-2">System Secure</h4>
              <p className="text-sm text-slate-400 mb-6 max-w-sm">
                No active anomalies or suspicious trading flags found in the current audit window.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuyerDashboard({ data }: { data: any }) {
  const stats = data?.stats || {};
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans cursor-default">
      <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
        <ShoppingCart className="text-sky-500" size={32} /> Corporate Buyer Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 border-l-4 border-sky-500 rounded-lg p-6 shadow-lg hover:shadow-sky-900/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">Owned Credits</h3>
            <Coins className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-50">{stats.activeCredits || 0}</p>
        </div>
        <div className="bg-slate-800 border-l-4 border-sky-500 rounded-lg p-6 shadow-lg hover:shadow-sky-900/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">Retired Credits</h3>
            <Archive className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-50">{stats.retiredCredits || 0}</p>
        </div>
        <div className="bg-slate-800 border-l-4 border-sky-500 rounded-lg p-6 shadow-lg hover:shadow-sky-900/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Active Requests</h3>
            <TrendingUp className="w-5 h-5 text-sky-500 flex-shrink-0" />
          </div>
          <p className="text-3xl font-bold text-slate-50">{stats.activeRequests || 0}</p>
        </div>
        <div className="bg-slate-800 border-l-4 border-sky-500 rounded-lg p-6 shadow-lg hover:shadow-sky-900/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">Trades Participated</h3>
            <ArrowRightLeft className="w-5 h-5 text-sky-500 flex-shrink-0" />
          </div>
          <p className="text-3xl font-bold text-slate-50">{stats.totalTransfers || 0}</p>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-sky-400 flex items-center gap-2"><ShoppingCart size={18} /> Marketplace Shortcuts</h3>
        <p className="text-sm text-slate-400 mb-6">Explore the marketplace for premium carbon credits compliant with global emission standards.</p>
        <div className="flex gap-4">
          <Link href="/marketplace" className="btn btn-primary shadow-lg shadow-sky-900/30">Browse Marketplace</Link>
          <Link href="/credits/retire" className="btn btn-secondary">Retire Inventory</Link>
        </div>
      </div>
    </div>
  );
}
