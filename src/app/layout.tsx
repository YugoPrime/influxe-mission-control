import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { Bell } from 'lucide-react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Mission Control — Influxe',
  description: 'Influxe Agent Ecosystem Dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{ background: 'var(--mc-bg)', color: 'var(--mc-text-primary)' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <main className="flex-1 flex flex-col min-h-screen">
                {/* Header — 48px, sticky, blur */}
                <header
                  className="mc-header h-12 flex items-center px-4 gap-3 sticky top-0 z-10"
                >
                  <SidebarTrigger
                    className="transition-colors hover:opacity-100 opacity-60"
                    style={{ color: 'var(--mc-text-muted)' }}
                  />
                  <div
                    className="w-px h-5"
                    style={{ background: 'var(--mc-card-border)' }}
                  />
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 flex-1">
                    <span
                      className="text-sm font-medium tracking-tight hidden sm:block"
                      style={{ color: 'var(--mc-text-muted)' }}
                    >
                      Dashboard
                    </span>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2.5">
                    <Bell
                      className="w-4 h-4 opacity-50"
                      style={{ color: 'var(--mc-text-muted)' }}
                    />
                    <ThemeToggle />
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(99,102,241,0.8)',
                        color: '#fff',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      R
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-auto relative z-0">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
