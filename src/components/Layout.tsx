import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useTheme, type ThemeKey } from '../store/ThemeContext'

const tabs = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/progress', label: '进度', icon: '📊' },
  { to: '/words', label: '词表', icon: '📖' },
]

const themeLabels: Record<ThemeKey, string> = {
  'warm-brown': '暖棕',
  'sage-green': '灰绿',
  'slate-blue': '灰蓝',
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const showNav = !location.pathname.startsWith('/study')
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const keys = Object.keys(themeLabels) as ThemeKey[]
    const idx = keys.indexOf(theme.key)
    setTheme(keys[(idx + 1) % keys.length])
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {showNav && (
          <div className="flex justify-end mb-2">
            <button
              onClick={cycleTheme}
              className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-card-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] active:scale-95 transition-transform"
            >
              🎨 {themeLabels[theme.key]}
            </button>
          </div>
        )}
        {children}
      </main>
      {showNav && (
        <nav className="sticky bottom-0 bg-[var(--color-nav-bg)]/95 backdrop-blur border-t border-[var(--color-border)]">
          <div className="flex justify-around py-3">
            {tabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 text-xs px-4 py-1 rounded-lg transition-colors ${
                    isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
                  }`
                }
              >
                <span className="text-xl">{t.icon}</span>
                <span>{t.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
