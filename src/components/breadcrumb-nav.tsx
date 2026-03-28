'use client'

import { usePathname } from 'next/navigation'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/automations': 'Automations',
  '/team': 'Team',
  '/ruel': 'Ruel Panel',
  '/amalia': 'Amalia',
  '/ideas': 'Ideas Pipeline',
  '/nexus': 'Nexus',
  '/nova': 'Nova',
  '/mastermind': 'Mastermind',
  '/system-health': 'System Health',
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const name = PAGE_NAMES[pathname] ?? pathname.split('/').filter(Boolean).pop() ?? 'Dashboard'

  return (
    <span
      className="text-sm font-medium tracking-tight hidden sm:block"
      style={{ color: 'var(--mc-text-muted)' }}
    >
      {name}
    </span>
  )
}
