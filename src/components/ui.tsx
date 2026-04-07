'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{message}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

interface ModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function Modal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', type = 'primary', onConfirm, onCancel }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn btn-${type === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    DRAFT: 'badge-gray',
    SUBMITTED: 'badge-blue',
    UNDER_REVIEW: 'badge-yellow',
    APPROVED: 'badge-green',
    REJECTED: 'badge-red',
    VERIFIED: 'badge-green',
    ACTIVE: 'badge-green',
    TRANSFERRED: 'badge-purple',
    RETIRED: 'badge-orange',
    CANCELLED: 'badge-red',
  };

  return <span className={`badge ${colorMap[status] || 'badge-gray'}`}>{status.replace(/_/g, ' ')}</span>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const colorMap: Record<string, string> = {
    LOW: 'badge-blue',
    MEDIUM: 'badge-yellow',
    HIGH: 'badge-orange',
    CRITICAL: 'badge-red',
  };

  return <span className={`badge ${colorMap[severity] || 'badge-gray'}`}>{severity}</span>;
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{title}</h1>
        {description && <p style={{ color: '#64748b', fontSize: 14 }}>{description}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 12 }}>{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ color: '#475569', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: '#64748b', fontSize: 14 }}>{description}</p>
    </div>
  );
}

// Hook for toast state
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}
