import type { Chapter } from '../data/types.ts'
import {
  exerciseEntries,
  exerciseEntriesByChapter
} from '../lib/exercise-stats.ts'
import { useExerciseResults } from '../lib/exercise-progress.ts'
import { priorityLabels } from '../data/priorities.ts'
import {
  multivariableLessonCount,
  totalMinutes,
  upperLessonCount,
  videoLessonCount
} from '../data/syllabus.ts'
import { MathText } from './math.tsx'
import { Stars } from './stars.tsx'

export function Home({
  chapters,
  done,
  onOpen
}: {
  chapters: Chapter[]
  done: Set<string>
  onOpen: (id: string) => void
}) {
  const totalLessons = chapters.reduce(
    (sum, chapter) => sum + chapter.lessons.length,
    0
  )
  const firstLive = chapters
    .flatMap((chapter) => chapter.lessons)
    .find((lesson) => lesson.live)
  const mustLearn = chapters
    .flatMap((chapter) => chapter.lessons)
    .filter((lesson) => lesson.priority === 5)
  const liveMustLearn = mustLearn.filter((lesson) => lesson.live)
  const pendingMustLearn = mustLearn.length - liveMustLearn.length
  const liveChapterTitles = chapters
    .filter((chapter) => chapter.lessons.some((lesson) => lesson.live))
    .map((chapter) => {
      const liveCount = chapter.lessons.filter((lesson) => lesson.live).length
      return `「${chapter.title}」${liveCount}/${chapter.lessons.length} 讲`
    })
    .join('、')

  const exerciseResults = useExerciseResults()
  const correctExercises = exerciseEntries.filter(
    (entry) => exerciseResults[entry.item.id] === 'correct'
  ).length
  const wrongExercises = exerciseEntries.filter(
    (entry) => exerciseResults[entry.item.id] === 'wrong'
  )

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-kicker">考研数学二 · 高等数学</div>
        <h1>
          把极限、导数、积分
          <br />
          拆成一讲一讲地学
        </h1>
        <p className="hero-lead">
          上册 {upperLessonCount} 讲（视频 {videoLessonCount} 讲 + 补充 1 讲），
          另补多元函数微积分 {multivariableLessonCount} 讲，共 {chapters.length}{' '}
          章 {totalLessons} 讲；每讲列出细分知识点，已上线
          讲次配公式推导与例题，部分讲次配交互图。当前已上线
          {liveChapterTitles}。
        </p>
        <div className="hero-stats">
          <div>
            <strong>{chapters.length}</strong>
            <span>章</span>
          </div>
          <div>
            <strong>{totalLessons}</strong>
            <span>讲</span>
          </div>
          <div>
            <strong>{Math.round(totalMinutes / 60)}</strong>
            <span>小时课程</span>
          </div>
          <div>
            <strong>{done.size}</strong>
            <span>讲已完成</span>
          </div>
          <div>
            <strong>
              {correctExercises}/{exerciseEntries.length}
            </strong>
            <span>练习答对</span>
          </div>
        </div>
        {firstLive ? (
          <button
            type="button"
            className="hero-cta"
            onClick={() => onOpen(firstLive.id)}>
            从 {firstLive.number} {firstLive.title} 开始
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </section>

      <section className="map" aria-labelledby="map-title">
        <div className="section-head">
          <h2 id="map-title">课程地图</h2>
          <span>点击讲次进入讲义</span>
        </div>

        <div className="priority-note">
          <span className="priority-note-label">考试优先级</span>
          {([5, 4, 3, 2, 1] as const).map((priority) => (
            <span key={priority} className="priority-note-item">
              <Stars priority={priority} size="xs" />
              {priorityLabels[priority]}
            </span>
          ))}
        </div>

        <div className="priority-path">
          <span className="priority-path-label">重点复习（已上线）</span>
          {liveMustLearn.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onOpen(lesson.id)}>
              {lesson.number} {lesson.title}
            </button>
          ))}
          {pendingMustLearn > 0 ? (
            <span className="priority-path-pending">
              另有 {pendingMustLearn} 讲待更新
            </span>
          ) : null}
        </div>

        {wrongExercises.length > 0 ? (
          <section className="wrong-book">
            <div className="wrong-book-head">
              <span>错题本</span>
              <strong>{wrongExercises.length} 题待复习</strong>
            </div>
            <div className="wrong-book-list">
              {wrongExercises.map((entry) => (
                <button
                  key={entry.item.id}
                  type="button"
                  onClick={() => onOpen(entry.lessonId)}>
                  <span className="wrong-lesson">
                    {entry.lessonNumber} {entry.lessonTitle}
                  </span>
                  <span className="wrong-question">
                    <MathText text={entry.item.question} />
                  </span>
                  <i>去重做 →</i>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {chapters.map((chapter) => {
          const finished = chapter.lessons.filter((lesson) =>
            done.has(lesson.id)
          ).length
          const live = chapter.lessons.filter((lesson) => lesson.live).length
          const chapterExercises =
            exerciseEntriesByChapter.get(chapter.id) ?? []
          const chapterCorrect = chapterExercises.filter(
            (entry) => exerciseResults[entry.item.id] === 'correct'
          ).length

          return (
            <article key={chapter.id} className="chapter-card">
              <header className="chapter-head">
                <div>
                  <div className="chapter-label">
                    {chapter.label}
                    <span
                      className={`chapter-status${live > 0 ? ' live' : ''}`}>
                      {live > 0 ? `${live} 讲已上线` : '待更新'}
                    </span>
                  </div>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.goal}</p>
                </div>
                <div className="chapter-progress">
                  <strong>
                    {finished}
                    <i>/{chapter.lessons.length}</i>
                  </strong>
                  <span>讲完成</span>
                  {chapterExercises.length > 0 ? (
                    <span className="chapter-exercise">
                      练习答对 {chapterCorrect}/{chapterExercises.length}
                    </span>
                  ) : null}
                </div>
              </header>

              <ul className="lesson-list">
                {chapter.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className={`lesson-row${done.has(lesson.id) ? ' done' : ''}`}
                      onClick={() => onOpen(lesson.id)}>
                      <span className="lesson-num">{lesson.number}</span>
                      <span className="lesson-main">
                        <strong>
                          {lesson.title}
                          <Stars priority={lesson.priority} />
                          {done.has(lesson.id) ? (
                            <i className="lesson-check">✓</i>
                          ) : null}
                        </strong>
                        <small>{lesson.tagline}</small>
                      </span>
                      <span className="lesson-meta">
                        {lesson.points.length} 个知识点 · {lesson.minutes} 分钟
                      </span>
                      {!lesson.live ? (
                        <span className="lesson-badge">待更新</span>
                      ) : (
                        <span className="lesson-arrow" aria-hidden="true">
                          →
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </section>
    </div>
  )
}
