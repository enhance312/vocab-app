import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type ThemeKey = 'warm-brown' | 'sage-green' | 'slate-blue'

export interface Theme {
  key: ThemeKey
  name: string
  bg: string
  cardBg: string
  textPrimary: string
  textSecondary: string
  meaningText: string
  accent: string
  accentHover: string
  success: string
  border: string
  navBg: string
  progressBar: string
  badgeText: string
}

export const themes: Record<ThemeKey, Theme> = {
  'warm-brown': {
    key: 'warm-brown',
    name: '暖棕',
    bg: '#faf7f2',
    cardBg: '#ffffff',
    textPrimary: '#3d3929',
    textSecondary: '#8b8680',
    meaningText: '#8b7355',
    accent: '#c2956b',
    accentHover: '#a87d56',
    success: '#6b9b7b',
    border: '#ede8e0',
    navBg: '#ffffff',
    progressBar: '#c2956b',
    badgeText: '#8b7355',
  },
  'sage-green': {
    key: 'sage-green',
    name: '灰绿',
    bg: '#f5f6f3',
    cardBg: '#ffffff',
    textPrimary: '#2d332b',
    textSecondary: '#8a8e85',
    meaningText: '#687a65',
    accent: '#7d8e74',
    accentHover: '#6a7a62',
    success: '#5d8a6e',
    border: '#e8ebe4',
    navBg: '#ffffff',
    progressBar: '#7d8e74',
    badgeText: '#687a65',
  },
  'slate-blue': {
    key: 'slate-blue',
    name: '灰蓝',
    bg: '#f4f5f7',
    cardBg: '#ffffff',
    textPrimary: '#2d3033',
    textSecondary: '#8b8e92',
    meaningText: '#657080',
    accent: '#6e7d90',
    accentHover: '#5c6b7e',
    success: '#5b8a85',
    border: '#e6e9ed',
    navBg: '#ffffff',
    progressBar: '#6e7d90',
    badgeText: '#657080',
  },
}

interface ThemeContextType {
  theme: Theme
  setTheme: (key: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes['warm-brown'],
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem('vocab-theme')
    if (saved && saved in themes) return saved as ThemeKey
    return 'warm-brown'
  })

  const theme = themes[key]

  useEffect(() => {
    localStorage.setItem('vocab-theme', key)
    // Apply CSS variables
    const root = document.documentElement
    root.style.setProperty('--color-bg', theme.bg)
    root.style.setProperty('--color-card-bg', theme.cardBg)
    root.style.setProperty('--color-text-primary', theme.textPrimary)
    root.style.setProperty('--color-text-secondary', theme.textSecondary)
    root.style.setProperty('--color-meaning', theme.meaningText)
    root.style.setProperty('--color-accent', theme.accent)
    root.style.setProperty('--color-accent-hover', theme.accentHover)
    root.style.setProperty('--color-success', theme.success)
    root.style.setProperty('--color-border', theme.border)
    root.style.setProperty('--color-nav-bg', theme.navBg)
    root.style.setProperty('--color-progress', theme.progressBar)
    root.style.setProperty('--color-badge-text', theme.badgeText)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setKey }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
