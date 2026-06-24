import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { vehicleService } from '../services/vehicleService';

const VEHICLE_TYPES = ['car', 'truck', 'bike', 'motorcycle', 'van', 'bus', 'auto', 'unknown'];
const VEHICLE_ICONS = {
  car: '🚗', truck: '🚛', bike: '🏍️', motorcycle: '🏍️',
  van: '🚐', bus: '🚌', unknown: '🚘', auto: '🛺'
};
function plateIcon(t) { return VEHICLE_ICONS[t?.toLowerCase()] || '🚘'; }

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

const EMPTY_FORM = { vehicleNumber: '', driverName: '', vehicleType: 'car', status: 'active' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('');
  const [statusFilter, setStatus] = useState('');

  const [addModal, setAddModal]   = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [delModal, setDelModal]   = useState(null);

  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter)   params.type   = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (search)       params.search = search;
      const res = await vehicleService.getAll(params);
      setVehicles(res.data?.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.vehicleNumber.trim()) { setFormErr('Vehicle number is required'); return; }
    setSaving(true); setFormErr('');
    try {
      await vehicleService.create(form);
      setAddModal(false); setForm(EMPTY_FORM); load();
    } catch(e) {
      setFormErr(e.response?.data?.message || 'Failed to create vehicle');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true); setFormErr('');
    try {
      await vehicleService.update(editModal.id, {
        driverName: form.driverName,
        vehicleType: form.vehicleType,
        status: form.status,
      });
      setEditModal(null); load();
    } catch(e) {
      setFormErr(e.response?.data?.message || 'Failed to update vehicle');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await vehicleService.delete(delModal.id);
      setDelModal(null); load();
    } catch(e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  const openEdit = (v) => {
    setForm({ vehicleNumber: v.vehicleNumber, driverName: v.driverName || '', vehicleType: v.vehicleType || 'car', status: v.status });
    setFormErr('');
    setEditModal(v);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErr(''); setAddModal(true);
  };

  const typeCount = {};
  vehicles.forEach(v => { typeCount[v.vehicleType] = (typeCount[v.vehicleType] || 0) + 1; });
  const activeCount = vehicles.filter(v => v.status === 'active').length;

  return (
    <div>
      {/* TOP STAT ROW */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', val: vehicles.length, color: 'var(--gold-light)' },
          { label: 'Active', val: activeCount, color: 'var(--green)' },
          { label: 'Inactive', val: vehicles.length - activeCount, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: s.color }}>
              {s.val}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: 1 }}>{s.label.toUpperCase()}</span>
          </div>
        ))}

        {/* Type breakdown pills */}
        {Object.entries(typeCount).map(([type, cnt]) => (
          <div key={type} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13,
          }}>
            <span>{plateIcon(type)}</span>
            <span style={{ color: 'var(--text-dim)', textTransform: 'capitalize' }}>{type}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold-light)', fontWeight: 700 }}>{cnt}</span>
          </div>
        ))}

        <button className="btn btn-gold" style={{ marginLeft: 'auto' }} onClick={openAdd}>
          ＋ Register Vehicle
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 2 }}>
          <span className="search-icon">🔍</span>
          <input
            className="lux-input"
            placeholder="Search by plate number or driver name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="lux-select" value={typeFilter} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {VEHICLE_TYPES.map(t => (
            <option key={t} value={t}>{plateIcon(t)} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select className="lux-select" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* TABLE */}
      <div className="glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span className="panel-title-dot" />
            Registered Vehicles
          </div>
          <span className="badge badge-gold">{vehicles.length} VEHICLES</span>
        </div>

        <div className="lux-table-wrap">
          {loading ? (
            <div className="empty-state" style={{ height: 200 }}>
              <div className="loader-ring" style={{ width: 36, height: 36 }} />
              <div className="loader-text">LOADING VEHICLES</div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚘</div>
              <div className="empty-state-text">No vehicles found</div>
              <button className="btn btn-gold btn-sm" onClick={openAdd}>Register First Vehicle</button>
            </div>
          ) : (
            <table className="lux-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>vehicle NUMBER Plate</th>
                  <th>Vehicle Type</th>
                  <th>Driver Name</th>
                  <th>Status</th>
                  <th>Registered On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr key={v.id} style={{ animationDelay: `${i * 0.035}s` }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>#{v.id}</td>
                    <td><LicensePlate number={v.vehicleNumber} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{plateIcon(v.vehicleType)}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-body)', textTransform: 'capitalize' }}>
                          {v.vehicleType || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-body)' }}>
                      {v.driverName || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {v.status === 'active' ? (
                        <span className="badge badge-green">Active</span>
                      ) : v.status === 'deleted' ? (
                        <span className="badge badge-red">Deleted</span>
                      ) : (
                        <span className="badge badge-dim">{v.status}</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(v.created).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)} title="Edit">✏️</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDelModal(v)}
                          title="Soft Delete"
                          disabled={v.status === 'deleted'}
                        >🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Register New Vehicle"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleAdd} disabled={saving}>
              {saving ? 'Registering...' : '＋ Register'}
            </button>
          </>
        }
      >
        {formErr && <div className="login-error">⚠ {formErr}</div>}
        <div className="input-group">
          <label className="input-label">Vehicle Number *</label>
          <input className="lux-input" placeholder="e.g. RJ14 AB 1234" value={form.vehicleNumber}
            onChange={e => setForm({...form, vehicleNumber: e.target.value.toUpperCase()})} />
        </div>
        <div className="input-group">
          <label className="input-label">Driver Name</label>
          <input className="lux-input" placeholder="Full name" value={form.driverName}
            onChange={e => setForm({...form, driverName: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="input-label">Vehicle Type</label>
          <select className="lux-select w-full" value={form.vehicleType}
            onChange={e => setForm({...form, vehicleType: e.target.value})}>
            {VEHICLE_TYPES.map(t => (
              <option key={t} value={t}>{plateIcon(t)} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={`Edit — ${editModal?.vehicleNumber}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleEdit} disabled={saving}>
              {saving ? 'Saving...' : '✓ Save Changes'}
            </button>
          </>
        }
      >
        {formErr && <div className="login-error">⚠ {formErr}</div>}
        <div style={{ marginBottom: 8 }}><LicensePlate number={editModal?.vehicleNumber} /></div>
        <div className="input-group">
          <label className="input-label">Driver Name</label>
          <input className="lux-input" placeholder="Full name" value={form.driverName}
            onChange={e => setForm({...form, driverName: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="input-label">Vehicle Type</label>
          <select className="lux-select w-full" value={form.vehicleType}
            onChange={e => setForm({...form, vehicleType: e.target.value})}>
            {VEHICLE_TYPES.map(t => (
              <option key={t} value={t}>{plateIcon(t)} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Status</label>
          <select className="lux-select w-full" value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Modal>

      {/* DELETE CONFIRM */}
      <Modal
        open={!!delModal}
        onClose={() => setDelModal(null)}
        title="Confirm Delete"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDelModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>🗑 Delete</button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: 'var(--text-bright)', marginBottom: 10 }}>
            Are you sure you want to delete
          </div>
          <LicensePlate number={delModal?.vehicleNumber} />
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 12 }}>
            This is a soft delete — vehicle will be marked as deleted but not removed from the database.
          </div>
        </div>
      </Modal>
    </div>
  );
}
