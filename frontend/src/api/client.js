const BASE = ''

async function get(path) {
  const r = await fetch(`${BASE}${path}`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export const api = {
  health: () => get('/health'),
  servicesHealth: () => get('/api/health/services'),
  summary: () => get('/api/dashboard/summary'),
  socFlow: () => get('/api/soc/flow'),
  alerts: (size = 50) => get(`/api/alerts?size=${size}`),
  elasticAlerts: (size = 50) => get(`/api/alerts/elastic?size=${size}`),
  thehiveAlerts: () => get('/api/alerts/thehive'),
  rules: () => get('/api/rules'),
  activeRules: () => get('/api/rules/active'),
  dashboards: () => get('/api/dashboards'),
}
