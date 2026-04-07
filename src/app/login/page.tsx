'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Leaf, ArrowRight, Wallet, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(34, 197, 94, 0.08) 0%, transparent 50%), #0a0f1e',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
              marginBottom: 20,
            }}
          >
            <Wallet size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            <span className="gradient-text">Carbon</span>Wallet
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Carbon Registry & Trading System</p>
        </div>

        {/* Login Form */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Sign In</h2>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn btn-primary"
              style={{ width: '100%', height: 44 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              style={{
                color: '#22c55e',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Sign Up
            </Link>
          </p>

          {/* Demo Accounts */}
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
               <ShieldCheck size={14} color="#22c55e" /> Demo Accounts <span style={{ color: '#475569' }}>(Password: <span style={{ color: '#cbd5e1', userSelect: 'all' }}>password123</span>)</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: 13, textAlign: 'left' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid rgba(51, 65, 85, 0.4)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Admin</span>
                   <span style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 12, userSelect: 'all' }}>admin@carbon.dev</span>
                </div>
                <span style={{ color: '#64748b', fontSize: 11 }}>Full access, issue credits, manage everything</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid rgba(51, 65, 85, 0.4)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Project Owner</span>
                   <span style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 12, userSelect: 'all' }}>owner@carbon.dev</span>
                </div>
                <span style={{ color: '#64748b', fontSize: 11 }}>Create projects, upload MRV reports</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid rgba(51, 65, 85, 0.4)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Verifier</span>
                   <span style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 12, userSelect: 'all' }}>verifier@carbon.dev</span>
                </div>
                <span style={{ color: '#64748b', fontSize: 11 }}>Review projects, verify MRVs, monitor audit logs, and resolve anomalies</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Buyer</span>
                   <span style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 12, userSelect: 'all' }}>buyer@carbon.dev</span>
                </div>
                <span style={{ color: '#64748b', fontSize: 11 }}>Receive and retire credits</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
