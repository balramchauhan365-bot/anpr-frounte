/**
 * PartyReport.jsx — Party Wise Daily Report
 * Har party ka alag report — kitne trips, kitna load
 */
import { useState, useEffect, useCallback } from 'react';
import { logService } from '../services/logService';

function fmtTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function parseOthers(o) {
  if (!o) return {};
  try { return typeof o === 'string' ? JSON.parse(o) : o; } catch { return {}; }
}
function today8601() { return new Date().toISOString().split('T')[0]; }

export default function PartyReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today8601());
  const [dateTo, setDateTo] = useState(today8601());
  const [selectedParty, setSelectedParty] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logService.getAll({ limit: 1000, page: 1 });
      setLogs(res.data?.data || res.data?.logs || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Date filtered logs
  const dateLogs = logs.filter(l => {
    const dt = new Date(l.entryTime || l.createdAt || l.created);
    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T23:59:59');
    return dt >= from && dt <= to;
  });

  // Build party groups
  const partyGroups = {};
  dateLogs.forEach(log => {
    const o = parseOthers(log.others);
    const name = o.partyName || o.supplier || o.customer || o.party || log.driverName || log.vehicleNumber || 'Unknown';
    if (!partyGroups[name]) partyGroups[name] = [];
    partyGroups[name].push(log);
  });
  const partyList = Object.keys(partyGroups).sort();

  // Filtered detail logs
  const detailLogs = (selectedParty ? partyGroups[selectedParty] || [] : dateLogs).filter(l => {
    const q = search.toLowerCase();
    return !search || l.vehicleNumber?.toLowerCase().includes(q) || l.driverName?.toLowerCase().includes(q);
  });

  const totalTrips = detailLogs.length;
  const completed = detailLogs.filter(l => l.exitTime).length;

  return (
    <div style={{ animation: 'rowFadeIn 0.4s ease forwards' }}>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: 'var(--gold)', fontWeight: 800 }}>👥 Party Wise Daily Report</h2>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Har party ka trip history aur summary</div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>From</span>
          <input type="date" className="lux-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>To</span>
          <input type="date" className="lux-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} />
        </div>
        <select className="lux-select" value={selectedParty} onChange={e => setSelectedParty(e.target.value)}>
          <option value="">All Parties</option>
          {partyList.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="lux-input" placeholder="Search plate / driver..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-outline" onClick={() => { setDateFrom(today8601()); setDateTo(today8601()); setSelectedParty(''); setSearch(''); }}>Reset</button>
        <button className="btn btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* Party summary cards */}
      {!selectedParty && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
          {partyList.slice(0, 12).map((name, i) => {
            const trips = partyGroups[name] || [];
            const active = trips.filter(l => !l.exitTime).length;
            const done = trips.filter(l => l.exitTime).length;
            const colors = ['#C8952A', '#00CFFF', '#00FF9C', '#9C27B0', '#FF9800'];
            const color = colors[i % colors.length];
            return (
              <div
                key={name}
                onClick={() => setSelectedParty(name)}
                style={{
                  background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 10,
                  padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${color}33`}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div><div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{trips.length}</div><div style={{ fontSize: 9, color: 'var(--text-dim)' }}>TRIPS</div></div>
                  <div><div style={{ fontSize: 20, fontWeight: 800, color: '#00FF9C', fontFamily: 'var(--font-mono)' }}>{active}</div><div style={{ fontSize: 9, color: 'var(--text-dim)' }}>INSIDE</div></div>
                  <div><div style={{ fontSize: 20, fontWeight: 800, color: '#555', fontFamily: 'var(--font-mono)' }}>{done}</div><div style={{ fontSize: 9, color: 'var(--text-dim)' }}>DONE</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail table */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span className="panel-title-dot" />
            {selectedParty ? `📋 ${selectedParty} — Trip Details` : 'All Party Trips'}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selectedParty && (
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedParty('')} style={{ padding: '4px 10px', fontSize: 11 }}>✕ Clear</button>
            )}
            <span className="badge badge-gold">{totalTrips} RECORDS</span>
          </div>
        </div>

        {/* Quick stats for selected party */}
        {selectedParty && (
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Total Trips', value: totalTrips, color: '#C8952A' },
              { label: 'Completed', value: completed, color: '#00FF9C' },
              { label: 'In Progress', value: totalTrips - completed, color: '#00CFFF' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '12px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}

        <div className="lux-table-wrap">
          {loading ? (
            <div className="empty-state" style={{ height: 180 }}>
              <div className="loader-ring" style={{ width: 32, height: 32 }} />
            </div>
          ) : detailLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No records found</div>
            </div>
          ) : (
            <table className="lux-table">
              <thead>
                <tr><th>#</th><th>Party</th><th>License Plate</th><th>Driver</th><th>Entry</th><th>Exit</th><th>Status</th></tr>
              </thead>
              <tbody>
                {detailLogs.map((log, i) => {
                  const o = parseOthers(log.others);
                  const party = o.partyName || o.supplier || o.customer || o.party || log.driverName || log.vehicleNumber || 'Unknown';
                  return (
                    <tr key={log.id || i}>
                      <td style={{ fontSize: 12 }}>#{log.id}</td>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>{party}</td>
                      <td>
                        <div className="plate" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                          <div className="plate-flag"><span>🇮🇳</span><span style={{ fontSize: 7 }}>IND</span></div>
                          <div className="plate-num">{log.vehicleNumber || '—'}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{log.driverName || '—'}</td>
                      <td style={{ fontSize: 11 }}>{fmtTime(log.entryTime)}<br /><span style={{ color: 'var(--text-dim)', fontSize: 10 }}>{fmtDate(log.entryTime)}</span></td>
                      <td style={{ fontSize: 11, color: log.exitTime ? 'var(--green)' : 'var(--text-dim)' }}>
                        {log.exitTime ? fmtTime(log.exitTime) : '—'}
                      </td>
                      <td>{log.exitTime ? <span className="badge badge-dim">DONE</span> : <span className="badge badge-cyan"><span className="badge-dot" />ACTIVE</span>}</td>
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
