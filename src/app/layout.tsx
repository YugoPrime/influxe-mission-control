import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen`}
      >
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 flex flex-col min-h-screen">
              <header className="h-12 border-b border-slate-800 flex items-center px-4 gap-3 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
                <SidebarTrigger className="text-slate-400 hover:text-white" />
                <div className="w-px h-5 bg-slate-700" />
                <span className="text-sm text-slate-400">Influxe Mission Control</span>
              </header>
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
