import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import SeverityBadge from '../components/SeverityBadge'
import MetricCard from '../components/MetricCard'

function fmtTime(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('fr-FR') } catch { return ts }
}

function ItemRow({ item }) {
  return (
    <tr>
      <td className="td-mono">{fmtTime(item.timestamp)}</td>
      <td className="td-name">{item.title || `#${item.number}`}</td>
      <td><SeverityBadge severity={item.severity} /></td>
      <td>
        <span className={`badge ${item.status?.toLowerCase() === 'resolved' ? 'closed' : 'open'}`}>
          {item.status || '—'}
        </span>
      </td>
      <td>{item.source || item.assignee || '—'}</td>
      <td>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {(item.tags || []).slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </td>
    </tr>
  )
}

export default function TheHive() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('alerts')

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await api.thehiveAlerts()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const items = tab === 'alerts' ? (data?.alerts || []) : (data?.cases || [])

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">TheHive</div>
          <div className="page-subtitle">Incident response platform · Cases & Alerts</div>
        </div>
        <button className="btn-refresh" onClick={load}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <MetricCard label="Alerts" value={data?.alerts?.length ?? '—'} color="cyan" accentColor="var(--accent-cyan)" />
        <MetricCard label="Cases" value={data?.cases?.length ?? '—'} color="ok" accentColor="var(--status-ok)" />
        <MetricCard
          label="Total"
          value={data?.total ?? '—'}
          sub="alerts + cases"
          accentColor="var(--accent-purple)"
        />
      </div>

      <div className="card">
        <div className="thehive-tabs">
          <div className={`thehive-tab ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>
            Alerts {data && `(${data.alerts?.length || 0})`}
          </div>
          <div className={`thehive-tab ${tab === 'cases' ? 'active' : ''}`} onClick={() => setTab('cases')}>
            Cases {data && `(${data.cases?.length || 0})`}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spin" />Connecting to TheHive...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            No {tab} found in TheHive.
            <div style={{ marginTop: 8, fontSize: 11 }}>
              Make sure TheHive is accessible and credentials are valid.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Source / Assignee</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => <ItemRow key={item.id || i} item={item} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12,
        background: 'rgba(0,212,255,0.04)', border: '1px solid var(--border)', borderRadius: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          TheHive is accessible at{' '}
          <a href="http://192.168.1.129:9003" target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent-cyan)' }}>
            http://192.168.1.129:9003
          </a>
          {' '}— Organisation :{' '}
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
            SOC
          </span>
        </div>
      </div>
    </div>
  )
}
