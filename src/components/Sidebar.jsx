import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',         icon: '⬡', label: 'Dashboard' },
  { to: '/logs',              icon: '◈', label: 'Vehicle Logs' },
  { to: '/vehicles',          icon: '◉', label: 'Vehicles' },
  { to: '/users',             icon: '◎', label: 'Users' },
];

const reportItems = [
  { to: '/production-report', icon: '📋', label: 'Production Report' },
  { to: '/supplier-customer', icon: '🏭', label: 'Supplier & Customer' },
  { to: '/party-report',      icon: '👥', label: 'Party Wise Report' },
  { to: '/supplier-report',   icon: '📥', label: 'Supplier Report' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';
  const roleLabel = user?.roleId === 1 ? 'Super Admin' : user?.roleId === 2 ? 'Admin' : 'Operator';

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🎯</div>
        <div className="sidebar-brand-name">Neural Gate</div>
        <div className="sidebar-brand-sub">ANPR Control System</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 24 }}>Reports</div>
        {reportItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 24 }}>System</div>
        <div className="nav-item" style={{ cursor: 'default', opacity: 0.5 }}>
          <span className="nav-icon">⚙</span>
          Settings
          <span style={{ marginLeft: 'auto', fontSize: 9, background: 'var(--gold-dim)', color: 'var(--gold)', padding: '2px 7px', borderRadius: 10, letterSpacing: 1 }}>SOON</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}
