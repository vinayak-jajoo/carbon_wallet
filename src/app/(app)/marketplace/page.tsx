'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Toast, useToast } from '@/components/ui';
import { ShoppingBag, Tag, IndianRupee, TrendingUp, Eye, ShoppingCart, Plus } from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  description: string | null;
  pricePerCredit: string;
  currency: string;
  totalQuantity: number;
  availableQty: number;
  status: string;
  projectName: string;
  vintageYear: number;
  methodology: string;
  createdAt: string;
  seller: { id: string; name: string; role: string };
  _count: { purchaseRequests: number };
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buyModal, setBuyModal] = useState<Listing | null>(null);
  const [buyQty, setBuyQty] = useState(1);
  const [buyNotes, setBuyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchListings = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/marketplace?${params}`);
    const data = await res.json();
    setListings(data.listings || []);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [search]);

  const handleBuy = async () => {
    if (!buyModal) return;
    setSubmitting(true);
    const res = await fetch(`/api/marketplace/${buyModal.id}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: buyQty, notes: buyNotes }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      showToast('Purchase request submitted! Waiting for seller approval.');
      setBuyModal(null);
      setBuyQty(1);
      setBuyNotes('');
    } else {
      showToast(data.error || 'Failed to submit request', 'error');
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Marketplace" description="Browse and purchase carbon credits">
        {user && ['ADMIN', 'PROJECT_OWNER'].includes(user.role) && (
          <Link href="/marketplace/sell" className="btn btn-primary">
            <Plus size={16} /> List Credits for Sale
          </Link>
        )}
        <Link href="/marketplace/requests" className="btn btn-secondary">
          <ShoppingBag size={16} /> My Requests
        </Link>
      </PageHeader>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <ShoppingBag size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            placeholder="Search by title or project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading marketplace...</div>
      ) : listings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 80 }}>
          <ShoppingBag size={56} color="#475569" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>No listings yet</h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {user && ['ADMIN', 'PROJECT_OWNER'].includes(user.role)
              ? 'Be the first to list credits for sale!'
              : 'Check back soon for available credits.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="glass-card"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              {/* Card header with gradient accent */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.05))',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, flex: 1, marginRight: 12 }}>
                    {listing.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08))',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    whiteSpace: 'nowrap',
                  }}>
                    <IndianRupee size={14} color="#4ade80" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>
                      {Number(listing.pricePerCredit).toFixed(2)}
                    </span>
                    <span style={{ fontSize: 11, color: '#86efac' }}>/{listing.currency}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>by {listing.seller.name}</div>
              </div>

              {/* Card body */}
              <div style={{ padding: '20px 24px' }}>
                {listing.description && (
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 1.5 }}>
                    {listing.description}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148, 163, 184, 0.05)' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Project</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{listing.projectName}</div>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148, 163, 184, 0.05)' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Vintage</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{listing.vintageYear}</div>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148, 163, 184, 0.05)' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Methodology</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{listing.methodology}</div>
                  </div>

                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148, 163, 184, 0.05)' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Available</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>{listing.availableQty}</span>
                      <span style={{ color: '#64748b' }}> / {listing.totalQuantity}</span>
                    </div>
                  </div>
                </div>

                {/* Due Diligence Section */}
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(51, 65, 85, 0.4)', border: '1px solid rgba(71, 85, 105, 0.4)', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Due Diligence
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <a href={"#"} target="_blank" className="hover:text-green-400 transition-colors" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#cbd5e1' }}>
                      <Eye size={14} color="#64748b" /> Verification Report <span style={{ fontSize: 10, color: '#64748b' }}>(External Link)</span>
                    </a>
                    
                    {/* Geotagged Photos MapPin Placeholder */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 6, background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Tag size={16} color="#4ade80" />
                      </div>
                      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 6, background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Tag size={16} color="#4ade80" />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>Geotagged site photos available</span>
                    </div>
                  </div>
                </div>

                {/* Total value */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.05)',
                  marginBottom: 16,
                  fontSize: 13,
                }}>
                  <TrendingUp size={14} color="#60a5fa" />
                  <span style={{ color: '#94a3b8' }}>Total value:</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                    ₹{(Number(listing.pricePerCredit) * listing.availableQty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {listing.seller.id !== user?.userId ? (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => { setBuyModal(listing); setBuyQty(1); }}
                      disabled={listing.availableQty === 0}
                    >
                      <ShoppingCart size={16} />
                      {listing.availableQty === 0 ? 'Sold Out' : 'Buy Credits'}
                    </button>
                  ) : (
                    <Link href="/marketplace/requests" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                      <Eye size={16} /> View Requests ({listing._count.purchaseRequests})
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy Modal */}
      {buyModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setBuyModal(null); }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Purchase Credits</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{buyModal.title}</p>

            <div style={{
              padding: '16px',
              borderRadius: 12,
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.1)',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Price per credit</span>
                <span style={{ fontWeight: 600 }}>₹{Number(buyModal.pricePerCredit).toFixed(2)} {buyModal.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Available</span>
                <span style={{ fontWeight: 600 }}>{buyModal.availableQty} credits</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Your total</span>
                <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 16 }}>
                  ₹{(Number(buyModal.pricePerCredit) * buyQty).toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                max={buyModal.availableQty}
                value={buyQty}
                onChange={(e) => setBuyQty(Math.min(Math.max(1, parseInt(e.target.value) || 1), buyModal.availableQty))}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Notes to Seller (optional)
              </label>
              <textarea
                value={buyNotes}
                onChange={(e) => setBuyNotes(e.target.value)}
                rows={3}
                placeholder="Any specific requirements or questions..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setBuyModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleBuy}
                disabled={submitting || buyQty < 1}
              >
                <ShoppingCart size={16} />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
