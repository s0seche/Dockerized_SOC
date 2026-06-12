export default function MetricCard({ label, value, sub, color, icon: Icon, accentColor }) {
  return (
    <div className="metric-card" style={{ '--accent-color': accentColor || 'var(--accent-cyan)' }}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${color || ''}`}>
        {value ?? '—'}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
      {Icon && <div className="metric-icon"><Icon size={32} /></div>}
    </div>
  )
}
