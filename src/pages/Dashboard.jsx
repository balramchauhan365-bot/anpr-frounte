import { useState, useEffect, useMemo } from 'react';
import StatCard from '../components/StatCard';
import { logService } from '../services/logService';
import { vehicleService } from '../services/vehicleService';

const VEHICLE_ICONS = {
  car: '🚗', truck: '🚛', bike: '🏍️', motorcycle: '🏍️',
  van: '🚐', bus: '🚌', unknown: '🚘', auto: '🛺',
};
function plateIcon(type) { return VEHICLE_ICONS[type?.toLowerCase()] || '🚘'; }
function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function durationStr(minutes) {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function LicensePlate({ number }) {
  return (
    <div className="plate">
      <div className="plate-flag"><span>🇮🇳</span><span style={{ fontSize: 7 }}>IND</span></div>
      <div className="plate-num">{number || '—'}</div>
    </div>
  );
}

// ─── Simple Bar Chart ────────────────────────────────────────────────────────
function BarChart({ data, color = '#C8952A' }) {
  if (!data || data.length === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, padding: 20 }}>
      No data available
    </div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, padding: '0 4px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: color, fontWeight: 700 }}>{d.value || ''}</div>
            <div
              style={{
                width: '100%', background: color, opacity: d.highlighted ? 1 : 0.7,
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}px`,
                borderRadius: '3px 3px 0 0', minHeight: d.value > 0 ? 4 : 0,
                transition: 'height 0.4s ease',
                boxShadow: d.highlighted ? `0 0 14px ${color}` : `0 0 6px ${color}44`,
                border: d.highlighted ? `1px solid ${color}` : 'none',
              }}
            />
            <div className="bar-chart-label" style={{ fontSize: 9, color: d.highlighted ? color : 'var(--text-dim)', textAlign: 'center', lineHeight: 1.2, fontWeight: d.highlighted ? 700 : 400 }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Build chart data based on mode + filter ────────────────────────────────
function buildChartData(logs, mode, customDate, customMonth, customYear) {
  const now = new Date();

  if (mode === 'custom') {
    // Show hourly breakdown for the selected date
    const target = customDate ? new Date(customDate) : now;
    const targetStr = target.toDateString();
    const dayLogs = logs.filter(l => {
      const dt = l.entryTime || l.createdAt || l.created;
      return dt && new Date(dt).toDateString() === targetStr;
    });
    // 24 hours breakdown
    return Array.from({ length: 24 }).map((_, h) => ({
      label: h % 4 === 0 ? `${h}:00` : '',
      value: dayLogs.filter(l => {
        const dt = new Date(l.entryTime || l.createdAt || l.created);
        return dt.getHours() === h;
      }).length,
      highlighted: false,
    }));
  }

  if (mode === 'month') {
    // Show daily breakdown for selected month+year
    const yr = parseInt(customYear) || now.getFullYear();
    const mo = parseInt(customMonth) - 1 || now.getMonth();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const today = now.toDateString();
    return Array.from({ length: daysInMonth }).map((_, d) => {
      const day = new Date(yr, mo, d + 1);
      const count = logs.filter(l => {
        const dt = new Date(l.entryTime || l.createdAt || l.created);
        return dt.getDate() === d + 1 && dt.getMonth() === mo && dt.getFullYear() === yr;
      }).length;
      return {
        label: (d + 1) % 5 === 1 ? `${d + 1}` : '',
        value: count,
        highlighted: day.toDateString() === today,
      };
    });
  }

  if (mode === 'year') {
    // Show monthly breakdown for selected year
    const yr = parseInt(customYear) || now.getFullYear();
    return Array.from({ length: 12 }).map((_, m) => {
      const count = logs.filter(l => {
        const dt = new Date(l.entryTime || l.createdAt || l.created);
        return dt.getMonth() === m && dt.getFullYear() === yr;
      }).length;
      const isCurrentMonth = m === now.getMonth() && yr === now.getFullYear();
      return {
        label: new Date(yr, m, 1).toLocaleDateString('en-IN', { month: 'short' }),
        value: count,
        highlighted: isCurrentMonth,
      };
    });
  }

  if (mode === 'daily') {
    // Last 7 days
    const today = now.toDateString();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      const count = logs.filter(l => {
        const dt = l.entryTime || l.createdAt || l.created;
        return dt && new Date(dt).toDateString() === ds;
      }).length;
      return {
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        value: count,
        highlighted: ds === today,
      };
    });
  }

  if (mode === 'weekly') {
    return Array.from({ length: 4 }).map((_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const count = logs.filter(l => {
        const dt = new Date(l.entryTime || l.createdAt || l.created);
        return dt >= weekStart && dt <= weekEnd;
      }).length;
      return { label: `Wk ${i + 1}`, value: count, highlighted: i === 3 };
    });
  }

  // monthly — last 6 months
  return Array.from({ length: 6 }).map((_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const count = logs.filter(l => {
      const dt = new Date(l.entryTime || l.createdAt || l.created);
      return dt.getMonth() === m.getMonth() && dt.getFullYear() === m.getFullYear();
    }).length;
    const isCurrentMonth = m.getMonth() === now.getMonth() && m.getFullYear() === now.getFullYear();
    return {
      label: m.toLocaleDateString('en-IN', { month: 'short' }),
      value: count,
      highlighted: isCurrentMonth,
    };
  });
}

// ─── Filter input styles ─────────────────────────────────────────────────────
const filterInputStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-bright)',
  fontSize: 12,
  padding: '5px 10px',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  minWidth: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0, exits: 0, totalTrucks: 0 });
  const [activeVehicles, setActive] = useState([]);
  const [recentLogs, setRecent] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('daily');

  // Custom filter state
  const today = new Date();
  const [customDate, setCustomDate] = useState(today.toISOString().split('T')[0]);
  const [customMonth, setCustomMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [customYear, setCustomYear] = useState(String(today.getFullYear()));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [vehiclesRes, logsRes] = await Promise.all([
          vehicleService.getAll(),
          logService.getAll({ limit: 500, page: 1 }),
        ]);
        const vehicles = vehiclesRes.data?.data || vehiclesRes.data?.vehicles || vehiclesRes.data || [];
        const logs = logsRes.data?.data || logsRes.data?.logs || logsRes.data || [];
        const active = logs.filter(l => !l.exitTime && (l.status === 'active' || l.status === 'inside' || !l.status));
        const todayStr = new Date().toDateString();
        const todayLogs = logs.filter(l => {
          const date = l.created || l.createdAt || l.entryTime;
          return new Date(date).toDateString() === todayStr;
        });
        const trucks = logs.filter(l => l.vehicleType?.toLowerCase() === 'truck');
        setStats({
          total: vehicles.length || 0,
          active: active.length || 0,
          today: todayLogs.length || 0,
          exits: todayLogs.filter(l => l.exitTime).length || 0,
          totalTrucks: trucks.length || 0,
        });
        setActive(active.slice(0, 6));
        setRecent(logs.slice(0, 10));
        setAllLogs(logs);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const chartData = useMemo(
    () => buildChartData(allLogs, chartMode, customDate, customMonth, customYear),
    [allLogs, chartMode, customDate, customMonth, customYear]
  );

  const prodSummary = useMemo(() => {
    const todayStr = new Date().toDateString();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const todayCount = allLogs.filter(l => new Date(l.entryTime || l.createdAt || l.created).toDateString() === todayStr).length;
    const weekCount = allLogs.filter(l => new Date(l.entryTime || l.createdAt || l.created) >= startOfWeek).length;
    const monthCount = allLogs.filter(l => new Date(l.entryTime || l.createdAt || l.created) >= startOfMonth).length;
    return { todayCount, weekCount, monthCount };
  }, [allLogs]);

  const MODES = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'custom', label: 'Date' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  const chartTitle = () => {
    if (chartMode === 'daily') return 'LAST 7 DAYS — VEHICLE ENTRIES';
    if (chartMode === 'weekly') return 'LAST 4 WEEKS — VEHICLE ENTRIES';
    if (chartMode === 'monthly') return 'LAST 6 MONTHS — VEHICLE ENTRIES';
    if (chartMode === 'custom') return `${new Date(customDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} — HOURLY ENTRIES`;
    if (chartMode === 'month') return `${new Date(customYear, parseInt(customMonth) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} — DAILY ENTRIES`;
    if (chartMode === 'year') return `${customYear} — MONTHLY ENTRIES`;
    return '';
  };

  const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const YEARS = Array.from({ length: 5 }, (_, i) => String(today.getFullYear() - i));

  return (
    <div style={{ animation: 'rowFadeIn 0.4s ease forwards' }}>

      {/* ── STAT CARDS ── */}
      <div className="stat-grid">
        <StatCard label="Total Vehicles" value={stats.total} icon="🚘" color="#C8952A" sub="Registered in system" />
        <StatCard label="Currently Inside" value={stats.active} icon="📍" color="#00CFFF" sub="Active right now" trend={stats.active > 0 ? 'LIVE' : 'IDLE'} trendDir={stats.active > 0 ? 'up' : 'neutral'} />
        <StatCard label="Today's Entries" value={stats.today} icon="⬆" color="#00FF9C" sub="As of today" />
        <StatCard label="Total Trucks" value={stats.totalTrucks} icon="🚛" color="#FF9800" sub="All time truck entries" />
      </div>

      {/* ── PRODUCTION SUMMARY + GRAPH ── */}
      <div className="glass-panel" style={{ marginBottom: 20 }}>
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="panel-title">
            <span className="panel-title-dot" style={{ background: '#C8952A', boxShadow: '0 0 8px #C8952A' }} />
            Production Summary
          </div>
          {/* ─── MODE FILTER BUTTONS ─── */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => setChartMode(m.key)}
                style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  borderRadius: 20, border: '1px solid',
                  textTransform: 'uppercase', letterSpacing: 1,
                  background: chartMode === m.key ? 'var(--gold)' : 'transparent',
                  borderColor: chartMode === m.key ? 'var(--gold)' : 'var(--border)',
                  color: chartMode === m.key ? '#000' : 'var(--text-dim)',
                  transition: 'all 0.2s ease',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── CUSTOM FILTER INPUTS ─── */}
        {(chartMode === 'custom' || chartMode === 'month' || chartMode === 'year') && (
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            background: 'rgba(200,149,42,0.04)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, fontWeight: 600 }}>
              🔍 FILTER:
            </span>

            {chartMode === 'custom' && (
              <>
                <label style={{ fontSize: 11, color: 'var(--text-dim)' }}>Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  style={{ ...filterInputStyle, colorScheme: 'dark' }}
                />
              </>
            )}

            {chartMode === 'month' && (
              <>
                <label style={{ fontSize: 11, color: 'var(--text-dim)' }}>Month</label>
                <select value={customMonth} onChange={e => setCustomMonth(e.target.value)} style={filterInputStyle}>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={m}>{MONTH_NAMES[i]}</option>
                  ))}
                </select>
                <label style={{ fontSize: 11, color: 'var(--text-dim)' }}>Year</label>
                <select value={customYear} onChange={e => setCustomYear(e.target.value)} style={filterInputStyle}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            )}

            {chartMode === 'year' && (
              <>
                <label style={{ fontSize: 11, color: 'var(--text-dim)' }}>Year</label>
                <select value={customYear} onChange={e => setCustomYear(e.target.value)} style={filterInputStyle}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            )}

            {/* Quick count for selected period */}
            <span style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: 'var(--gold)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}>
              {chartData.reduce((s, d) => s + d.value, 0)} entries
            </span>
          </div>
        )}

        {/* Summary numbers row */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }} className="prod-summary-row">
          {[
            { label: 'Today', value: prodSummary.todayCount, color: '#00FF9C', mode: 'daily' },
            { label: 'This Week', value: prodSummary.weekCount, color: '#00CFFF', mode: 'weekly' },
            { label: 'This Month', value: prodSummary.monthCount, color: '#C8952A', mode: 'monthly' },
          ].map((s, i) => (
            <div
              key={i}
              onClick={() => setChartMode(s.mode)}
              style={{
                flex: 1, padding: '16px 20px', textAlign: 'center', cursor: 'pointer',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                background: chartMode === s.mode
                  ? `rgba(${s.color === '#C8952A' ? '200,149,42' : s.color === '#00FF9C' ? '0,255,156' : '0,207,255'},0.07)`
                  : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, letterSpacing: 1 }}>
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ padding: '20px 20px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1 }}>
            {chartTitle()}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div className="loader-ring" style={{ width: 30, height: 30, margin: '0 auto' }} />
            </div>
          ) : (
            <BarChart data={chartData} color="#C8952A" />
          )}
        </div>
      </div>

      {/* ── 2-COLUMN PANELS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* ACTIVE VEHICLES */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />
              Vehicles Inside Now
            </div>
            <span className="badge badge-cyan"><span className="badge-dot" />{stats.active} LIVE</span>
          </div>
          <div className="panel-body-np">
            {loading ? (
              <div className="empty-state"><div className="loader-ring" style={{ width: 30, height: 30 }} /></div>
            ) : activeVehicles.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🏁</div><div className="empty-state-text">No vehicles currently inside</div></div>
            ) : (
              activeVehicles.map((v, i) => (
                <div key={v.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)', animation: `rowFadeIn 0.3s ease ${i * 0.06}s forwards`, opacity: 0 }}>
                  <span style={{ fontSize: 24 }}>{plateIcon(v.vehicleType)}</span>
                  <div style={{ flex: 1 }}>
                    <LicensePlate number={v.vehicleNumber} />
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                      {v.driverName || 'Driver unknown'} · Entered {fmt(v.entryTime)}
                    </div>
                  </div>
                  <div className="duration-chip">⏱ {durationStr(v.minutesInside)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" />Recent Activity</div>
            <span className="badge badge-gold">LAST 10</span>
          </div>
          <div className="panel-body-np">
            {loading ? (
              <div className="empty-state"><div className="loader-ring" style={{ width: 30, height: 30 }} /></div>
            ) : recentLogs.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No logs found</div></div>
            ) : (
              recentLogs.map((log, i) => (
                <div key={log.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(200,149,42,0.06)', animation: `rowFadeIn 0.3s ease ${i * 0.05}s forwards`, opacity: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: log.exitTime ? 'var(--red-dim)' : 'var(--green-dim)', border: `1px solid ${log.exitTime ? 'rgba(255,56,96,0.3)' : 'rgba(0,255,156,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {log.exitTime ? '⬇' : '⬆'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-bright)', fontWeight: 700 }}>{log.vehicleNumber || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                      {log.vehicleType} · {fmtDate(log.created || log.createdAt || log.entryTime)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmt(log.entryTime)}</div>
                    {log.exitTime && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>{fmt(log.exitTime)}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div style={{ marginTop: 20, padding: '14px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
        <span>⚡</span>
        <span>Auto-refresh every <strong style={{ color: 'var(--gold)' }}>30 seconds</strong></span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>IST Timezone Active</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>ANPR Camera: <strong style={{ color: 'var(--green)' }}>ONLINE</strong></span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>Total Data: <strong style={{ color: 'var(--gold)' }}>{allLogs.length} records</strong></span>
      </div>
    </div>
  );
}
