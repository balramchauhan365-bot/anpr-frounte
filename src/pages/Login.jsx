import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

export default function Login() {
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.mobile || !form.password) {
      setError('Mobile and password are required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await userService.login(form);

      if (res.data?.success) {
        login(
          res.data.user || {
            name: 'Premium Admin',
            mobile: form.mobile,
          }
        );

        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Login failed');
      }
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
        'Server connection error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => e.key === 'Enter' && handleSubmit();

  return (
    <div className="login-page" style={{ position: 'relative', zIndex: 1 }}>
      {/* LEFT — Radar Visualization */}
      <div className="login-left">
        <div className="login-radar">
          <div className="radar-ring" />
          <div className="radar-ring" />
          <div className="radar-ring" />
          <div className="radar-sweep" />
          <div className="radar-center">🎯</div>

          {[
            { top: '28%', left: '62%', color: 'var(--gold)' },
            { top: '58%', left: '30%', color: 'var(--cyan)' },
            { top: '70%', left: '65%', color: 'var(--green)' },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: b.top,
                left: b.left,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: b.color,
                boxShadow: `0 0 10px ${b.color}`,
                animation: `livePulse ${1.5 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="login-headline">NEURAL GATE</div>

        <div className="login-sub">
          Automatic Number Plate Recognition &
          <br />
          Vehicle Intelligence Command System
        </div>

        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 32,
            borderTop: '1px solid var(--border)',
            paddingTop: 28,
            width: '100%',
            maxWidth: 340,
            justifyContent: 'center',
          }}
        >
          {[
            { val: '99.8%', lbl: 'Accuracy' },
            { val: '<0.3s', lbl: 'Latency' },
            { val: '24/7', lbl: 'Uptime' },
          ].map((s) => (
            <div key={s.lbl} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--gold-light)',
                }}
              >
                {s.val}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  letterSpacing: 1.5,
                  marginTop: 4,
                }}
              >
                {s.lbl.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Login Form */}
      <div className="login-right">
        <div className="login-form-card">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--gold-dim)',
              border: '1px solid var(--border-bright)',
              borderRadius: 20,
              padding: '4px 14px',
              marginBottom: 24,
            }}
          >
            <span
              className="live-dot"
              style={{
                background: 'var(--gold)',
                animation: 'none',
                opacity: 1,
              }}
            />

            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                color: 'var(--gold)',
              }}
            >
              SECURE ACCESS
            </span>
          </div>

          <div className="login-form-title">Welcome </div>


          <div className="login-form" onKeyDown={handleKey}>
            {error && <div className="login-error">⚠ {error}</div>}

            <div className="input-group">
              <label className="input-label">Mobile Number</label>

              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    fontSize: 15,
                  }}
                >
                  📱
                </span>

                <input
                  className="lux-input"
                  name="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={form.mobile}
                  onChange={handleChange}
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>

              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    fontSize: 15,
                  }}
                >
                  🔒
                </span>

                <input
                  className="lux-input"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            <button
              className="btn btn-gold login-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div
                    className="loader-ring"
                    style={{
                      width: 16,
                      height: 16,
                      borderWidth: 2,
                    }}
                  />
                  AUTHENTICATING...
                </>
              ) : (
                <>⚡ SIGN IN</>
              )}
            </button>
          </div>

          <div
            style={{
              marginTop: 32,
              padding: 16,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>🛡</span>

            <span>
              All access is logged and monitored by the ANPR system.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}