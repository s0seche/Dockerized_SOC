import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

const PAGE_LABELS = {
  '/': 'SOC Overview',
  '/alerts': 'Alerts',
  '/rules': 'Detection Rules',
  '/thehive': 'TheHive',
  '/connectors': 'Connectors Health',
  '/dashboards': 'Dashboards',
}

export default function Header() {
  const { pathname } = useLocation()
  const [services, setServices] = useState(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    api.servicesHealth().then(setServices).catch(() => {})
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const allOk = services
    ? Object.values(services.services || {}).every(s => s.status === 'connected')
    : null

  const title = PAGE_LABELS[pathname] || 'SOC Dashboard'

  return (
    <div className="header">
      <div className="header-left">
        <div>
          <div className="header-breadcrumb">SOC Central</div>
          <div className="header-title">{title}</div>
        </div>
      </div>
      <div className="header-right">
        {services !== null && (
          <div className={`header-connector-badge ${allOk ? '' : 'error'}`}>
            <div className={`dot ${allOk ? 'ok' : 'error'}`} />
            {allOk ? 'All Systems Online' : 'Service Degraded'}
          </div>
        )}
        <div className="header-time">
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
