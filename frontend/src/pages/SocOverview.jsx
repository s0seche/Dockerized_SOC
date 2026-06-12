import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, ShieldCheck, Activity, Bug, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import MetricCard from '../components/MetricCard'
import DataFlowMap from '../components/DataFlowMap'
import AlertTable from '../components/AlertTable'
import ConnectorStatus from '../components/ConnectorStatus'

export default function SocOverview() {
  const [summary, setSummary] = useState(null)
  const [flow, setFlow] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f, a] = await Promise.all([
        api.summary(),
        api.socFlow(),
        api.alerts(10),
      ])
      setSummary(s)
      setFlow(f)
      setAlerts(a.alerts || [])
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const services = summary?.connector_status || {}

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">SOC Overview</div>
          <div className="page-subtitle">
            Real-time security operations center — Elastic · Kibana · TheHive
          </div>
        </div>
        <button className="btn-refresh" onClick={load}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('fr-FR')}` : 'Refresh'}
        </button>
      </div>

      {loading && !summary ? (
        <div className="loading-spinner">
          <div className="spin" />
          Loading SOC data...
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="metrics-grid">
            <MetricCard
              label="Total Alerts"
              value={summary?.total_alerts ?? '—'}
              sub="SIEM signals"
              color="cyan"
              icon={AlertTriangle}
              accentColor="var(--accent-cyan)"
            />
            <MetricCard
              label="Critical"
              value={summary?.critical_alerts ?? 0}
              sub="alerts"
              color="critical"
              accentColor="var(--sev-critical)"
            />
            <MetricCard
              label="High"
              value={summary?.high_alerts ?? 0}
              sub="alerts"
              color="high"
              accentColor="var(--sev-high)"
            />
            <MetricCard
              label="Medium"
              value={summary?.medium_alerts ?? 0}
              sub="alerts"
              color="medium"
              accentColor="var(--sev-medium)"
            />
            <MetricCard
              label="Low"
              value={summary?.low_alerts ?? 0}
              sub="alerts"
              color="low"
              accentColor="var(--sev-low)"
            />
            <MetricCard
              label="Active Rules"
              value={summary?.active_rules ?? '—'}
              sub={`${summary?.disabled_rules ?? 0} disabled`}
              color="ok"
              icon={ShieldCheck}
              accentColor="var(--status-ok)"
            />
            <MetricCard
              label="Open Cases"
              value={summary?.open_cases ?? 0}
              sub="TheHive"
              icon={Bug}
              accentColor="var(--accent-purple)"
            />
            <MetricCard
              label="TheHive Alerts"
              value={summary?.thehive_alerts ?? 0}
              sub="pending"
              icon={Activity}
              accentColor="var(--accent-blue)"
            />
          </div>

          {/* Data Flow Map */}
          {flow && <DataFlowMap data={flow} />}

          {/* Bottom row: Alerts + Connectors */}
          <div className="two-col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Last Alerts</span>
                <span className="section-count">{alerts.length} displayed</span>
              </div>
              <AlertTable alerts={alerts} maxRows={8} />
            </div>

            <div>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <span className="section-title">Connector Status</span>
              </div>
              <ConnectorStatus services={services} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
