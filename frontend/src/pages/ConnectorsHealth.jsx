import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import ConnectorStatus from '../components/ConnectorStatus'

export default function ConnectorsHealth() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.servicesHealth())
      setLastCheck(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const services = data?.services || {}
  const allOk = data ? Object.values(services).every(s => s.status === 'connected') : null

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Connectors Health</div>
          <div className="page-subtitle">
            Service connectivity status — {lastCheck ? `Last checked: ${lastCheck.toLocaleTimeString('fr-FR')}` : 'Checking...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {data && (
            <span className={`badge ${allOk ? 'ok' : 'error'}`} style={{ fontSize: 12, padding: '4px 12px' }}>
              {allOk ? 'All Systems Operational' : 'Service Degraded'}
            </span>
          )}
          <button className="btn-refresh" onClick={load}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="loading-spinner"><div className="spin" />Checking connectors...</div>
      ) : (
        <>
          <ConnectorStatus services={services} />

          <div style={{ marginTop: 24 }} className="card">
            <div className="card-header">
              <span className="card-title">Service Endpoints</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Elasticsearch', key: 'elasticsearch', url: 'http://192.168.1.129:9200' },
                  { name: 'Kibana', key: 'kibana', url: 'http://192.168.1.129:5601' },
                  { name: 'TheHive', key: 'thehive', url: 'http://192.168.1.129:9003' },
                  { name: 'Cortex', key: 'cortex', url: 'http://192.168.1.129:9002' },
                ].map(({ name, key, url }) => {
                  const svc = services[key] || {}
                  const ok = svc.status === 'connected'
                  return (
                    <tr key={key}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{name}</td>
                      <td>
                        <a href={url} target="_blank" rel="noreferrer" className="td-mono" style={{ color: 'var(--accent-cyan)' }}>
                          {url}
                        </a>
                      </td>
                      <td>
                        <span className={`badge ${ok ? 'ok' : svc.status ? 'error' : 'medium'}`}>
                          {ok ? 'Connected' : svc.status === 'error' ? 'Error' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {svc.version ? `v${svc.version}` : ''}
                        {svc.cluster ? ` · ${svc.cluster}` : ''}
                        {svc.health ? ` · health: ${svc.health}` : ''}
                        {svc.kibana_status ? ` · ${svc.kibana_status}` : ''}
                        {svc.message && !ok ? svc.message : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
