import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, ExternalLink, BarChart2 } from 'lucide-react'
import { api } from '../api/client'

const KIBANA_BASE = 'http://192.168.1.129:5601'

export default function Dashboards() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await api.dashboards()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const dashboards = (data?.dashboards || []).filter(d =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Dashboards</div>
          <div className="page-subtitle">
            Kibana dashboards — {data?.total ?? '...'} available
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`${KIBANA_BASE}/app/dashboards`}
            target="_blank"
            rel="noreferrer"
            className="btn-refresh"
            style={{ textDecoration: 'none' }}
          >
            <ExternalLink size={12} />
            Open Kibana
          </a>
          <button className="btn-refresh" onClick={load}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ marginBottom: 12 }}>
          <span className="card-title">Quick Access</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'SIEM Alerts', path: '/app/security/alerts' },
            { label: 'Detection Rules', path: '/app/security/rules/management' },
            { label: 'All Dashboards', path: '/app/dashboards' },
            { label: 'Discover', path: '/app/discover' },
          ].map(({ label, path }) => (
            <a key={path} href={`${KIBANA_BASE}${path}`} target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500,
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                color: 'var(--accent-cyan)', textDecoration: 'none', transition: 'background 0.15s'
              }}>
              <ExternalLink size={11} />
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="search-input"
          placeholder="Search dashboards..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {dashboards.length} result{dashboards.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spin" />Loading dashboards...</div>
      ) : (
        <div className="dashboard-grid">
          {dashboards.map(d => (
            <a
              key={d.id}
              href={`${KIBANA_BASE}/app/dashboards#/view/${d.id}`}
              target="_blank"
              rel="noreferrer"
              className="dashboard-card"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div className="dashboard-card-title">{d.title}</div>
                <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
              </div>
              {d.description && <div className="dashboard-card-desc">{d.description}</div>}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart2 size={10} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Kibana Dashboard</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
