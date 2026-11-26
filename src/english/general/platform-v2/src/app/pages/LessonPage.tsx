import { useState } from 'react'
import { findContent } from '../../content/index.ts'
import { getLessonProgress } from '../../lib/progress.ts'
import {
  findLesson,
  findUnitOfLesson,
  nextLesson
} from '../../data/syllabus.ts'
import { topicLabels } from '../../data/types.ts'
import { BlockRenderer, flowOf } from '../block-renderer.tsx'
import { lessonHref } from '../router.ts'

export function LessonPage({ id }: { id: string }) {
  const content = findContent(id)
  const meta = findLesson(id)
  const location = findUnitOfLesson(id)
  const [submitted, setSubmitted] = useState(
    () => getLessonProgress(id).submitted
  )

  if (!content || !meta || !location) {
    return (
      <main className="shell">
        <p className="notice">这一讲还没有内容，或者 id 不存在：{id}</p>
        <a className="backlink" href="#/">
          回到今日
        </a>
      </main>
    )
  }

  const following = nextLesson(id)

  return (
    <main className="shell">
      <header className="masthead">
        <p className="kicker">
          <a className="backlink" href="#/">
            Lexio v2
          </a>
          {' · '}
          {location.book.title} · {location.unit.title}
        </p>
        <h1>{content.title}</h1>
        <p className="tagline">{meta.tagline}</p>
        <div className="meta-row">
          <span>
            {content.minutes} 分钟 · 分 {content.sessions} 次，每次约{' '}
            {Math.round(content.minutes / content.sessions)} 分钟
          </span>
          <span>{content.inputWords} 词</span>
          <span>{topicLabels[content.topic]}</span>
          <span>{meta.number}</span>
        </div>
      </header>

      <nav className="flow" aria-label="本讲顺序">
        {flowOf(content.blocks).map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </nav>

      <BlockRenderer
        lessonId={id}
        blocks={content.blocks}
        submitted={submitted}
        onSubmitted={() => setSubmitted(true)}
      />

      <footer className="footer">
        {following ? (
          <p>
            {following.live ? (
              <a className="backlink" href={lessonHref(following.id)}>
                下一讲：{following.title}
              </a>
            ) : (
              `下一讲：${following.title}（待上线）。先把这一讲的输入、输出和错因跑完。`
            )}
          </p>
        ) : (
          <p>本单元到此为止。回今日页记一篇泛读，或重写昨天的输出。</p>
        )}
      </footer>
    </main>
  )
}
