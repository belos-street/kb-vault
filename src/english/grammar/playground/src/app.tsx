import { useCallback, useEffect, useMemo, useState } from 'react'
import { byKey } from './data.ts'
import { Library } from './library.tsx'
import { LessonView } from './lesson-view.tsx'
import { createStore, type LessonProgress } from './progress.ts'
import { useTheme } from './theme.ts'

// hash 路由：#/lesson/<key>（无构建期路由依赖，GitHub Pages 静态托管友好）
// 注意：key 含中文（板块标识），浏览器会把 hash URL 编码，读取时必须解码
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
  const [lastKey, setLastKey] = useState<string | undefined>(() =>
    store.getLastKey()
  )
  // 进度版本号：判定后 bump 触发重读（store 无订阅机制，保持简单）
  const [pv, setPv] = useState(0)
  const bump = useCallback(() => setPv((v) => v + 1), [])
  void pv

  useEffect(() => {
    const onHash = () => setKey(readHashKey())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goto = useCallback(
    (next: string) => {
      location.hash = `#/lesson/${next}`
      setKey(next)
      setLastKey(next)
      store.setLastKey(next)
    },
    [store]
  )

  const home = useCallback(() => {
    location.hash = ''
    setKey(undefined)
  }, [])

  const lesson = key !== undefined ? byKey.get(key) : undefined
  if (lesson === undefined) {
    return (
      <Library
        onOpen={goto}
        lastKey={lastKey}
        theme={theme}
        onToggleTheme={toggleTheme}
        store={store}
      />
    )
  }
  const progress: LessonProgress = store.getLesson(
    lesson.key,
    lesson.dataVersion
  )
  return (
    <LessonView
      lesson={lesson}
      progress={progress}
      store={store}
      onProgressChanged={bump}
      theme={theme}
      onToggleTheme={toggleTheme}
      onGoto={goto}
      onHome={home}
    />
  )
}
