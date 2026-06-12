import { useEffect, useRef } from 'react'
import SeverityBadge from './SeverityBadge'

const SEV_COLOR = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
}

function StatusDot({ status }) {
  const ok = status === 'connected' || status === 'monitored'
  return (
    <div className={`flow-node-status ${ok ? 'ok' : 'error'}`}>
      <div className={`dot ${ok ? 'ok' : 'error'}`} />
      {ok ? 'Online' : status === 'error' ? 'Offline' : 'Checking'}
    </div>
  )
}

function FlowNode({ name, sub, count, status, severities, type, isLast }) {
  return (
    <div className="flow-node active" style={{ position: 'relative' }}>
      <div className="flow-node-name">{name}</div>
      {sub && <div className="flow-node-sub">{sub}</div>}
      {count !== undefined && (
        <div className="flow-node-count">{count}</div>
      )}
      {status && <StatusDot status={status} />}
      {severities && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          {Object.entries(severities).map(([sev, cnt]) =>
            cnt > 0 ? (
              <span key={sev} style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 3,
                background: `${SEV_COLOR[sev]}18`,
                color: SEV_COLOR[sev],
                border: `1px solid ${SEV_COLOR[sev]}33`,
                fontWeight: 600
              }}>
                {sev.slice(0, 1).toUpperCase()} {cnt}
              </span>
            ) : null
          )}
        </div>
      )}
      {!isLast && (
        <div style={{
          position: 'absolute', right: -20, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--accent-cyan)', opacity: 0.5,
          fontSize: 16, fontWeight: 300, zIndex: 3
        }}>›</div>
      )}
    </div>
  )
}

export default function DataFlowMap({ data }) {
  if (!data) return null
  const { sources = [], rules = {}, alerts = {}, incidents = {} } = data

  const sev = alerts.severity || {}

  return (
    <div className="flow-container">
      <div className="card-header" style={{ marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <span className="card-title">SOC Data Flow</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Sources → Rules → Alerts → Incidents
        </span>
      </div>

      <div className="flow-grid" style={{ position: 'relative', zIndex: 2 }}>
        {/* Col 1: Sources */}
        <div className="flow-column">
          <div className="flow-col-label">Sources</div>
          {sources.map(s => (
            <FlowNode
              key={s.name}
              name={s.name}
              sub={s.ip}
              status={s.status}
            />
          ))}
        </div>

        {/* Col 2: Rules */}
        <div className="flow-column">
          <div className="flow-col-label">Detection Rules</div>
          <FlowNode
            name="Active Rules"
            count={rules.active || 0}
            sub={`${rules.disabled || 0} disabled`}
          />
          {(rules.list || []).map(r => (
            <div key={r.name} className="flow-node" style={{
              borderLeft: `2px solid ${SEV_COLOR[r.severity] || 'var(--border-accent)'}`,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name}
              </div>
              <div style={{ marginTop: 4 }}>
                <SeverityBadge severity={r.severity} />
              </div>
            </div>
          ))}
        </div>

        {/* Col 3: Alerts */}
        <div className="flow-column">
          <div className="flow-col-label">Alerts</div>
          <FlowNode
            name="Total Alerts"
            count={alerts.total || 0}
            severities={{
              critical: sev.critical || 0,
              high: sev.high || 0,
              medium: sev.medium || 0,
              low: sev.low || 0,
            }}
          />
          {(alerts.recent || []).slice(0, 2).map((a, i) => (
            <div key={i} className="flow-node" style={{
              borderLeft: `2px solid ${SEV_COLOR[a.severity] || 'var(--border-card)'}`,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {a.timestamp ? new Date(a.timestamp).toLocaleTimeString('fr-FR') : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.rule_name || a.title || '—'}
              </div>
              <div style={{ marginTop: 4 }}>
                <SeverityBadge severity={a.severity} />
              </div>
            </div>
          ))}
        </div>

        {/* Col 4: Incidents */}
        <div className="flow-column">
          <div className="flow-col-label">Incidents / Cases</div>
          <FlowNode
            name="TheHive Cases"
            count={incidents.cases || 0}
            sub={`${incidents.thehive_alerts || 0} alerts pending`}
            isLast
          />
          {(incidents.recent || []).slice(0, 3).map((c, i) => (
            <div key={i} className="flow-node">
              <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.title || `Case #${c.number}`}
              </div>
              <div style={{ marginTop: 4 }}>
                <SeverityBadge severity={c.severity} />
              </div>
            </div>
          ))}
          {incidents.cases === 0 && (
            <div className="flow-node" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No open cases</div>
            </div>
          )}
        </div>
      </div>

      {/* Animated flow line SVG */}
      <svg style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1, opacity: 0.3
      }}>
        <defs>
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="url(#flowGrad)" strokeWidth="1" strokeDasharray="4 8">
          <animate attributeName="stroke-dashoffset" values="48;0" dur="2s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  )
}
