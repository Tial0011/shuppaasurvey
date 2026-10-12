import { useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { ResponsesProvider } from '@/hooks/useResponses';
import { logout } from '@/services/adminService';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/responses', label: 'Responses', icon: 'list' },
  { to: '/admin/insights', label: 'Insights', icon: 'chart' },
  { to: '/admin/builder', label: 'Survey builder', icon: 'edit' },
  { to: '/admin/links', label: 'Share links', icon: 'share' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (loading) return <div className="center-screen"><Spinner /></div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <ResponsesProvider>
      <div className="admin">
        <aside className={`sidebar${open ? ' open' : ''}`}>
          <Logo to="/admin" />
          <nav className="nav" onClick={() => setOpen(false)}>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon name={n.icon} />{n.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <a href="/" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Icon name="external" size={14} /> View site</a>
            <span className="email" title={user.email ?? ''}>{user.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => logout()}><Icon name="logout" size={14} /> Sign out</button>
          </div>
        </aside>
        <div>
          <div className="mobile-bar">
            <Logo to="/admin" />
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} aria-label="Menu"><Icon name={open ? 'close' : 'menu'} size={18} /></button>
          </div>
          <div className="admin-main"><Outlet /></div>
        </div>
      </div>
    </ResponsesProvider>
  );
}
