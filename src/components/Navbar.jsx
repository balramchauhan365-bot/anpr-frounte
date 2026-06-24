import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard':         'Dashboard',
  '/logs':              'Vehicle Logs',
  '/vehicles':          'Vehicles',
  '/users':             'Users',
  '/production-report': 'Production Report',
  '/supplier-customer': 'Supplier & Customer',
  '/party-report':      'Party Wise Report',
  '/supplier-report':   'Supplier Report',
};

export default function Navbar({ activeCount = 0, onMenuToggle }) {
  const [time, setTime] = useState('');
  const location = useLocation();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const title = pageTitles[location.pathname] || 'ANPR';

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Hamburger for mobile */}
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
        <div className="page-title">{title}</div>
        {activeCount > 0 && (
          <div className="live-indicator">
            <span className="live-dot" />
            <span className="live-text">{activeCount} INSIDE</span>
          </div>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-clock">{time}</div>
        <button className="navbar-icon-btn" title="Refresh" onClick={() => window.location.reload()}>
          ↻
        </button>
      </div>
    </header>
  );
}
