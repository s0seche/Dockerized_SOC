import SeverityBadge from './SeverityBadge'

export default function RuleTable({ rules = [] }) {
  if (!rules.length) return <div className="empty-state">No rules found</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Severity</th>
            <th>Type</th>
            <th>Interval</th>
            <th>Status</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="td-name">{r.name}</div>
                {r.description && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, maxWidth: 300,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.description}
                  </div>
                )}
              </td>
              <td><SeverityBadge severity={r.severity} /></td>
              <td><span className="badge info">{r.type}</span></td>
              <td className="td-mono">{r.interval || '—'}</td>
              <td>
                <div className={`rule-status ${r.enabled ? 'enabled' : 'disabled'}`}>
                  <div className={`dot ${r.enabled ? 'ok' : 'error'}`} />
                  {r.enabled ? 'Active' : 'Disabled'}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {r.tags?.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
