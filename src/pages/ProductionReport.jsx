/**
 * ProductionReport.jsx
 * Daily Production Report — kitne truck aaye, kitna load (tons/kg)
 * Polish barcode-style Indian Mine Challan UI
 */
import { useState, useEffect, useCallback } from 'react';
import { logService } from '../services/logService';

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function parseOthers(o) {
  if (!o) return {};
  try { return typeof o === 'string' ? JSON.parse(o) : o; } catch { return {}; }
}
function toNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

function today8601() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SCard({ label, value, color = '#C8952A', icon }) {
  return (
    <div style={{ flex: 1, minWidth: 140, background: 'var(--bg-card)', border: `1px solid ${color}44`, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-mono)', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, letterSpacing: 1 }}>{label.toUpperCase()}</div>
    </div>
  );
}

export default function ProductionReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today8601());
  const [dateTo, setDateTo] = useState(today8601());
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logService.getAll({ limit: 1000, page: 1 });
      const all = res.data?.data || res.data?.logs || res.data || [];
      setLogs(all);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter by date range
  const filtered = logs.filter(l => {
    const dt = new Date(l.entryTime || l.createdAt || l.created);
    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T23:59:59');
    const matchDate = dt >= from && dt <= to;
    const q = search.toLowerCase();
    const matchSearch = !search || l.vehicleNumber?.toLowerCase().includes(q) || l.driverName?.toLowerCase().includes(q);
    return matchDate && matchSearch;
  });

  // Compute totals
  const totalTrucks = filtered.length;
  const totalWeight = filtered.reduce((sum, l) => {
    const o = parseOthers(l.others);
    return sum + toNum(o.weightTons || o.weight || o.ton || o.kg ? (o.weightTons || o.weight || o.ton) : 0);
  }, 0);
  const totalKg = filtered.reduce((sum, l) => {
    const o = parseOthers(l.others);
    return sum + toNum(o.kg || o.weightKg || 0);
  }, 0);
  const completed = filtered.filter(l => l.exitTime).length;

  return (
    <div style={{ animation: 'rowFadeIn 0.4s ease forwards' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--gold)', fontWeight: 800 }}>📋 Daily Production Report</h2>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Truck entries, load summary, and trip details</div>
        </div>
        <button className="btn btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>From</span>
          <input type="date" className="lux-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>To</span>
          <input type="date" className="lux-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} />
        </div>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 280 }}>
          <span className="search-icon">🔍</span>
          <input className="lux-input" placeholder="Search plate / driver..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-outline" onClick={() => { setDateFrom(today8601()); setDateTo(today8601()); setSearch(''); }}>
          Today
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <SCard icon="🚛" label="Total Trips" value={totalTrucks} color="#C8952A" />
        <SCard icon="⚖️" label="Total Tons" value={totalWeight > 0 ? totalWeight.toFixed(2) : '—'} color="#00FF9C" />
        <SCard icon="📦" label="Total KG" value={totalKg > 0 ? totalKg.toFixed(0) : '—'} color="#00CFFF" />
        <SCard icon="✅" label="Completed" value={completed} color="#9C27B0" />
        <SCard icon="🔄" label="In Progress" value={totalTrucks - completed} color="#FF9800" />
      </div>

      {/* Table */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span className="panel-title-dot" style={{ background: '#C8952A', boxShadow: '0 0 8px #C8952A' }} />
            Production Entries
          </div>
          <span className="badge badge-gold">{filtered.length} RECORDS</span>
        </div>
        <div className="lux-table-wrap">
          {loading ? (
            <div className="empty-state" style={{ height: 200 }}>
              <div className="loader-ring" style={{ width: 36, height: 36 }} />
              <div className="loader-text">LOADING...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No records for selected date</div>
            </div>
          ) : (
            <table className="lux-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>License Plate</th>
                  <th>Driver</th>
                  <th>Vehicle Type</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Weight (Tons)</th>
                  <th>Weight (KG)</th>
                  <th>Cargo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const o = parseOthers(log.others);
                  const tons = o.weightTons || o.weight || o.ton || '—';
                  const kg = o.kg || o.weightKg || '—';
                  const cargo = o.cargo || o.material || '—';
                  return (
                    <tr key={log.id || i}>
                      <td style={{ fontSize: 12 }}>#{log.id}</td>
                      <td>
                        <div className="plate" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                          <div className="plate-flag"><span>🇮🇳</span><span style={{ fontSize: 7 }}>IND</span></div>
                          <div className="plate-num">{log.vehicleNumber || '—'}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{log.driverName || '—'}</td>
                      <td style={{ fontSize: 12, textTransform: 'capitalize' }}>🚛 {log.vehicleType || '—'}</td>
                      <td style={{ fontSize: 12 }}>{fmtTime(log.entryTime)} <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>{fmtDate(log.entryTime)}</span></td>
                      <td style={{ fontSize: 12, color: log.exitTime ? 'var(--green)' : 'var(--text-dim)' }}>
                        {log.exitTime ? fmtTime(log.exitTime) : '—'}
                      </td>
                      <td style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#00FF9C' }}>{tons}</td>
                      <td style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#00CFFF' }}>{kg}</td>
                      <td style={{ fontSize: 12 }}>{cargo}</td>
                      <td>
                        {log.exitTime
                          ? <span className="badge badge-dim">DONE</span>
                          : <span className="badge badge-cyan"><span className="badge-dot" />ACTIVE</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
