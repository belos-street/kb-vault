import { useCallback, useEffect, useMemo, useState } from 'react'
import { units } from './catalog.ts'
import { isLive } from './data.ts'
import { Library } from './library.tsx'
import { LessonView } from './lesson-view.tsx'
import { createStore } from './progress.ts'
import { useTheme } from './theme.ts'
import { UnitQuiz } from './unit-quiz.tsx'

// hash 路由：#/lesson/UxxLnn（课号纯 ASCII，decodeURIComponent 兜底中文场景）
// 单元自测：#/unit/Uxx——当场判分不计进度，不落 ProgressStore

type Route =
  | { kind: 'lesson'; key: string }
  | { kind: 'unit'; id: string }
  | { kind: 'home' }

function decodePart(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function readRoute(): Route {
  const unitRaw = location.hash.match(/^#\/unit\/(.+)$/)?.[1]
  if (unitRaw !== undefined) {
    const id = decodePart(unitRaw)
    return units.some((u) => u.id === id)
      ? { kind: 'unit', id }
      : { kind: 'home' }
  }
  const lessonRaw = location.hash.match(/^#\/lesson\/(.+)$/)?.[1]
  if (lessonRaw === undefined) return { kind: 'home' }
  const key = decodePart(lessonRaw)
  return isLive(key) ? { kind: 'lesson', key } : { kind: 'home' }
}

// 背景装饰层（design.md §2.5）：弱渐变光斑 + 点阵纹理，固定在内容之下慢速漂移
function BgDeco() {
  return (
    <div className="bg-deco" aria-hidden="true">
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />
      <div className="bg-grid" />
    </div>
  )
}

export function App() {
  const [theme, toggleTheme] = useTheme()
  const [route, setRoute] = useState<Route>(() => readRoute())
  const { store } = useMemo(() => createStore(), [])

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goto = useCallback(
    (next: string) => {
      location.hash = `#/lesson/${next}`
      setRoute({ kind: 'lesson', key: next })
      store.setLastKey(next)
    },
    [store]
  )

  const openUnit = useCallback((id: string) => {
    location.hash = `#/unit/${id}`
    setRoute({ kind: 'unit', id })
  }, [])

  const home = useCallback(() => {
    location.hash = ''
    setRoute({ kind: 'home' })
  }, [])

  if (route.kind === 'lesson') {
    return (
      <>
        <BgDeco />
        <LessonView
          lessonId={route.key}
          onOpen={goto}
          onHome={home}
          theme={theme}
          onToggleTheme={toggleTheme}
          store={store}
        />
      </>
    )
  }

  if (route.kind === 'unit') {
    return (
      <>
        <BgDeco />
        <UnitQuiz
          unitId={route.id}
          onHome={home}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </>
    )
  }

  return (
    <>
      <BgDeco />
      <Library
        onOpen={goto}
        onUnitQuiz={openUnit}
        lastKey={store.getLastKey()}
        theme={theme}
        onToggleTheme={toggleTheme}
        store={store}
      />
    </>
  )
}
