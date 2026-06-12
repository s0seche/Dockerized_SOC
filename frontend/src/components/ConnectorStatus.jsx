import { Database, Layout, Shield, Zap } from 'lucide-react'

const SERVICE_META = {
  elasticsearch: { label: 'Elasticsearch', icon: Database, url: 'http://192.168.1.129:9200' },
  kibana: { label: 'Kibana', icon: Layout, url: 'http://192.168.1.129:5601' },
  thehive: { label: 'TheHive', icon: Shield, url: 'http://192.168.1.129:9003' },
  cortex: { label: 'Cortex', icon: Zap, url: 'http://192.168.1.129:9002' },
}

export default function ConnectorStatus({ services = {}, compact = false }) {
  if (compact) {
    return (
      <div className="connector-mini">
        {Object.entries(SERVICE_META).map(([key, meta]) => {
          const svc = services[key] || {}
          const ok = svc.status === 'connected'
          return (
            <div key={key} className="connector-mini-item">
              <div className={`dot ${ok ? 'ok' : svc.status ? 'error' : 'loading'}`} />
              <span>{meta.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="connectors-grid">
      {Object.entries(SERVICE_META).map(([key, meta]) => {
        const svc = services[key] || {}
        const ok = svc.status === 'connected'
        const Icon = meta.icon
        return (
          <div key={key} className={`connector-card ${ok ? 'ok' : svc.status ? 'error' : ''}`}>
            <div className="connector-header">
              <div className="connector-name">
                <Icon size={16} style={{ color: ok ? 'var(--status-ok)' : 'var(--status-error)' }} />
                {meta.label}
              </div>
              <span className={`badge ${ok ? 'ok' : 'error'}`}>
                {ok ? 'Connected' : svc.status === 'error' ? 'Error' : 'Checking...'}
              </span>
            </div>
            <div className="connector-details">
              {svc.version && <div>Version: {svc.version}</div>}
              {svc.cluster && <div>Cluster: {svc.cluster}</div>}
              {svc.health && <div>Health: {svc.health}</div>}
              {svc.kibana_status && <div>State: {svc.kibana_status}</div>}
              {svc.message && !ok && (
                <div style={{ color: 'var(--status-error)', marginTop: 4 }}>{svc.message}</div>
              )}
            </div>
            <div className="connector-url">{meta.url}</div>
          </div>
        )
      })}
    </div>
  )
}
