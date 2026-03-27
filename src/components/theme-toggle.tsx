'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-8 h-8 flex items-center justify-center rounded-lg opacity-0">
        <Sun className="w-4 h-4" />
      </button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105"
      style={{
        border: '1px solid var(--mc-card-border)',
        background: 'var(--mc-card)',
        color: 'var(--mc-text-muted)',
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-yellow-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-slate-500" />
      )}
    </button>
  )
}
