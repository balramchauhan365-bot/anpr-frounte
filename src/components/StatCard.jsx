import { useRef } from 'react';

export default function StatCard({ label, value, icon, color = '#C8952A', sub, trend, trendDir }) {
  const cardRef = useRef(null);

  const handleMove = (e) => {
    const c = cardRef.current;
    const r = c.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const cx = r.width / 2, cy = r.height / 2;
    const rx = (y - cy) / 14;
    const ry = (cx - x) / 14;
    c.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.025,1.025,1.025)`;
  };

  const handleLeave = () => {
    cardRef.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    cardRef.current.style.transition = 'transform 0.5s ease';
    setTimeout(() => { if (cardRef.current) cardRef.current.style.transition = ''; }, 500);
  };

  return (
    <div
      className="stat-card"
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        className="stat-card-accent"
        style={{ background: color, top: -20, right: -20 }}
      />
      <div
        className="stat-icon-wrap"
        style={{
          background: `rgba(${hexToRgb(color)}, 0.12)`,
          border: `1px solid rgba(${hexToRgb(color)}, 0.25)`,
        }}
      >
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {(sub || trend) && (
        <div className="stat-sub">
          {sub && <span>{sub}</span>}
          {trend && (
            <span className={`stat-trend ${trendDir || 'neutral'}`}>{trend}</span>
          )}
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
