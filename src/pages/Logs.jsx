/**
 * Logs.jsx — Vehicle Entry/Exit Logs Page
 * ─────────────────────────────────────────
 * Features:
 *  - CCTV se captured plateImage + vehicleImage frontend mein dikhata hai
 *  - Image modal: click karke bada dekho plate + vehicle image
 *  - Search, filter (Inside/Exited), pagination
 *  - Manual exit button
 *  - Source badge: AI Camera / Manual
 *  - CSS: existing project ke CSS variables se match karta hai
 */

import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { logService } from '../services/logService';

// ─── Vehicle type emoji map ────────────────────────────────────────────────────
const VEHICLE_ICONS = {
  car:        '🚗',
  truck:      '🚛',
  bike:       '🏍️',
  motorcycle: '🏍️',
  van:        '🚐',
  bus:        '🚌',
  unknown:    '🚘',
  auto:       '🛺',
};

function vehicleIcon(type) {
  return VEHICLE_ICONS[type?.toLowerCase()] || '🚘';
}

// ─── Indian license plate render ──────────────────────────────────────────────
// Exactly tera pehle wala LicensePlate component — koi change nahi
function LicensePlate({ number }) {
  return (
    <div className="plate">
      <div className="plate-flag">
        <span>🇮🇳</span>
        <span style={{ fontSize: 7 }}>IND</span>
      </div>
      <div className="plate-num">{number || '—'}</div>
    </div>
  );
}

