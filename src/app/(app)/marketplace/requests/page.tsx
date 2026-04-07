'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Toast, useToast, Modal } from '@/components/ui';
import { ShoppingBag, ArrowLeft, Check, X, Clock, IndianRupee, Package } from 'lucide-react';
import Link from 'next/link';

interface PurchaseRequest {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  reviewNotes: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    pricePerTon: number;
    currency: string;
    seller: { id: string; name: string };
  };
  buyer: { id: string; name: string; email: string; role: string };
}

const STATUS_CONFIG: Record<string, { badge: string; icon: typeof Clock; color: string }> = {
  PENDING: { badge: 'badge-yellow', icon: Clock, color: '#facc15' },
  APPROVED: { badge: 'badge-green', icon: Check, color: '#4ade80' },
  REJECTED: { badge: 'badge-red', icon: X, color: '#f87171' },
  CANCELLED: { badge: 'badge-gray', icon: X, color: '#94a3b8' },
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<PurchaseRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const isSeller = user && ['ADMIN', 'PROJECT_OWNER'].includes(user.role);

  useEffect(() => {
    if (!isSeller && tab === 'incoming') {
      setTab('outgoing');
    }
  }, [isSeller, tab]);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await fetch(`/api/purchase-requests?type=${tab}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [tab]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);

    const res = await fetch(`/api/purchase-requests/${reviewModal.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: reviewAction, reviewNotes }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      showToast(data.message || `Request ${reviewAction}d`);
      setReviewModal(null);
      setReviewNotes('');
      fetchRequests();
    } else {
      showToast(data.error || 'Failed to process', 'error');
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Purchase Requests" description="Manage incoming and outgoing purchase requests">
        <Link href="/marketplace" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
      </PageHeader>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {isSeller && (
          <button
            className={`btn btn-sm ${tab === 'incoming' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('incoming')}
            style={{ borderRadius: 8 }}
          >
            <Package size={14} /> Incoming Requests
          </button>
        )}
        <button
          className={`btn btn-sm ${tab === 'outgoing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('outgoing')}
          style={{ borderRadius: 8 }}
        >
          <ShoppingBag size={14} /> My Purchases
        </button>
      </div>

      {/* Requests List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <ShoppingBag size={48} color="#475569" style={{ marginBottom: 16 }} />
            <p style={{ color: '#64748b' }}>
              {tab === 'incoming'
                ? 'No incoming purchase requests yet'
                : 'You haven\'t made any purchase requests yet'}
            </p>
            {tab === 'outgoing' && (
              <Link href="/marketplace" className="btn btn-primary" style={{ marginTop: 12 }}>
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>{tab === 'incoming' ? 'Buyer' : 'Seller'}</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                {tab === 'incoming' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                const total = req.quantity * Number(req.listing.pricePerTon);

                return (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{req.listing.title}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {tab === 'incoming' ? req.buyer.name : req.listing.seller.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {tab === 'incoming' ? req.buyer.email : ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{req.quantity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IndianRupee size={12} color="#4ade80" />
                        {Number(req.listing.pricePerTon).toFixed(2)}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#4ade80' }}>
                      ₹{total.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${cfg.badge}`}>{req.status}</span>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    {tab === 'incoming' && (
                      <td>
                        {req.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => { setReviewModal(req); setReviewAction('approve'); }}
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                              onClick={() => { setReviewModal(req); setReviewAction('reject'); }}
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
                        )}
                        {req.reviewNotes && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            Note: {req.reviewNotes}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setReviewModal(null); }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              {reviewAction === 'approve' ? '✅ Approve Purchase' : '❌ Reject Purchase'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              {reviewAction === 'approve'
                ? `This will transfer ${reviewModal.quantity} credits to ${reviewModal.buyer.name} automatically.`
                : `Reject the purchase request from ${reviewModal.buyer.name}.`}
            </p>

            <div style={{
              padding: 16,
              borderRadius: 12,
              background: reviewAction === 'approve' ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
              border: `1px solid ${reviewAction === 'approve' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Credits</span>
                <span style={{ fontWeight: 600 }}>{reviewModal.quantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Total value</span>
                <span style={{ fontWeight: 700, color: '#4ade80' }}>
                  ₹{(reviewModal.quantity * Number(reviewModal.listing.pricePerTon)).toFixed(2)}
                </span>
              </div>
            </div>

            {reviewModal.notes && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(148, 163, 184, 0.05)', fontSize: 13 }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Buyer&apos;s note:</div>
                {reviewModal.notes}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Response Notes (optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                placeholder="Optional response to the buyer..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setReviewModal(null)}>
                Cancel
              </button>
              <button
                className={reviewAction === 'approve' ? 'btn btn-primary' : 'btn btn-danger'}
                style={{ flex: 1 }}
                onClick={handleReview}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : reviewAction === 'approve' ? 'Approve & Transfer' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
