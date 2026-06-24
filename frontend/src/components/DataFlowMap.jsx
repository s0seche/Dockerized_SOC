const MONO  = "'JetBrains Mono','Fira Mono',monospace"
const CYAN  = '#00d4ff'
const SEV   = { critical:'#ef4444', high:'#f97316', medium:'#eab308', low:'#3b82f6' }
const PURPLE= '#a855f7'
const GREEN = '#10b981'

const DEG = (d) => (d * Math.PI) / 180
const circPt = (cx, cy, r, deg) => [
  cx + r * Math.cos(DEG(deg)),
  cy + r * Math.sin(DEG(deg)),
]

function bez(x1, y1, x2, y2, bend = 0.42) {
  const cx = x1 + (x2 - x1) * bend
  const cx2 = x1 + (x2 - x1) * (1 - bend)
  return `M${x1} ${y1} C${cx} ${y1} ${cx2} ${y2} ${x2} ${y2}`
}

function Flow({ x1, y1, x2, y2, color, w = 0.9, dur = 1.6, bend }) {
  const d = bez(x1, y1, x2, y2, bend)
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={w} opacity={0.13} />
      <path d={d} fill="none" stroke={color} strokeWidth={w}
        strokeDasharray="5 22" opacity={0.9} filter="url(#gl)">
        <animate attributeName="stroke-dashoffset" values="27;0"
          dur={`${dur}s`} repeatCount="indefinite" />
      </path>
      <path d={d} fill="none" stroke={color} strokeWidth={w}
        strokeDasharray="5 22" opacity={0.55} filter="url(#gl)">
        <animate attributeName="stroke-dashoffset" values="27;0"
          dur={`${dur * 1.35}s`} begin="-0.6s" repeatCount="indefinite" />
      </path>
    </g>
  )
}

