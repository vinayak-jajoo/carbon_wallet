'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { PageHeader, Toast, useToast } from '@/components/ui';
import { Tag, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Credit {
  id: string;
  serialNumber: string;
  status: string;
  listingId: string | null;
  batch: { project: { name: string; methodology: string }; vintageYear: number };
}

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch('/api/credits?status=ACTIVE&limit=500')
      .then((r) => r.json())
      .then((data) => {
        // Filter to only unlisted credits owned by the user
        const available = (data.credits || []).filter(
          (c: Credit) => c.status === 'ACTIVE' && !c.listingId
        );
        setCredits(available);
        setLoading(false);
      });
  }, [user]);

  const toggleCredit = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSubmit = async () => {
    if (selected.size === 0 || !title || !price) return;
    setSubmitting(true);

    const res = await fetch('/api/marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creditIds: Array.from(selected),
        title,
        description,
        pricePerCredit: parseFloat(price),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      showToast('Listing created successfully!');
      setTimeout(() => router.push('/marketplace'), 1000);
    } else {
      showToast(data.error || 'Failed to create listing', 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>;
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="List Credits for Sale" description="Select credits and set your price">
        <Link href="/marketplace" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Credit Selection */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Select Credits</h3>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Choose the credits you want to list for sale
          </p>

          {credits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
              No unlisted active credits available
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selected.size === credits.length && credits.length > 0}
                      onChange={() => selected.size === credits.length ? setSelected(new Set()) : setSelected(new Set(credits.map(c => c.id)))}
                    />
                  </th>
                  <th>Serial Number</th>
                  <th>Project</th>
                  <th>Vintage</th>
                  <th>Methodology</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => toggleCredit(c.id)}>
                    <td>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleCredit(c.id)} />
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#4ade80', fontSize: 13 }}>{c.serialNumber}</td>
                    <td>{c.batch.project.name}</td>
                    <td>{c.batch.vintageYear}</td>
                    <td style={{ color: '#94a3b8', fontSize: 13 }}>{c.batch.project.methodology}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Listing Form */}
        <div className="glass-card" style={{ padding: 24, alignSelf: 'start', position: 'sticky', top: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <Tag size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            Listing Details
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
              Listing Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Amazon Reforestation Credits 2024"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the credits, project details, certifications..."
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
              Price per Credit (INR) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 12.50"
            />
          </div>

          <div style={{
            padding: '16px',
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.1)',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Credits selected</span>
              <span style={{ fontWeight: 600 }}>{selected.size}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Price per credit</span>
              <span style={{ fontWeight: 600 }}>₹{price || '0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Total listing value</span>
              <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 16 }}>
                ₹{(selected.size * (parseFloat(price) || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={selected.size === 0 || !title || !price || submitting}
            onClick={handleSubmit}
          >
            <Plus size={16} />
            {submitting ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
