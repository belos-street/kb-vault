import { useEffect, useState } from 'react'

// Trae 双主题：手动选择存 localStorage，缺省跟随系统（design.md §2.1）
export type ThemeChoice = 'light' | 'dark'

// 独立 key：与 grammar-play 分开，避免两站主题互相联动
const KEY = 'grammar-course-theme'

function systemTheme(): ThemeChoice {
  return typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function readChoice(): ThemeChoice {
  const saved = localStorage.getItem(KEY)
  return saved === 'dark' || saved === 'light' ? saved : systemTheme()
}

function apply(choice: ThemeChoice) {
  document.documentElement.dataset['theme'] = choice
}

export function useTheme(): [ThemeChoice, () => void] {
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    const c = readChoice()
    if (typeof document !== 'undefined') apply(c)
    return c
  })

  useEffect(() => {
    apply(theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return [theme, toggle]
}