function SevArc({ cx, cy, r, startDeg, endDeg, color }) {
  const [x1, y1] = circPt(cx, cy, r, startDeg)
  const [x2, y2] = circPt(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return (
    <path
      d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
      fill="none" stroke={color} strokeWidth={4} opacity={0.75}
      strokeLinecap="round" filter="url(#gl)"
    />
  )
}

function Source({ x, y, label, color }) {
  return (
    <g>
      <circle cx={x - 52} cy={y} r={3.5} fill={color} filter="url(#gl)" />
      <text x={x - 44} y={y + 4} fill="rgba(255,255,255,0.7)"
        fontSize={9.5} fontFamily={MONO} fontWeight={600}>{label}</text>
    </g>
  )
}

function RNode({ x, y, label, count, color, sub }) {
  return (
    <g>
      <rect x={x - 38} y={y - 14} width={76} height={28} rx={4}
        fill={`${color}14`} stroke={color} strokeWidth={0.8} filter="url(#gl)" />
      <text x={x} y={y - 2} textAnchor="middle" fill="rgba(255,255,255,0.8)"
        fontSize={9} fontFamily={MONO} fontWeight={700}>{label}</text>
      {count !== undefined && (
        <text x={x} y={y + 9} textAnchor="middle" fill={color}
          fontSize={10} fontFamily={MONO} fontWeight={800}>{count}</text>
      )}
      {sub && (
        <text x={x} y={y + 9} textAnchor="middle" fill="rgba(255,255,255,0.35)"
          fontSize={8} fontFamily={MONO}>{sub}</text>
      )}
    </g>
  )
}

export default function DataFlowMap({ data }) {
  if (!data) return null

  const { alerts = {}, incidents = {}, rules = {} } = data
  const sev   = alerts.severity || {}
  const total = alerts.total || 0
  const crit  = sev.critical || 0
  const high  = sev.high     || 0
  const med   = sev.medium   || 0
  const low   = sev.low      || 0
  const cases    = incidents.cases          || 0
  const thAlerts = incidents.thehive_alerts || 0

  const CX = 440, CY = 200, R = 72

  const ARC_START = 200, ARC_END = 440
  const sum = Math.max(total, 1)
  const sevArcs = (() => {
    const items = [
      { key: 'critical', v: crit, color: SEV.critical },
      { key: 'high',     v: high, color: SEV.high },
      { key: 'medium',   v: med,  color: SEV.medium },
      { key: 'low',      v: low,  color: SEV.low },
    ].filter(s => s.v > 0)
    let cursor = ARC_START
    return items.map(s => {
      const span = (s.v / sum) * (ARC_END - ARC_START)
      const arc = { ...s, start: cursor, end: cursor + span - 2 }
      cursor += span
      return arc
    })
  })()

  const sources = [
    { label: 'Filebeat',      color: CYAN,        entryDeg: 152 },
    { label: 'Auditbeat',     color: CYAN,        entryDeg: 168 },
    { label: 'Logstash',      color: '#0ea5e9',   entryDeg: 184 },
    { label: 'Kibana Rules',  color: '#7dd3fc',   entryDeg: 200 },
    { label: 'Client Debian', color: '#38bdf8',   entryDeg: 216 },
  ]
  const SRC_X = 200

  const sevNodes = [
    { label: 'Critical', count: crit, color: SEV.critical, exitDeg: 318, ny: 90  },
    { label: 'High',     count: high, color: SEV.high,     exitDeg: 340, ny: 165 },
    { label: 'Medium',   count: med,  color: SEV.medium,   exitDeg: 5,   ny: 240 },
    { label: 'Low',      count: low,  color: SEV.low,      exitDeg: 28,  ny: 310 },
  ]
  const SEV_X = 605

  const respNodes = [
    { label: 'TH Cases',   count: cases,    color: PURPLE, ry: 120 },
    { label: 'TH Alerts',  count: thAlerts, color: PURPLE, ry: 230 },
    { label: 'Cortex',     sub: 'analyzer', color: GREEN,  ry: 330 },
  ]
  const RESP_X = 790

  const angLines = [
    [SEV_X + 38, sevNodes[0].ny, SEV_X + 38, sevNodes[1].ny, SEV.critical],
    [SEV_X + 38, sevNodes[1].ny, SEV_X + 38, sevNodes[2].ny, SEV.high],
    [SEV_X + 38, sevNodes[2].ny, SEV_X + 38, sevNodes[3].ny, SEV.medium],
  ]

  return (
    <div style={{
      background: '#04070d',
      borderRadius: 12,
      border: '1px solid rgba(0,212,255,0.09)',
      padding: '14px 14px 12px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase', letterSpacing: '1.6px', fontFamily: MONO }}>
          SOC Command Center
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 9, color: 'rgba(0,212,255,0.45)', fontFamily: MONO }}>
          LIVE
          <span style={{ width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
            background: CYAN, boxShadow: `0 0 5px ${CYAN}`,
            animation: 'pulse 1.4s ease-in-out infinite' }} />
        </span>
      </div>

      <svg viewBox="0 0 900 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <filter id="gl" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="gl2" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={CYAN} stopOpacity="0.07" />
            <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
          </radialGradient>
        </defs>

        {sources.map((s, i) => {
          const sy = 110 + i * 42
          return <Source key={s.label} x={SRC_X} y={sy} label={s.label} color={s.color} />
        })}

        {sources.map((s, i) => {
          const sy = 110 + i * 42
          const [ex, ey] = circPt(CX, CY, R + 2, s.entryDeg)
          return (
            <Flow key={s.label} x1={SRC_X} y1={sy} x2={ex} y2={ey}
              color={s.color} w={0.85} dur={1.4 + i * 0.2} bend={0.38} />
          )
        })}

        <circle cx={CX} cy={CY} r={R + 30} fill="url(#hubGrad)" />
        <circle cx={CX} cy={CY} r={R + 10} fill="none"
          stroke="rgba(0,212,255,0.1)" strokeWidth={1}
          strokeDasharray="3 5" />
        {sevArcs.map(a => (
          <SevArc key={a.key} cx={CX} cy={CY} r={R + 6}
            startDeg={a.start} endDeg={a.end} color={a.color} />
        ))}
        <circle cx={CX} cy={CY} r={R} fill="rgba(0,10,20,0.95)"
          stroke={CYAN} strokeWidth={1} opacity={0.6} />
        <circle cx={CX} cy={CY} r={R - 12} fill="none"
          stroke="rgba(0,212,255,0.12)" strokeWidth={0.7} />
        <text x={CX} y={CY - 8} textAnchor="middle" fill="white"
          fontSize={28} fontWeight={800} fontFamily={MONO}
          filter="url(#gl2)">
          {total.toLocaleString()}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle"
          fill="rgba(0,212,255,0.7)" fontSize={8.5} fontWeight={700}
          fontFamily={MONO} letterSpacing="2">
          ALERTS
        </text>
        <text x={CX} y={CY + 24} textAnchor="middle"
          fill="rgba(255,255,255,0.25)" fontSize={7.5} fontFamily={MONO}>
          {rules.active ?? 0} rules active
        </text>

        {sevNodes.map((s) => {
          const [ex, ey] = circPt(CX, CY, R + 2, s.exitDeg)
          return (
            <Flow key={s.label} x1={ex} y1={ey} x2={SEV_X - 38} y2={s.ny}
              color={s.color} w={0.9} dur={1.5} bend={0.45} />
          )
        })}

        {sevNodes.map(s => (
          <RNode key={s.label} x={SEV_X} y={s.ny} label={s.label}
            count={s.count} color={s.color} />
        ))}

        {angLines.map(([x1, y1, x2, y2, color], i) => (
          <line key={i} x1={x1} y1={y1 + 14} x2={x2} y2={y2 - 14}
            stroke={color} strokeWidth={0.5} opacity={0.25}
            strokeDasharray="2 4" />
        ))}

        {[
          [sevNodes[0], respNodes[0]],
          [sevNodes[1], respNodes[0]],
          [sevNodes[2], respNodes[1]],
          [sevNodes[3], respNodes[1]],
          [sevNodes[0], respNodes[2]],
        ].map(([s, r], i) => (
          <Flow key={i} x1={SEV_X + 38} y1={s.ny} x2={RESP_X - 44} y2={r.ry}
            color={s.color} w={0.7} dur={1.6 + i * 0.1} bend={0.4} />
        ))}

        {respNodes.map(r => (
          <RNode key={r.label} x={RESP_X} y={r.ry} label={r.label}
            count={r.count} sub={r.sub} color={r.color} />
        ))}

        {[
          [150,   'SOURCES'],
          [CX,    'SIEM'],
          [SEV_X, 'SEVERITY'],
          [RESP_X,'RESPONSE'],
        ].map(([x, lbl]) => (
          <text key={lbl} x={x} y={375} textAnchor="middle"
            fill="rgba(255,255,255,0.12)" fontSize={8} fontWeight={700}
            fontFamily={MONO} letterSpacing="2">
            {lbl}
          </text>
        ))}
      </svg>

      <div style={{ display: 'flex', paddingTop: 10, marginTop: 4,
        borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {[
          { label: 'Active Rules',  value: rules.active ?? 0, color: CYAN },
          { label: 'Total Signals', value: total,             color: SEV.high },
          { label: 'Critical',      value: crit,              color: SEV.critical },
          { label: 'Open Cases',    value: cases,             color: PURPLE },
          { label: 'TH Alerts',     value: thAlerts,          color: SEV.medium },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} style={{
            flex: 1, padding: '0 10px',
            borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div style={{ fontSize: 17, fontWeight: 800, color, fontFamily: MONO,
              textShadow: `0 0 10px ${color}70` }}>
              {value}
            </div>
            <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.22)',
              textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: MONO, marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
