/**
 * SupplierCustomer.jsx
 * Supplier & Customer Live Updates Page
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

// ─── Live update blip ─────────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#00FF9C', fontWeight: 700 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF9C', boxShadow: '0 0 6px #00FF9C', animation: 'pulse 1.5s infinite' }} />
      LIVE
    </span>
  );
}

// ─── Party summary card ───────────────────────────────────────────────────────
function PartyCard({ name, type, totalTrips, todayTrips, lastSeen, active, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 10,
      padding: '16px 18px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '0 10px 0 60px', background: `${color}15` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-bright)' }}>{name}</div>
          <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600, letterSpacing: 1 }}>{type.toUpperCase()}</div>
        </div>
        {active > 0 && <LiveBadge />}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{totalTrips}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>TOTAL TRIPS</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00FF9C', fontFamily: 'var(--font-mono)' }}>{todayTrips}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>TODAY</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00CFFF', fontFamily: 'var(--font-mono)' }}>{active}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>INSIDE</div>
        </div>
      </div>
      {lastSeen && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>Last seen: {lastSeen}</div>}
    </div>
  );
}

export default function SupplierCustomer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('supplier'); // supplier / customer / all
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logService.getAll({ limit: 1000, page: 1 });
      const all = res.data?.data || res.data?.logs || res.data || [];
      setLogs(all);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // refresh every 20s
    return () => clearInterval(id);
  }, [load]);

  const today = new Date().toDateString();

  // Build party map from logs
  // "supplier" = vehicles entering to deliver (entry only / type contains supplier)
  // "customer" = vehicles picking up (has exit / type contains customer)
  // Since data may not have party type, we group by driverName or vehicleNumber pattern
  const partyMap = {};
  logs.forEach(log => {
    const o = parseOthers(log.others);
    // Try to get party name from 'others' field, fallback to driverName, fallback to vehicleNumber
    const partyName = o.partyName || o.supplier || o.customer || o.party || log.driverName || log.vehicleNumber || 'Unknown';
    const partyType = o.partyType || o.type || (log.exitTime ? 'customer' : 'supplier');
    const key = partyName;
    if (!partyMap[key]) {
      partyMap[key] = { name: partyName, type: partyType, trips: [], active: 0 };
    }
    partyMap[key].trips.push(log);
    if (!log.exitTime) partyMap[key].active++;
  });

  const parties = Object.values(partyMap)
    .filter(p => tab === 'all' ? true : p.type === tab)
    .sort((a, b) => b.trips.length - a.trips.length);

  // Active vehicles right now
  const liveVehicles = logs.filter(l => !l.exitTime);

  return (
    <div style={{ animation: 'rowFadeIn 0.4s ease forwards' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--gold)', fontWeight: 800 }}>🏭 Supplier & Customer Live Updates</h2>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            Real-time party tracking · {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString('en-IN')}` : 'Loading...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LiveBadge />
          <button className="btn btn-outline" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Live summary row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { icon: '🚛', label: 'Currently Inside', value: liveVehicles.length, color: '#00FF9C' },
          { icon: '📦', label: 'Total Parties', value: Object.keys(partyMap).length, color: '#C8952A' },
          { icon: '📋', label: "Today's Trips", value: logs.filter(l => new Date(l.entryTime || l.createdAt || l.created).toDateString() === today).length, color: '#00CFFF' },
          { icon: '✅', label: 'Completed Today', value: logs.filter(l => l.exitTime && new Date(l.exitTime).toDateString() === today).length, color: '#9C27B0' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 130, background: 'var(--bg-card)', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['all', '👥 All Parties'], ['supplier', '📥 Suppliers'], ['customer', '📤 Customers']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            style={{
              padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              borderRadius: 20, border: '1px solid', letterSpacing: 0.5,
              background: tab === val ? 'var(--gold)' : 'transparent',
              borderColor: tab === val ? 'var(--gold)' : 'var(--border)',
              color: tab === val ? '#000' : 'var(--text-dim)',
              transition: 'all 0.2s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Party cards grid */}
      {loading ? (
        <div className="empty-state" style={{ height: 200 }}>
          <div className="loader-ring" style={{ width: 36, height: 36 }} />
          <div className="loader-text">LOADING PARTIES...</div>
        </div>
      ) : parties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏭</div>
          <div className="empty-state-text">No party data found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
          {parties.map((p, i) => {
            const todayTrips = p.trips.filter(l => new Date(l.entryTime || l.createdAt || l.created).toDateString() === today).length;
            const lastTrip = p.trips.sort((a, b) => new Date(b.entryTime || b.createdAt) - new Date(a.entryTime || a.createdAt))[0];
            const lastSeen = lastTrip ? `${fmtDate(lastTrip.entryTime || lastTrip.createdAt)} ${fmtTime(lastTrip.entryTime)}` : null;
            const color = p.type === 'supplier' ? '#00CFFF' : p.type === 'customer' ? '#C8952A' : '#9C27B0';
            return <PartyCard key={i} {...p} totalTrips={p.trips.length} todayTrips={todayTrips} lastSeen={lastSeen} color={color} />;
          })}
        </div>
      )}

      {/* Live vehicles table */}
      {liveVehicles.length > 0 && (
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: '#00FF9C', boxShadow: '0 0 8px #00FF9C' }} />
              Vehicles Inside Right Now
            </div>
            <LiveBadge />
          </div>
          <div className="lux-table-wrap">
            <table className="lux-table">
              <thead>
                <tr><th>Plate</th><th>Driver / Party</th><th>Type</th><th>Entry Time</th><th>Duration</th></tr>
              </thead>
              <tbody>
                {liveVehicles.map((l, i) => {
                  const mins = l.minutesInside || Math.floor((Date.now() - new Date(l.entryTime)) / 60000);
                  const dur = mins > 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
                  return (
                    <tr key={l.id || i}>
                      <td>
                        <div className="plate" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                          <div className="plate-flag"><span>🇮🇳</span><span style={{ fontSize: 7 }}>IND</span></div>
                          <div className="plate-num">{l.vehicleNumber}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{l.driverName || '—'}</td>
                      <td style={{ fontSize: 12, textTransform: 'capitalize' }}>🚛 {l.vehicleType}</td>
                      <td style={{ fontSize: 12 }}>{fmtTime(l.entryTime)}</td>
                      <td><span className="duration-chip">⏱ {dur}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
