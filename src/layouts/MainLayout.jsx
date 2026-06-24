import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { logService } from '../services/logService';

export default function MainLayout({ children }) {
  const [activeCount, setActiveCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await logService.getActive();
        setActiveCount(res.data?.count || 0);
      } catch { /* silent */ }
    };
    fetchActive();
    const id = setInterval(fetchActive, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app-shell">
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Navbar
          activeCount={activeCount}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
