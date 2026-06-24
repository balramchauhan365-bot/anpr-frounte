/**
 * SupplierReport.jsx — Supplier Daily Report
 * Supplier-specific analysis: daily trip count, load, timing
 */
import { useState, useEffect, useCallback } from 'react';
import { logService } from '../services/logService';

function fmtTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function parseOthers(o) {
  if (!o) return {};
  try { return typeof o === 'string' ? JSON.parse(o) : o; } catch { return {}; }
}
function today8601() { return new Date().toISOString().split('T')[0]; }
function toNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

// Mini bar for visual trip count
function TripBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease', boxShadow: `0 0 6px ${color}88` }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color, minWidth: 20, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function SupplierReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today8601());
  const [dateTo, setDateTo] = useState(today8601());
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('summary'); // summary / detail

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logService.getAll({ limit: 1000, page: 1 });
      setLogs(res.data?.data || res.data?.logs || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Date filtered
  const dateLogs = logs.filter(l => {
    const dt = new Date(l.entryTime || l.createdAt || l.created);
    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T23:59:59');
    return dt >= from && dt <= to;
  });

  // Supplier groups (from 'others.supplier' field, fallback to driverName)
  const supplierGroups = {};
  dateLogs.forEach(log => {
    const o = parseOthers(log.others);
    const name = o.supplier || o.supplierName || o.partyName || log.driverName || log.vehicleNumber || 'Unknown';
    if (!supplierGroups[name]) supplierGroups[name] = [];
    supplierGroups[name].push(log);
  });
  const supplierList = Object.keys(supplierGroups).sort();
  const maxTrips = Math.max(...Object.values(supplierGroups).map(g => g.length), 1);

  // Detail table logs
  const detailLogs = (selectedSupplier ? supplierGroups[selectedSupplier] || [] : dateLogs)
    .filter(l => {
      const q = search.toLowerCase();
      return !search || l.vehicleNumber?.toLowerCase().includes(q) || l.driverName?.toLowerCase().includes(q);
    });

  const today = new Date().toDateString();
  const grandTotal = dateLogs.length;
  const todayTotal = logs.filter(l => new Date(l.entryTime || l.createdAt || l.created).toDateString() === today).length;
  const totalActive = logs.filter(l => !l.exitTime).length;

  return (
    <div style={{ animation: 'rowFadeIn 0.4s ease forwards' }}>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--gold)', fontWeight: 800 }}>📥 Supplier Daily Report</h2>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Supplier-wise trip analysis and load details</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>From</span>
          <input type="date" className="lux-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>To</span>
          <input type="date" className="lux-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} />
        </div>
        <select className="lux-select" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
          <option value="">All Suppliers</option>
          {supplierList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="lux-input" placeholder="Search plate / driver..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-outline" onClick={() => { setDateFrom(today8601()); setDateTo(today8601()); setSelectedSupplier(''); setSearch(''); }}>
          Today
        </button>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { icon: '🏭', label: 'Total Suppliers', value: supplierList.length, color: '#C8952A' },
          { icon: '🚛', label: "Period Trips", value: grandTotal, color: '#00CFFF' },
          { icon: '📅', label: "Today's Trips", value: todayTotal, color: '#00FF9C' },
          { icon: '📍', label: 'Currently Inside', value: totalActive, color: '#FF9800' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 130, background: 'var(--bg-card)', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['summary', '📊 Summary View'], ['detail', '📋 Detail View']].map(([val, label]) => (
          <button key={val} onClick={() => setViewMode(val)} style={{
            padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            borderRadius: 20, border: '1px solid',
            background: viewMode === val ? 'var(--gold)' : 'transparent',
            borderColor: viewMode === val ? 'var(--gold)' : 'var(--border)',
            color: viewMode === val ? '#000' : 'var(--text-dim)',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* SUMMARY VIEW */}
      {viewMode === 'summary' && (
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" />Supplier Summary</div>
            <span className="badge badge-gold">{supplierList.length} SUPPLIERS</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{ height: 180 }}><div className="loader-ring" style={{ width: 32, height: 32 }} /></div>
          ) : supplierList.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🏭</div><div className="empty-state-text">No supplier data found</div></div>
          ) : (
            <div className="lux-table-wrap">
              <table className="lux-table">
                <thead>
                  <tr><th>#</th><th>Supplier Name</th><th>Total Trips</th><th>Completed</th><th>In Progress</th><th>Trip Bar</th><th>Last Trip</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {supplierList.map((name, i) => {
                    const trips = supplierGroups[name] || [];
                    const completed = trips.filter(l => l.exitTime).length;
                    const active = trips.filter(l => !l.exitTime).length;
                    const last = trips.sort((a, b) => new Date(b.entryTime || b.createdAt) - new Date(a.entryTime || a.createdAt))[0];
                    const colors = ['#C8952A', '#00CFFF', '#00FF9C', '#9C27B0', '#FF9800'];
                    const color = colors[i % colors.length];
                    return (
                      <tr key={name}>
                        <td style={{ fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>{name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color, fontSize: 14, fontWeight: 800 }}>{trips.length}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#00FF9C', fontSize: 13 }}>{completed}</td>
                        <td>
                          {active > 0 ? (
                            <span className="badge badge-cyan"><span className="badge-dot" />{active} Inside</span>
                          ) : <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</span>}
                        </td>
                        <td style={{ minWidth: 120 }}><TripBar value={trips.length} max={maxTrips} color={color} /></td>
                        <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {last ? `${fmtDate(last.entryTime || last.createdAt)} ${fmtTime(last.entryTime)}` : '—'}
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => { setSelectedSupplier(name); setViewMode('detail'); }}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAIL VIEW */}
      {viewMode === 'detail' && (
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" />
              {selectedSupplier ? `📥 ${selectedSupplier}` : 'All Supplier Trips'}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {selectedSupplier && (
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedSupplier('')} style={{ padding: '4px 10px', fontSize: 11 }}>✕ All</button>
              )}
              <span className="badge badge-gold">{detailLogs.length} RECORDS</span>
            </div>
          </div>
          {loading ? (
            <div className="empty-state" style={{ height: 180 }}><div className="loader-ring" style={{ width: 32, height: 32 }} /></div>
          ) : detailLogs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No records found</div></div>
          ) : (
            <div className="lux-table-wrap">
              <table className="lux-table">
                <thead>
                  <tr><th>#</th><th>Supplier</th><th>License Plate</th><th>Driver</th><th>Entry</th><th>Exit</th><th>Duration</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {detailLogs.map((log, i) => {
                    const o = parseOthers(log.others);
                    const supplier = o.supplier || o.supplierName || o.partyName || log.driverName || log.vehicleNumber || 'Unknown';
                    const mins = log.durationMinutes || (log.exitTime ? Math.floor((new Date(log.exitTime) - new Date(log.entryTime)) / 60000) : null);
                    const dur = mins != null ? (mins > 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`) : '—';
                    return (
                      <tr key={log.id || i}>
                        <td style={{ fontSize: 12 }}>#{log.id}</td>
                        <td style={{ fontSize: 12, fontWeight: 600 }}>{supplier}</td>
                        <td>
                          <div className="plate" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                            <div className="plate-flag"><span>🇮🇳</span><span style={{ fontSize: 7 }}>IND</span></div>
                            <div className="plate-num">{log.vehicleNumber || '—'}</div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{log.driverName || '—'}</td>
                        <td style={{ fontSize: 11 }}>{fmtTime(log.entryTime)}<br /><span style={{ color: 'var(--text-dim)', fontSize: 10 }}>{fmtDate(log.entryTime || log.createdAt)}</span></td>
                        <td style={{ fontSize: 11, color: log.exitTime ? 'var(--green)' : 'var(--text-dim)' }}>{log.exitTime ? fmtTime(log.exitTime) : '—'}</td>
                        <td><span className="duration-chip">{dur}</span></td>
                        <td>{log.exitTime ? <span className="badge badge-dim">DONE</span> : <span className="badge badge-cyan"><span className="badge-dot" />ACTIVE</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
