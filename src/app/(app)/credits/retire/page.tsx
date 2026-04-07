'use client';

import { useState, useEffect } from 'react';
import { PageHeader, StatusBadge, Modal, Toast, useToast } from '@/components/ui';
import { Ban } from 'lucide-react';

interface CreditBatch {
  id: string;
  serialBlockStart: string;
  serialBlockEnd: string;
  quantity: number;
  status: string;
  project: { name: string };
}

export default function RetirePage() {
  const [batches, setBatches] = useState<CreditBatch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('Voluntary Corporate Offset');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchCredits = async () => {
    const res = await fetch('/api/credits?status=ACTIVE&limit=200');
    const data = await res.json();
    setBatches(data.credits || []);
    setLoading(false);
  };

  useEffect(() => { fetchCredits(); }, []);

  const handleRetire = async () => {
    if (!selectedId) return;

    const res = await fetch('/api/credits/retire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: selectedId,
        quantity,
        reason,
        beneficiaryName,
      }),
    });

    if (res.ok) {
      showToast(`${quantity} credit(s) retired successfully`, 'success');
      setSelectedId(null);
      setQuantity(0);
      setBeneficiaryName('');
      setShowConfirm(false);
      fetchCredits();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to retire credits', 'error');
      setShowConfirm(false);
    }
  };

  const selectedBatch = batches.find(b => b.id === selectedId);

  const toggleBatch = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setQuantity(0);
    } else {
      setSelectedId(id);
      const batch = batches.find(b => b.id === id);
      if (batch) setQuantity(batch.quantity);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>;
  }

  const isValid = selectedId && quantity > 0 && quantity <= (selectedBatch?.quantity || 0) && beneficiaryName.length >= 2;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Retire Credits" description="Permanently retire carbon credits to claim the offset" />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Select a Credit Batch to Retire</h3>
          {batches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No active credits available</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Block Start</th>
                  <th>Project</th>
                  <th>Available Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} style={{ cursor: 'pointer', background: selectedId === b.id ? 'rgba(74, 222, 128, 0.1)' : 'transparent' }} onClick={() => toggleBatch(b.id)}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="radio" name="batch" checked={selectedId === b.id} onChange={() => toggleBatch(b.id)} />
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#4ade80', fontSize: 13 }}>{b.serialBlockStart}</td>
                    <td>{b.project?.name || 'Unknown Project'}</td>
                    <td style={{ fontWeight: 600 }}>{b.quantity}</td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="glass-card" style={{ padding: 24, alignSelf: 'start', position: 'sticky', top: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Retirement Details</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Quantity to Retire *</label>
            <input 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
              className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white" 
              placeholder="E.g., 50" 
              max={selectedBatch?.quantity || 0}
              min={1}
            />
            {selectedBatch && <p className="text-xs text-slate-500 mt-1">Max available: {selectedBatch.quantity}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Retirement Reason *</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white"
            >
               <option value="Voluntary Corporate Offset">Voluntary Corporate Offset</option>
               <option value="CCTS Compliance Obligation">CCTS Compliance Obligation</option>
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Beneficiary Name *</label>
            <input 
              type="text" 
              value={beneficiaryName} 
              onChange={(e) => setBeneficiaryName(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white" 
              placeholder="Organization or Individual Name" 
            />
          </div>

          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(249, 115, 22, 0.08)', marginBottom: 16, fontSize: 12, color: '#fb923c' }}>
            ⚠️ Retired credits cannot be transferred or reused. This action is permanent.
          </div>

          <button
            className="btn btn-danger"
            style={{ width: '100%' }}
            disabled={!isValid}
            onClick={() => setShowConfirm(true)}
          >
            <Ban size={16} /> Retire Credits
          </button>
        </div>
      </div>

      {showConfirm && (
        <Modal
          title="Confirm Retirement"
          message={`Permanently retire ${quantity} credit(s) on behalf of ${beneficiaryName}? This cannot be undone.`}
          confirmLabel="Retire"
          type="danger"
          onConfirm={handleRetire}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
