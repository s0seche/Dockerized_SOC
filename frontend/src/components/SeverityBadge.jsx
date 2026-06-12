export default function SeverityBadge({ severity, status }) {
  const val = (severity || status || '').toLowerCase()
  return <span className={`badge ${val}`}>{val || '—'}</span>
}
