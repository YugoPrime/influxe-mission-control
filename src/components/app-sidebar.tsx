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

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-800 bg-slate-950">
      <SidebarHeader className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Bolt className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm leading-tight">Influxe</span>
              <span className="text-xs text-slate-400 leading-tight">Mission Control</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs text-slate-500 uppercase tracking-wider px-4 py-2">
              Navigation
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
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                          {!collapsed && isActive && (
                            <ChevronRight className="w-3 h-3 ml-auto text-purple-400" />
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
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800">
        {!collapsed && (
          <div className="text-xs text-slate-500 text-center">
            Influxe © 2026
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
