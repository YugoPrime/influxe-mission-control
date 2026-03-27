'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  Zap,
  Users,
  ChevronRight,
  Bolt,
  Search,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: Kanban },
  { href: '/automations', label: 'Automations', icon: Zap },
  { href: '/team', label: 'Team', icon: Users },
]

// Agent roster with colors
const agents = [
  { id: 'yugo', label: 'Yugo', color: '#8b5cf6', role: 'CEO' },
  { id: 'jarvis', label: 'Jarvis', color: '#3b82f6', role: 'CTO' },
  { id: 'nexus', label: 'Nexus', color: '#10b981', role: 'COO' },
  { id: 'nova', label: 'Nova', color: '#ec4899', role: 'CMO' },
  { id: 'ruel', label: 'Ruel', color: '#f59e0b', role: 'CFO' },
  { id: 'amalia', label: 'Amalia', color: '#14b8a6', role: 'CoS' },
  { id: 'mastermind', label: 'Mastermind', color: '#f97316', role: 'CIO' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar
      collapsible="icon"
      className="mc-sidebar border-r"
      style={{
        background: 'var(--mc-sidebar-bg)',
        borderRight: '1px solid var(--mc-card-border)',
      }}
    >
      {/* Logo */}
      <SidebarHeader
        className="p-4 border-b"
        style={{ borderBottom: '1px solid var(--mc-card-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/20">
            <Bolt className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm leading-tight" style={{ color: 'var(--mc-text-primary)' }}>
                Influxe
              </span>
              <span className="text-xs leading-tight" style={{ color: 'var(--mc-text-muted)' }}>
                Mission Control
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">

        {/* Search bar (expanded only) */}
        {!collapsed && (
          <div className="px-3 py-2">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--mc-card)',
                border: '1px solid var(--mc-card-border)',
                color: 'var(--mc-text-muted)',
              }}
            >
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs">Search…</span>
              <span
                className="ml-auto text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: 'var(--mc-card-border)',
                  color: 'var(--mc-text-muted)',
                  fontSize: '10px',
                }}
              >
                ⌘K
              </span>
            </div>
          </div>
        )}

        {/* Main navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel
              className="text-xs uppercase tracking-widest px-4 py-2 font-semibold"
              style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
            >
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'mc-nav-active'
                              : ''
                          )}
                          style={
                            !isActive
                              ? {
                                  color: 'var(--mc-text-muted)',
                                }
                              : undefined
                          }
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                          {!collapsed && isActive && (
                            <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
                          )}
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Agents section */}
        {!collapsed && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel
              className="text-xs uppercase tracking-widest px-4 py-2 font-semibold"
              style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
            >
              Agents
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 space-y-1">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors cursor-default"
                    style={{ color: 'var(--mc-text-muted)' }}
                  >
                    {/* Colored dot */}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: agent.color,
                        boxShadow: `0 0 6px ${agent.color}80`,
                      }}
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                      {agent.label}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
                      {agent.role}
                    </span>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter
        className="p-4 border-t"
        style={{ borderTop: '1px solid var(--mc-card-border)' }}
      >
        {!collapsed && (
          <div className="text-center" style={{ color: 'var(--mc-text-muted)', fontSize: '11px' }}>
            Influxe © 2026
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
