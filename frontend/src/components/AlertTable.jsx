import { useState } from 'react'
import SeverityBadge from './SeverityBadge'

function fmtTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return ts }
}

export default function AlertTable({ alerts = [], maxRows }) {
  const [expanded, setExpanded] = useState(null)
  const rows = maxRows ? alerts.slice(0, maxRows) : alerts

  if (!rows.length) return <div className="empty-state">No alerts found</div>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Rule / Title</th>
            <th>Severity</th>
            <th>Source</th>
            <th>Source IP</th>
            <th>Host</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => (
            <>
              <tr key={a.id || i} onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{ cursor: 'pointer' }}>
                <td className="td-mono">{fmtTime(a.timestamp)}</td>
                <td className="td-name">{a.rule_name || a.title || '—'}</td>
                <td><SeverityBadge severity={a.severity} /></td>
                <td>
                  <span className={`badge ${a.source === 'elastic' ? 'low' : 'info'}`}>
                    {a.source === 'elastic' ? 'Elastic' : a.source === 'alert' ? 'TheHive' : a.source || '—'}
                  </span>
                </td>
                <td className="td-mono">{a.source_ip || '—'}</td>
                <td className="td-mono">{a.host || '—'}</td>
                <td><SeverityBadge status={a.status || 'open'} /></td>
              </tr>
              {expanded === i && (
                <tr key={`exp-${i}`}>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <div className="alert-row-expanded">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Destination IP</label>
                          <span>{a.dest_ip || '—'}</span>
                        </div>
                        <div className="detail-item">
                          <label>User</label>
                          <span>{a.user || '—'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Risk Score</label>
                          <span>{a.risk_score ?? '—'}</span>
                        </div>
                        {a.tags?.length > 0 && (
                          <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                            <label>Tags</label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                              {a.tags.map(t => <span key={t} className="tag">{t}</span>)}
                            </div>
                          </div>
                        )}
                        {a.message && (
                          <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                            <label>Message</label>
                            <span style={{ wordBreak: 'break-all' }}>{a.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
