'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Coins,
  ArrowRightLeft,
  Ban,
  ClipboardList,
  Search,
  AlertTriangle,
  LogOut,
  Wallet,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROJECT_OWNER', 'VERIFIER', 'BUYER'] },
  { href: '/projects', label: 'Projects', icon: FolderOpen, roles: ['ADMIN', 'PROJECT_OWNER', 'VERIFIER'] },
  { href: '/credits', label: 'Inventory', icon: Coins, roles: ['ADMIN', 'PROJECT_OWNER', 'BUYER'] },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag, roles: ['ADMIN', 'PROJECT_OWNER', 'BUYER'] },
  { href: '/credits/retire', label: 'Retirement', icon: Ban, roles: ['ADMIN', 'PROJECT_OWNER', 'BUYER'] },
  { href: '/audit', label: 'System Logs', icon: ClipboardList, roles: ['ADMIN', 'VERIFIER'] },
  { href: '/registry', label: 'Public Registry', icon: Search, roles: ['ADMIN', 'PROJECT_OWNER', 'VERIFIER', 'BUYER'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="gradient-text" style={{ fontSize: 24, fontWeight: 700 }}>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="glass"
        style={{
          width: 'var(--sidebar-width)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          borderRight: '1px solid rgba(148, 163, 184, 0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              }}
            >
              <Wallet size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
                <span className="gradient-text">Carbon</span>Wallet
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: -2 }}>Registry & Trading</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 8, padding: '0 16px', fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Navigation
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #334155, #475569)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{user.role}</div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
                transition: 'color 0.2s',
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          padding: '32px',
          minHeight: '100vh',
        }}
      >
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
