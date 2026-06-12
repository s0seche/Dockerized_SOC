import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { api } from '../api/client'
import RuleTable from '../components/RuleTable'
import MetricCard from '../components/MetricCard'

export default function DetectionRules() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await api.rules()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const rules = (data?.rules || []).filter(r => {
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' ? r.enabled : !r.enabled)
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Detection Rules</div>
          <div className="page-subtitle">Kibana SIEM detection engine rules</div>
        </div>
        <button className="btn-refresh" onClick={load}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <MetricCard label="Total Rules" value={data?.total ?? '—'} color="cyan" accentColor="var(--accent-cyan)" />
        <MetricCard label="Active" value={data?.active?.length ?? '—'} color="ok" accentColor="var(--status-ok)" />
        <MetricCard label="Disabled" value={data?.disabled?.length ?? 0} accentColor="var(--text-muted)" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Rules</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'active', 'disabled'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  background: filter === f ? 'rgba(0,212,255,0.12)' : 'transparent',
                  border: `1px solid ${filter === f ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
                  color: filter === f ? 'var(--accent-cyan)' : 'var(--text-muted)',
                }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
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
                placeholder="Search rules..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading-spinner"><div className="spin" />Loading rules...</div>
        ) : (
          <>
            <RuleTable rules={rules} />
            {/* MITRE ATT&CK panel */}
            {data?.rules?.some(r => r.threat?.length > 0) && (
              <div style={{ marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                <div className="section-title" style={{ marginBottom: 10 }}>MITRE ATT&CK Coverage</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[...new Set(
                    (data?.rules || [])
                      .flatMap(r => r.threat || [])
                      .map(t => t.tactic?.name)
                      .filter(Boolean)
                  )].map(tactic => (
                    <span key={tactic} className="mitre-tag">{tactic}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