// ─── Date format helpers ───────────────────────────────────────────────────────
function fmt(dt, full = false) {
  if (!dt) return null;
  const d = new Date(dt);
  if (full) {
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
}

// ─── others JSON parse ────────────────────────────────────────────────────────
function parseOthers(others) {
  if (!others) return {};
  try {
    return typeof others === 'string' ? JSON.parse(others) : others;
  } catch {
    return {};
  }
}

// ─── CCTV Image Component ─────────────────────────────────────────────────────
// base64 JPEG string se <img> tag banata hai — real CCTV image dikhata hai
function CctvImage({ b64, alt, style = {}, onClick }) {
  // Agar image nahi hai to placeholder dikhao
  if (!b64) {
    return (
      <div
        style={{
          width:           style.width  || 60,
          height:          style.height || 38,
          background:      'var(--bg-3, #1a1a2e)',
          border:          '1px solid var(--border, #2a2a4a)',
          borderRadius:    4,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          color:           'var(--text-3, #555)',
          fontSize:        10,
          cursor:          'default',
          userSelect:      'none',
        }}
        title="No image captured"
      >
        📷
      </div>
    );
  }

  return (
    <img
      src={`data:image/jpeg;base64,${b64}`}
      alt={alt || 'CCTV'}
      title={`Click to enlarge — ${alt}`}
      onClick={onClick}
      style={{
        width:        style.width  || 60,
        height:       style.height || 38,
        objectFit:    'cover',
        borderRadius: 4,
        border:       '1px solid var(--border, #2a2a4a)',
        cursor:       onClick ? 'pointer' : 'default',
        transition:   'transform 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.transform = 'scale(1.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    />
  );
}

// ─── Image Detail Modal ────────────────────────────────────────────────────────
// Click karo plate ya vehicle thumbnail par → bada image modal mein dikhega
function ImageModal({ log, onClose }) {
  if (!log) return null;

  return (
    <Modal
      open={!!log}
      onClose={onClose}
      title={`📷 CCTV Images — ${log.vehicleNumber || ''}`}
      footer={
        <button className="btn btn-outline" onClick={onClose}>
          Close
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Vehicle info summary */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          padding:        '10px 14px',
          background:     'var(--bg-2, #111)',
          borderRadius:   8,
          border:         '1px solid var(--border, #2a2a4a)',
        }}>
          <LicensePlate number={log.vehicleNumber} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2, #aaa)', marginBottom: 2 }}>
              {vehicleIcon(log.vehicleType)} {log.vehicleType?.toUpperCase() || 'UNKNOWN'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3, #666)' }}>
              Driver: {log.driverName || 'Unknown'} &nbsp;|&nbsp; Entry: {fmt(log.entryTime, true)}
            </div>
            {log.exitTime && (
              <div style={{ fontSize: 11, color: 'var(--text-3, #666)' }}>
                Exit: {fmt(log.exitTime, true)} &nbsp;|&nbsp; Duration: {log.durationMinutes} min
              </div>
            )}
          </div>
        </div>

        {/* Images side by side */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

          {/* Plate image — CCTV se captured number plate crop */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, marginBottom: 6,
              color: 'var(--text-2, #aaa)', letterSpacing: 1,
            }}>
              🔢 PLATE (CCTV Crop)
            </div>
            {log.plateImage ? (
              <img
                src={`data:image/jpeg;base64,${log.plateImage}`}
                alt="License Plate"
                style={{
                  width:        '100%',
                  maxWidth:     280,
                  borderRadius: 6,
                  border:       '2px solid var(--accent, #4a9eff)',
                  imageRendering: 'auto',
                }}
              />
            ) : (
              <div style={{
                height:          80,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                background:      'var(--bg-3, #1a1a2e)',
                border:          '1px dashed var(--border, #333)',
                borderRadius:    6,
                color:           'var(--text-3, #555)',
                fontSize:        12,
              }}>
                No plate image
              </div>
            )}
          </div>

          {/* Vehicle image — full vehicle CCTV crop */}
          <div style={{ flex: 2, minWidth: 200 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, marginBottom: 6,
              color: 'var(--text-2, #aaa)', letterSpacing: 1,
            }}>
              🚛 VEHICLE (CCTV Frame)
            </div>
            {log.vehicleImage ? (
              <img
                src={`data:image/jpeg;base64,${log.vehicleImage}`}
                alt="Vehicle"
                style={{
                  width:        '100%',
                  maxWidth:     400,
                  borderRadius: 6,
                  border:       '2px solid var(--accent, #4a9eff)',
                  imageRendering: 'auto',
                }}
              />
            ) : (
              <div style={{
                height:          120,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                background:      'var(--bg-3, #1a1a2e)',
                border:          '1px dashed var(--border, #333)',
                borderRadius:    6,
                color:           'var(--text-3, #555)',
                fontSize:        12,
              }}>
                No vehicle image
              </div>
            )}
          </div>

        </div>

        {/* Cargo info agar others mein hai (truck ke liye) */}
        {(() => {
          const o = parseOthers(log.others);
          if (!o.cargo || o.cargo === 'N/A') return null;
          return (
            <div style={{
              padding:      '8px 12px',
              background:   'var(--bg-2, #111)',
              border:       '1px solid var(--border, #2a2a4a)',
              borderRadius: 6,
              fontSize:     12,
              color:        'var(--text-1, #ddd)',
            }}>
              🪨 <strong>Cargo Detected:</strong> {o.cargo}
            </div>
          );
        })()}

      </div>
    </Modal>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
//  MAIN LOGS COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function Logs() {
  // ── State ──
  const [logs,         setLogs]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatus]       = useState('');
  const [exitModal,    setExitModal]    = useState(null);   // exit confirm modal
  const [imgModal,     setImgModal]     = useState(null);   // CCTV image modal
  const [exiting,      setExiting]      = useState(false);

  const LIMIT = 15;

  // ── Load logs from backend ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logService.getAll({ page, limit: LIMIT });
      setLogs(res.data?.data   || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error('[Logs] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Client-side filter (search + status) ──
  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      l.vehicleNumber?.toLowerCase().includes(q) ||
      l.driverName?.toLowerCase().includes(q)    ||
      l.vehicleType?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === ''       ? true
      : statusFilter === 'active'  ? !l.exitTime
      : statusFilter === 'exited'  ? !!l.exitTime
      : true;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(total / LIMIT);

  // ── Exit handler ──
  const handleExit = async () => {
    if (!exitModal) return;
    setExiting(true);
    try {
      await logService.logExit({ vehicleNumber: exitModal.vehicleNumber });
      setExitModal(null);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Exit failed');
    } finally {
      setExiting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── FILTER BAR ── */}
      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="lux-input"
            placeholder="Search by plate, driver, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="lux-select"
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Still Inside</option>
          <option value="exited">Exited</option>
        </select>

        <button className="btn btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* ── TABLE PANEL ── */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span className="panel-title-dot" />
            Vehicle Entry / Exit Logs
          </div>
          <span className="badge badge-gold">{total} TOTAL</span>
        </div>

        <div className="lux-table-wrap">

          {loading ? (
            <div className="empty-state" style={{ height: 200 }}>
              <div className="loader-ring" style={{ width: 36, height: 36 }} />
              <div className="loader-text">LOADING LOGS</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No logs found</div>
            </div>
          ) : (
            <table className="lux-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>License Plate</th>
                  <th>Type</th>
                  <th>Driver</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  {/* ✅ CCTV image columns */}
                  <th title="Plate image from CCTV">Plate 📷</th>
                  <th title="Vehicle image from CCTV">Vehicle 📷</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((log, i) => {
                  const others   = parseOthers(log.others);
                  const isActive = !log.exitTime;

                  // Source: Python ne kaise detect kiya
                  const sourceLabel =
                    others.detectedBy === 'anpr-http-api'    ? '🤖 AI Camera'
                    : others.detectedBy === 'anpr-camera'    ? '📷 Camera'
                    : others.detectedBy === 'ai-python-system' ? '🤖 AI'
                    : '👤 Manual';

                  return (
                    <tr key={log.id} style={{ animationDelay: `${i * 0.03}s` }}>

                      {/* Log ID */}
                      <td style={{ fontSize: 12 }}>#{log.id}</td>

                      {/* License plate badge */}
                      <td><LicensePlate number={log.vehicleNumber} /></td>

                      {/* Vehicle type */}
                      <td style={{ fontSize: 12, textTransform: 'capitalize' }}>
                        {vehicleIcon(log.vehicleType)} {log.vehicleType || '—'}
                      </td>

                      {/* Driver name */}
                      <td style={{ fontSize: 12 }}>{log.driverName || 'Unknown'}</td>

                      {/* Entry time */}
                      <td style={{ fontSize: 12 }}>{fmt(log.entryTime)}</td>

                      {/* Exit time */}
                      <td style={{ fontSize: 12 }}>
                        {log.exitTime ? fmt(log.exitTime) : '—'}
                      </td>

                      {/* ✅ PLATE IMAGE — thumbnail, click karo bada dikhega */}
                      <td>
                        <CctvImage
                          b64={log.plateImage}
                          alt="Plate"
                          style={{ width: 64, height: 36 }}
                          onClick={
                            log.plateImage || log.vehicleImage
                              ? () => setImgModal(log)
                              : undefined
                          }
                        />
                      </td>

                      {/* ✅ VEHICLE IMAGE — thumbnail, click karo bada dikhega */}
                      <td>
                        <CctvImage
                          b64={log.vehicleImage}
                          alt="Vehicle"
                          style={{ width: 64, height: 36 }}
                          onClick={
                            log.plateImage || log.vehicleImage
                              ? () => setImgModal(log)
                              : undefined
                          }
                        />
                      </td>

                      {/* Source badge */}
                      <td style={{ fontSize: 11 }}>{sourceLabel}</td>

                      {/* Status badge */}
                      <td>
                        {isActive ? (
                          <span className="badge badge-green">INSIDE</span>
                        ) : (
                          <span className="badge badge-dim">EXITED</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {/* View images button */}
                          {(log.plateImage || log.vehicleImage) && (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={() => setImgModal(log)}
                              title="View CCTV images"
                            >
                              📷
                            </button>
                          )}
                          {/* Manual exit button */}
                          {isActive && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setExitModal(log)}
                            >
                              Exit
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div style={{
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
            gap:            8,
            padding:        '12px 0 4px',
          }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-2, #aaa)' }}>
              Page {page} / {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        )}

      </div>

      {/* ── EXIT CONFIRM MODAL ── */}
      <Modal
        open={!!exitModal}
        onClose={() => setExitModal(null)}
        title="Confirm Exit"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setExitModal(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleExit} disabled={exiting}>
              {exiting ? 'Processing…' : 'Mark Exit'}
            </button>
          </>
        }
      >
        {exitModal && (
          <div style={{ textAlign: 'center' }}>
            <LicensePlate number={exitModal.vehicleNumber} />
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-2, #aaa)' }}>
              Entry: {fmt(exitModal.entryTime, true)}
            </p>
            {(exitModal.plateImage || exitModal.vehicleImage) && (
              <div style={{
                marginTop:      10,
                display:        'flex',
                gap:            10,
                justifyContent: 'center',
              }}>
                {exitModal.plateImage && (
                  <img
                    src={`data:image/jpeg;base64,${exitModal.plateImage}`}
                    alt="plate"
                    style={{ height: 40, borderRadius: 4, border: '1px solid var(--border, #333)' }}
                  />
                )}
                {exitModal.vehicleImage && (
                  <img
                    src={`data:image/jpeg;base64,${exitModal.vehicleImage}`}
                    alt="vehicle"
                    style={{ height: 40, borderRadius: 4, border: '1px solid var(--border, #333)' }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── CCTV IMAGE DETAIL MODAL ── */}
      <ImageModal log={imgModal} onClose={() => setImgModal(null)} />

    </div>
  );
}
