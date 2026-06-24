export default function Loader({ text = 'LOADING' }) {
  return (
    <div className="loader-screen">
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div className="loader-ring" style={{ width: '100%', height: '100%', position: 'absolute' }} />
        <div
          className="loader-ring"
          style={{
            width: '70%', height: '70%',
            position: 'absolute', top: '15%', left: '15%',
            animationDirection: 'reverse',
            animationDuration: '1.5s',
            borderTopColor: 'var(--cyan)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22
        }}>🚗</div>
      </div>
      <div className="loader-text">{text}</div>
    </div>
  );
}
