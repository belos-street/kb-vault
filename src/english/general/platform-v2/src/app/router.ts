import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'grammar' }
  | { name: 'review' }
  | { name: 'lesson'; id: string }

export function parseRoute(hash: string): Route {
  if (hash === '#/grammar') return { name: 'grammar' }
  if (hash === '#/review') return { name: 'review' }
  const match = /^#\/lesson\/([\w-]+)$/.exec(hash)
  const id = match?.[1]
  if (id) return { name: 'lesson', id }
  return { name: 'home' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(window.location.hash)
  )

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export function lessonHref(id: string): string {
  return `#/lesson/${id}`
}
