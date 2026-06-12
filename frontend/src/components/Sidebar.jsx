import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, AlertTriangle, ShieldCheck,
  Bug, Activity, BarChart2
} from 'lucide-react'
import { api } from '../api/client'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'SOC Overview' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/rules', icon: ShieldCheck, label: 'Detection Rules' },
  { to: '/thehive', icon: Bug, label: 'TheHive' },
  { to: '/connectors', icon: Activity, label: 'Connectors' },
  { to: '/dashboards', icon: BarChart2, label: 'Dashboards' },
]

export default function Sidebar() {
  const [services, setServices] = useState({})

  useEffect(() => {
    const load = () =>
      api.servicesHealth()
        .then(d => setServices(d.services || {}))
        .catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">S</div>
        <div>
          <div className="sidebar-logo-text">SOC Central</div>
          <div className="sidebar-logo-sub">Dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8,
          textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
          Connectors
        </div>
        <div className="connector-mini">
          {[
            { key: 'elasticsearch', label: 'Elasticsearch' },
            { key: 'kibana', label: 'Kibana' },
            { key: 'thehive', label: 'TheHive' },
            { key: 'cortex', label: 'Cortex' },
          ].map(({ key, label }) => {
            const svc = services[key] || {}
            const cls = svc.status === 'connected' ? 'ok' : svc.status === 'error' ? 'error' : 'loading'
            return (
              <div key={key} className="connector-mini-item">
                <div className={`dot ${cls}`} />
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
