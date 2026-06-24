import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { userService } from '../services/userService';

const ROLE_LABELS = { 1: 'Super Admin', 2: 'Admin', 3: 'Operator' };
const ROLE_COLORS = { 1: 'badge-gold', 2: 'badge-cyan', 3: 'badge-dim' };

const EMPTY_FORM = { name: '', mobile: '', password: '', roleId: 3, status: 1 };

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');

  const [addModal, setAddModal]   = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deactModal, setDeact]    = useState(null);

  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [showPass, setShowPass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.roleId = roleFilter;
      const res = await userService.getAll(params);
      setUsers(res.data?.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !search || u.name?.toLowerCase().includes(q) || u.mobile?.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    if (!form.name || !form.mobile || !form.password) {
      setFormErr('Name, mobile and password are required');
      return;
    }
    setSaving(true); setFormErr('');
    try {
      await userService.create(form);
      setAddModal(false); setForm(EMPTY_FORM); load();
    } catch(e) {
      setFormErr(e.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true); setFormErr('');
    const update = { name: form.name, mobile: form.mobile, roleId: form.roleId, status: form.status };
    if (form.password) update.password = form.password;
    try {
      await userService.update(editModal.id, update);
      setEditModal(null); load();
    } catch(e) {
      setFormErr(e.response?.data?.message || 'Failed to update user');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    try {
      await userService.deactivate(deactModal.id);
      setDeact(null); load();
    } catch(e) { alert(e.response?.data?.message || 'Failed to deactivate'); }
  };

  const openEdit = (u) => {
    setForm({ name: u.name, mobile: u.mobile, password: '', roleId: u.roleId, status: u.status });
    setFormErr(''); setShowPass(false); setEditModal(u);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErr(''); setShowPass(false); setAddModal(true);
  };

  const adminCount = users.filter(u => u.roleId <= 2).length;
  const activeCount = users.filter(u => u.status === 1).length;

  return (
    <div>
      {/* TOP ROW */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Total Users', val: users.length, col: 'var(--gold-light)' },
          { label: 'Active', val: activeCount, col: 'var(--green)' },
          { label: 'Admins', val: adminCount, col: 'var(--cyan)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: s.col }}>{s.val}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: 1 }}>{s.label.toUpperCase()}</span>
          </div>
        ))}
        <button className="btn btn-gold" style={{ marginLeft: 'auto' }} onClick={openAdd}>
          ＋ Add User
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 2 }}>
          <span className="search-icon">🔍</span>
          <input
            className="lux-input"
            placeholder="Search by name or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="lux-select" value={roleFilter} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="1">Super Admin</option>
          <option value="2">Admin</option>
          <option value="3">Operator</option>
        </select>
        <button className="btn btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* USER CARDS GRID */}
      {loading ? (
        <div className="empty-state" style={{ height: 200 }}>
          <div className="loader-ring" style={{ width: 36, height: 36 }} />
          <div className="loader-text">LOADING USERS</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-text">No users found</div>
          <button className="btn btn-gold btn-sm" onClick={openAdd}>Add First User</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((u, i) => (
            <div
              key={u.id}
              className="glass-panel"
              style={{
                padding: 20,
                animation: `rowFadeIn 0.3s ease ${i * 0.06}s forwards`,
                opacity: 0,
                cursor: 'default',
                transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
                e.currentTarget.style.borderColor = 'var(--border-bright)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.transform = '';
              }}
            >
              {/* User Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: '50%',
                  background: u.status === 1
                    ? 'linear-gradient(135deg, var(--gold-dim), var(--bg-surface))'
                    : 'var(--bg-surface)',
                  border: `1px solid ${u.status === 1 ? 'var(--border-bright)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: u.status === 1 ? 'var(--gold-light)' : 'var(--text-dim)',
                  flexShrink: 0,
                }}>
                  {initials(u.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name}
                  </div>
                  <span className={`badge ${ROLE_COLORS[u.roleId] || 'badge-dim'}`} style={{ fontSize: 10 }}>
                    {ROLE_LABELS[u.roleId] || `Role ${u.roleId}`}
                  </span>
                </div>
                {u.status === 1 ? (
                  <span className="badge badge-green" style={{ fontSize: 9, flexShrink: 0 }}>
                    <span className="badge-dot" />ACTIVE
                  </span>
                ) : (
                  <span className="badge badge-red" style={{ fontSize: 9, flexShrink: 0 }}>INACTIVE</span>
                )}
              </div>

              {/* User Details */}
              <div style={{
                background: 'var(--bg-void)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>📱</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-body)' }}>
                    {u.mobile}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🗓</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    Joined {new Date(u.created).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => openEdit(u)}
                >✏️ Edit</button>
                {u.status === 1 && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeact(u)}
                  >⏻ Deactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD USER MODAL */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add New User"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleAdd} disabled={saving}>
              {saving ? 'Creating...' : '＋ Create User'}
            </button>
          </>
        }
      >
        {formErr && <div className="login-error">⚠ {formErr}</div>}
        <div className="input-group">
          <label className="input-label">Full Name *</label>
          <input className="lux-input" placeholder="Enter full name" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="input-label">Mobile Number *</label>
          <input className="lux-input" type="tel" placeholder="10-digit mobile" value={form.mobile}
            onChange={e => setForm({...form, mobile: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="input-label">Password *</label>
          <div style={{ position: 'relative' }}>
            <input
              className="lux-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Set password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              style={{ paddingRight: 44 }}
            />
            <button
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16,
              }}
            >{showPass ? '🙈' : '👁'}</button>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Role</label>
          <select className="lux-select w-full" value={form.roleId}
            onChange={e => setForm({...form, roleId: Number(e.target.value)})}>
            <option value={1}>Super Admin</option>
            <option value={2}>Admin</option>
            <option value={3}>Operator</option>
          </select>
        </div>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={`Edit User — ${editModal?.name}`}
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
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input className="lux-input" placeholder="Full name" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="input-label">Mobile Number</label>
          <input className="lux-input" type="tel" placeholder="Mobile" value={form.mobile}
            onChange={e => setForm({...form, mobile: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="input-label">New Password <span style={{ color: 'var(--text-muted)' }}>(leave blank to keep)</span></label>
          <div style={{ position: 'relative' }}>
            <input
              className="lux-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Leave blank to keep current"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              style={{ paddingRight: 44 }}
            />
            <button
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16,
              }}
            >{showPass ? '🙈' : '👁'}</button>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Role</label>
          <select className="lux-select w-full" value={form.roleId}
            onChange={e => setForm({...form, roleId: Number(e.target.value)})}>
            <option value={1}>Super Admin</option>
            <option value={2}>Admin</option>
            <option value={3}>Operator</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Status</label>
          <select className="lux-select w-full" value={form.status}
            onChange={e => setForm({...form, status: Number(e.target.value)})}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </Modal>

      {/* DEACTIVATE MODAL */}
      <Modal
        open={!!deactModal}
        onClose={() => setDeact(null)}
        title="Deactivate User"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeact(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeactivate}>⏻ Deactivate</button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: 'var(--text-bright)', marginBottom: 6 }}>Deactivate user?</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold-light)', marginBottom: 8 }}>
            {deactModal?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            This user will no longer be able to log in. You can re-activate them later via edit.
          </div>
        </div>
      </Modal>
    </div>
  );
}
