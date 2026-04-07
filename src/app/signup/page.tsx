'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight, FolderOpen, ShieldCheck, ShoppingCart, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

const roles = [
  {
    value: 'PROJECT_OWNER',
    label: 'Project Owner',
    description: 'Register carbon offset projects and manage credits',
    icon: FolderOpen,
    color: '#3b82f6',
  },
  {
    value: 'VERIFIER',
    label: 'Verifier',
    description: 'Review and verify monitoring reports and projects',
    icon: ShieldCheck,
    color: '#a855f7',
  },
  {
    value: 'BUYER',
    label: 'Buyer',
    description: 'Purchase and retire carbon credits from the marketplace',
    icon: ShoppingCart,
    color: '#f59e0b',
  }
];

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);

    try {
      await signup(name, email, password, selectedRole);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
          <p style={{ color: '#64748b', fontSize: 14 }}>Create your account</p>
        </div>

        {/* Signup Form */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Sign Up</h2>

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
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                minLength={2}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 10 }}>
                Select Your Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      type="button"
                      key={role.value}
                      id={`role-${role.value.toLowerCase().replace('_', '-')}`}
                      onClick={() => setSelectedRole(role.value)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: isSelected
                          ? `${role.color}15`
                          : 'rgba(148, 163, 184, 0.04)',
                        border: isSelected
                          ? `2px solid ${role.color}`
                          : '2px solid rgba(148, 163, 184, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon
                          size={18}
                          color={isSelected ? role.color : '#64748b'}
                        />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isSelected ? role.color : '#e2e8f0',
                          }}
                        >
                          {role.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#64748b',
                          lineHeight: 1.4,
                        }}
                      >
                        {role.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              id="signup-submit"
              className="btn btn-primary"
              style={{ width: '100%', height: 44 }}
              disabled={loading || !selectedRole}
            >
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: '#22c55e',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
