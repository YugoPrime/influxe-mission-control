import { execSync } from 'child_process'
import {
  Activity,
  HardDrive,
  MemoryStick,
  Cpu,
  CheckCircle,
  XCircle,
  Server,
  Key,
  RefreshCw,
  Database,
} from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'

// ─── Types ─────────────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string
  status: 'up' | 'down' | 'unknown'
  latencyMs?: number
  error?: string
}

interface HealthData {
  overall: string
  services: ServiceStatus[]
  checkedAt: string
}

interface Pm2Process {
  name: string
  pm2_env?: {
    status: string
    pm_uptime: number
    restart_time: number
    created_at: number
  }
  monit?: {
    memory: number
    cpu: number
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function metricColor(val: number): string {
  if (val > 80) return '#f87171'
  if (val > 60) return '#fbbf24'
  return '#34d399'
}

function parsePercent(str: string): number {
  return parseInt(str.replace('%', ''), 10) || 0
}

function formatUptime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`
  return `${(bytes / 1024).toFixed(0)}KB`
}

// ─── Data fetching ─────────────────────────────────────────────────────────

async function getHealthData(): Promise<HealthData> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch {
    // fall through
  }
  return { overall: 'unknown', services: [], checkedAt: new Date().toISOString() }
}

function getVpsMetrics() {
  try {
    const disk = execSync("df -h / | tail -1 | awk '{print $5}'").toString().trim()
    const mem = execSync("free -m | grep Mem | awk '{printf \"%.0f%%\", $3/$2*100}'").toString().trim()
    const cpu = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d. -f1").toString().trim()
    return { disk, mem, cpu }
  } catch {
    return { disk: '—', mem: '—', cpu: '—' }
  }
}

function getPm2Processes(): Pm2Process[] {
  try {
    const raw = execSync("pm2 jlist 2>/dev/null || echo '[]'").toString()
    return JSON.parse(raw) as Pm2Process[]
  } catch {
    return []
  }
}

function checkIntegrations() {
  const anthropic = (() => {
    try {
      const result = execSync(
        "find /root/.openclaw/workspace/agents -name '.env' -exec grep -l ANTHROPIC_API_KEY {} \\; 2>/dev/null | head -1"
      ).toString().trim()
      return result.length > 0
    } catch { return false }
  })()

  const github = (() => {
    try {
      execSync('test -f ~/.git-credentials && test -s ~/.git-credentials')
      return true
    } catch { return false }
  })()

  return [
    { label: 'Twelve Data', key: 'TWELVE_DATA_API_KEY', set: !!(process.env.TWELVE_DATA_API_KEY) },
    { label: 'Google OAuth', key: 'GOOGLE_CLIENT_ID', set: !!(process.env.GOOGLE_CLIENT_ID) },
    { label: 'Anthropic', key: 'ANTHROPIC_API_KEY (agents)', set: anthropic },
    { label: 'GitHub', key: '~/.git-credentials', set: github },
  ]
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  color,
  badge,
}: {
  icon: React.ElementType
  label: string
  color: string
  badge?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--mc-text-primary)' }}>
        {label}
      </span>
      {badge && (
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono"
          style={{
            background: 'var(--mc-card)',
            border: '1px solid var(--mc-card-border)',
            color: 'var(--mc-text-muted)',
            fontSize: '10px',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function SystemHealthPage() {
  const [health, pm2Procs] = await Promise.all([
    getHealthData(),
    Promise.resolve(getPm2Processes()),
  ])
  const vps = getVpsMetrics()
  const integrations = checkIntegrations()

  const diskPct = parsePercent(vps.disk)
  const memPct = parsePercent(vps.mem)
  const cpuPct = parsePercent(vps.cpu)

  const serviceOrder = ['OpenClaw', 'Crucix', 'Langfuse', 'Coolify']
  const services = serviceOrder.map((name) => {
    const found = health.services.find((s) => s.name === name)
    return found ?? { name, status: 'unknown' as const }
  })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.25)',
            }}
          >
            <Activity className="w-[18px] h-[18px]" style={{ color: '#34d399' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
              System Health
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
              Live infrastructure overview
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-mono hidden md:flex"
          style={{
            background: 'var(--mc-card)',
            border: '1px solid var(--mc-card-border)',
            color: 'var(--mc-text-muted)',
          }}
        >
          <RefreshCw className="w-3 h-3" />
          <span>no-store</span>
        </div>
      </div>

      {/* ── Section 1: Service Status ─────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader
          icon={Server}
          label="Service Status"
          color="#3b82f6"
          badge={health.overall === 'healthy' ? 'all systems go' : health.overall}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {services.map((svc) => {
            const isUp = svc.status === 'up'
            const isDown = svc.status === 'down'
            const statusColor = isUp ? '#34d399' : isDown ? '#f87171' : '#94a3b8'
            const statusLabel = isUp ? 'up' : isDown ? 'down' : 'unknown'
            return (
              <div
                key={svc.name}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{
                  background: 'var(--mc-card)',
                  border: `1px solid ${isUp ? 'rgba(52,211,153,0.15)' : isDown ? 'rgba(248,113,113,0.15)' : 'var(--mc-card-border)'}`,
                }}
              >
                {isUp
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} />
                  : isDown
                  ? <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
                  : <Activity className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
                }
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--mc-text-primary)' }}>
                    {svc.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-xs font-mono"
                      style={{ color: statusColor, fontSize: '10px' }}
                    >
                      {statusLabel}
                    </span>
                    {svc.latencyMs != null && (
                      <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
                        {svc.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 2: VPS Metrics ────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={HardDrive} label="VPS Metrics" color="#8b5cf6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Disk Usage', value: vps.disk, pct: diskPct, icon: HardDrive },
            { label: 'Memory Usage', value: vps.mem, pct: memPct, icon: MemoryStick },
            { label: 'CPU Usage', value: vps.cpu, pct: cpuPct, icon: Cpu },
          ].map(({ label, value, pct, icon: Icon }) => {
            const color = metricColor(pct)
            return (
              <div
                key={label}
                className="p-4 rounded-xl"
                style={{
                  background: 'var(--mc-card)',
                  border: `1px solid ${color}25`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    className="text-lg font-bold font-mono tracking-tight"
                    style={{ color }}
                  >
                    {value}
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--mc-card-border)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 3 + 4: Integrations + PM2 ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Integrations table */}
        <div className="mc-card p-5">
          <SectionHeader icon={Key} label="Integrations" color="#f59e0b" />
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--mc-card-border)' }}>
                {['Integration', 'Status', 'Key / Source'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 pr-4 font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {integrations.map((row, i) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom: i < integrations.length - 1 ? '1px solid var(--mc-card-border)' : 'none',
                  }}
                >
                  <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                    {row.label}
                  </td>
                  <td className="py-2.5 pr-4">
                    {row.set
                      ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                      : <XCircle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                    }
                  </td>
                  <td
                    className="py-2.5 font-mono text-xs truncate max-w-[160px]"
                    style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
                  >
                    {row.key}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PM2 Processes */}
        <div className="mc-card p-5">
          <SectionHeader
            icon={Database}
            label="PM2 Processes"
            color="#ec4899"
            badge={`${pm2Procs.length} proc`}
          />
          {pm2Procs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 rounded-lg"
              style={{ border: '1px dashed var(--mc-card-border)' }}
            >
              <Database className="w-7 h-7 mb-2 opacity-30" style={{ color: 'var(--mc-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--mc-text-muted)' }}>No PM2 processes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--mc-card-border)' }}>
                    {['Name', 'Status', 'Uptime', 'Memory', 'Restarts'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-3 font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pm2Procs.map((proc, i) => {
                    const env = proc.pm2_env
                    const isOnline = env?.status === 'online'
                    const statusColor = isOnline ? '#34d399' : '#f87171'
                    const uptime = env?.created_at ? formatUptime(env.created_at) : '—'
                    const memory = proc.monit?.memory ? formatBytes(proc.monit.memory) : '—'
                    const restarts = env?.restart_time ?? 0
                    return (
                      <tr
                        key={proc.name + i}
                        style={{ borderBottom: i < pm2Procs.length - 1 ? '1px solid var(--mc-card-border)' : 'none' }}
                      >
                        <td className="py-2 pr-3 font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                          {proc.name}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: `${statusColor}18`,
                              border: `1px solid ${statusColor}35`,
                              color: statusColor,
                            }}
                          >
                            {env?.status ?? 'unknown'}
                          </span>
                        </td>
                        <td className="py-2 pr-3 font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                          {uptime}
                        </td>
                        <td className="py-2 pr-3 font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                          {memory}
                        </td>
                        <td
                          className="py-2 font-mono"
                          style={{ color: restarts > 5 ? '#fbbf24' : 'var(--mc-text-muted)' }}
                        >
                          {restarts}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
