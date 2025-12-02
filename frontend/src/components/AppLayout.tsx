import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { ToastHost } from './ToastHost';

const navForRole = (role?: string) => {
  const base = [{ to: '/desk', label: 'My Desk', roles: ['OCCUPANT'] }];
  const occupantExtras = [
    { to: '/health', label: 'My Health', roles: ['OCCUPANT'] },
    { to: '/settings', label: 'Settings', roles: ['OCCUPANT'] }
  ];
  const manager = [
    { to: '/desks', label: 'Desks Overview', roles: ['MANAGER', 'ADMIN'] },
    { to: '/reports', label: 'Reports', roles: ['MANAGER', 'ADMIN'] },
    { to: '/desk-sync', label: 'Desk Sync', roles: ['MANAGER', 'ADMIN'] }
  ];
  const admin = [{ to: '/admin', label: 'Admin', roles: ['ADMIN'] }];

  const all = [...base, ...occupantExtras, ...manager, ...admin];
  return all.filter((item) => !role || item.roles.includes(role));
};

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const { unread, notifications, markRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = useMemo(() => navForRole(user?.role), [user?.role]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const roleTitle = user?.role ? user.role.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Guest';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">S</div>
          <div>Smart Desk</div>
        </div>
        <div className="nav-group">
          <div className="nav-label">Navigation</div>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <div>
            <h1>Desk Supervisor</h1>
            <p className="subtitle">
              {roleTitle} · {location.pathname}
            </p>
          </div>
          <div className="topbar-right">
            <button className="btn-ghost notification-icon" onClick={() => setNotifOpen((s) => !s)}>
              🔔
              {unread > 0 && <span className="notification-badge">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="notification-panel">
                <div className="flex between">
                  <strong>Notifications</strong>
                  <button className="btn-ghost" onClick={() => setNotifOpen(false)}>
                    Close
                  </button>
                </div>
                <div style={{ maxHeight: 280, overflow: 'auto', marginTop: 8 }}>
                  {notifications.length === 0 && <p className="muted">No notifications yet.</p>}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="card"
                      style={{ padding: 10, marginBottom: 6, cursor: 'pointer' }}
                      onClick={() => markRead(n.id)}
                    >
                      <div className="flex between">
                        <strong>{n.title}</strong>
                        {!n.read_at && <span className="badge">New</span>}
                      </div>
                      <p className="muted" style={{ margin: '6px 0' }}>
                        {n.body}
                      </p>
                      <span className="muted" style={{ fontSize: 12 }}>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="btn-ghost" onClick={toggleTheme}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <div
              className="user-menu"
              onClick={() => navigate(user?.role === 'OCCUPANT' ? '/settings' : '/desks')}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{user?.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {roleTitle}
                </div>
              </div>
            </div>
            <button
              className="btn secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <Outlet />
      </div>
      <ToastHost />
    </div>
  );
};
