import { useEffect, useState } from 'react'
import { RichText } from './rich-text.tsx'

export interface TocSection {
  id: string
  text: string
}

/** 顶栏高度，用于计算文章阅读起点 */
const TOPBAR_OFFSET = 56
/** 视口顶部往下多少像素算作正文阅读位置 */
const HEADING_MARKER = 96
const RING_RADIUS = 20
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

export function ReadingToc({ sections }: { sections: TocSection[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const article = document.querySelector<HTMLElement>('.lesson')
    if (!article) return undefined

    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null)

    let frame = 0

    const update = () => {
      frame = 0
      const articleTop = article.getBoundingClientRect().top + window.scrollY
      const start = articleTop - TOPBAR_OFFSET
      const end = articleTop + article.offsetHeight - window.innerHeight
      const scrolled = window.scrollY
      const ratio =
        end <= start
          ? scrolled + window.innerHeight >= articleTop
            ? 1
            : 0
          : (scrolled - start) / (end - start)
      setProgress(Math.round(Math.min(Math.max(ratio, 0), 1) * 100))

      const marker = scrolled + HEADING_MARKER
      let current = headings[0]?.id ?? null
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top + scrolled > marker) break
        current = heading.id
      }
      setActiveId(current)
    }

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [sections])

  // 切换篇目后收起抽屉
  useEffect(() => {
    setOpen(false)
  }, [sections])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const activeIndex = sections.findIndex((section) => section.id === activeId)

  const jump = (id: string) => {
    setOpen(false)
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const renderSection = (section: TocSection, index: number) => {
    const isActive = section.id === activeId
    const isRead = activeIndex >= 0 && index < activeIndex
    return (
      <li
        key={section.id}
        className={`read-item${isActive ? ' active' : ''}${
          isRead ? ' read' : ''
        }`}>
        <a
          href={`#${section.id}`}
          aria-current={isActive ? 'location' : undefined}
          onClick={(event) => {
            event.preventDefault()
            jump(section.id)
          }}>
          <span className="read-index">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="read-label">
            <RichText text={section.text} />
          </span>
        </a>
      </li>
    )
  }

  return (
    <>
      <aside className="read-rail" aria-label="文章目录">
        <div className="read-rail-head">
          <span className="read-rail-kicker">本讲目录</span>
          <span className="read-rail-percent">{progress}%</span>
        </div>
        <div
          className="read-bar"
          role="progressbar"
          aria-label="阅读进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <ol className="read-list">{sections.map(renderSection)}</ol>
      </aside>

      <button
        type="button"
        className="read-fab"
        onClick={() => setOpen((value) => !value)}
        aria-label={`本讲目录，已读 ${progress}%`}
        aria-expanded={open}
        aria-controls="read-sheet">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle className="read-fab-track" cx="24" cy="24" r={RING_RADIUS} />
          <circle
            className="read-fab-value"
            cx="24"
            cy="24"
            r={RING_RADIUS}
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - progress / 100)}
          />
        </svg>
        <span className="read-fab-text">{progress}%</span>
      </button>

      <div
        className={`read-sheet-scrim${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <section
        id="read-sheet"
        className={`read-sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="本讲目录">
        <header className="read-sheet-head">
          <div>
            <span className="read-rail-kicker">本讲目录</span>
            <strong>已读 {progress}%</strong>
          </div>
          <button
            type="button"
            className="read-sheet-close"
            onClick={() => setOpen(false)}
            aria-label="关闭目录">
            ×
          </button>
        </header>
        <div
          className="read-bar"
          role="progressbar"
          aria-label="阅读进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <ol className="read-list read-list-sheet">
          {sections.map(renderSection)}
        </ol>
      </section>
    </>
  )
}
