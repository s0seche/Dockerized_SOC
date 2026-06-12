import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { api } from '../api/client'
import AlertTable from '../components/AlertTable'
import MetricCard from '../components/MetricCard'

export default function Alerts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.alerts(100)
      setData(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const alerts = (data?.alerts || []).filter(a => {
    const matchSearch = !search || [a.rule_name, a.title, a.source_ip, a.host].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
    const matchSource = source === 'all' || a.source === source
    return matchSearch && matchSource
  })

  const sev = data?.severity_breakdown || {}

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Alerts</div>
          <div className="page-subtitle">Elastic SIEM signals · TheHive alerts</div>
        </div>
        <button className="btn-refresh" onClick={load}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
        <MetricCard label="Total" value={data?.total ?? '—'} color="cyan" accentColor="var(--accent-cyan)" />
        <MetricCard label="Critical" value={sev.critical ?? 0} color="critical" accentColor="var(--sev-critical)" />
        <MetricCard label="High" value={sev.high ?? 0} color="high" accentColor="var(--sev-high)" />
        <MetricCard label="Medium" value={sev.medium ?? 0} color="medium" accentColor="var(--sev-medium)" />
        <MetricCard label="Low" value={sev.low ?? 0} color="low" accentColor="var(--sev-low)" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Alerts</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Source filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'elastic'].map(s => (
                <button key={s} onClick={() => setSource(s)} style={{
                  padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  background: source === s ? 'rgba(0,212,255,0.12)' : 'transparent',
                  border: `1px solid ${source === s ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
                  color: source === s ? 'var(--accent-cyan)' : 'var(--text-muted)',
                }}>
                  {s === 'all' ? 'All' : 'Elastic'}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                className="search-input"
                style={{ paddingLeft: 28 }}
                placeholder="Search rule, IP, host..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading-spinner"><div className="spin" />Loading alerts...</div>
        ) : (
          <AlertTable alerts={alerts} />
        )}
      </div>
    </div>
  )
}
