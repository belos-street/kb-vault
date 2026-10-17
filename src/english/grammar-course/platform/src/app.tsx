import { useCallback, useEffect, useMemo, useState } from 'react'
import { byKey } from './data.ts'
import { Library } from './library.tsx'
import { LessonView } from './lesson-view.tsx'
import { createStore } from './progress.ts'
import { useTheme } from './theme.ts'

// hash 路由：#/lesson/UxxLnn（课号纯 ASCII，decodeURIComponent 兜底中文场景）
function readHashKey(): string | undefined {
  const raw = location.hash.match(/^#\/lesson\/(.+)$/)?.[1]
  if (raw === undefined) return undefined
  let key: string
  try {
    key = decodeURIComponent(raw)
  } catch {
    key = raw
  }
  return byKey.has(key) ? key : undefined
}

export function App() {
  const [theme, toggleTheme] = useTheme()
  const [key, setKey] = useState<string | undefined>(() => readHashKey())
  const { store } = useMemo(() => createStore(), [])

  useEffect(() => {
    const onHash = () => setKey(readHashKey())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goto = useCallback(
    (next: string) => {
      location.hash = `#/lesson/${next}`
      setKey(next)
      store.setLastKey(next)
    },
    [store]
  )

  const home = useCallback(() => {
    location.hash = ''
    setKey(undefined)
  }, [])

  if (key !== undefined) {
    return (
      <LessonView
        lessonId={key}
        onOpen={goto}
        onHome={home}
        theme={theme}
        onToggleTheme={toggleTheme}
        store={store}
      />
    )
  }

  return (
    <Library
      onOpen={goto}
      lastKey={store.getLastKey()}
      theme={theme}
      onToggleTheme={toggleTheme}
      store={store}
    />
  )
}
