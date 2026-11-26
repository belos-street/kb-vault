import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { findContent, grammarCards } from '../../content/index.ts'
import { books } from '../../data/syllabus.ts'
import { findPatternKey } from '../../data/tags.ts'
import type { Topic } from '../../data/types.ts'
import { topicLabels, topics } from '../../data/types.ts'
import {
  addReading,
  dailyReadingWords,
  dueLedger,
  exportStore,
  importStore,
  ledgerPatternCounts,
  legacyReadingCount,
  listLedger,
  listReadings,
  readingsOn,
  recentReadingWords,
  removeReading,
  storageAvailable,
  submittedLessonCount,
  todayKey
} from '../../lib/progress.ts'
import { lessonHref } from '../router.ts'

const DAILY_TARGET_MIN = 1200
const DAILY_TARGET_MAX = 2000
const WEEKLY_TARGET = 8400
const MAX_NEW_WORDS = 3

export function HomePage() {
  const today = todayKey()
  const [version, setVersion] = useState(0)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [words, setWords] = useState('')
  const [minutes, setMinutes] = useState('')
  const [topic, setTopic] = useState<Topic>('daily-life')
  const [newWords, setNewWords] = useState('')
  const [summary, setSummary] = useState('')
  const [message, setMessage] = useState('')

  const readings = useMemo(
    () => readingsOn(today),
    // version 用来在增删后强制重读本地存储
    [today, version]
  )
  const todayWords = useMemo(() => dailyReadingWords(today), [today, version])
  const weeklyWords = useMemo(() => recentReadingWords(7), [today, version])
  const totalReadings = useMemo(() => listReadings().length, [version])
  const legacyCount = useMemo(() => legacyReadingCount(), [version])
  const dueCount = useMemo(() => dueLedger().length, [version])
  const ledgerTotal = useMemo(() => listLedger().length, [version])
  const topPatterns = useMemo(
    () => ledgerPatternCounts(7).slice(0, 3),
    [version]
  )
  const submitted = useMemo(() => submittedLessonCount(), [version])
  const canStore = useMemo(() => storageAvailable(), [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const parsedWords = Number(words)
    const parsedNewWords = Number(newWords)
    if (title.trim().length === 0 || summary.trim().length === 0) {
      setMessage('标题和一句话概括都要写，概括就是这天的理解检查。')
      return
    }
    if (!Number.isInteger(parsedWords) || parsedWords <= 0) {
      setMessage('词数要填正整数。')
      return
    }
    if (!Number.isInteger(parsedNewWords) || parsedNewWords < 0) {
      setMessage('生词数要填 0 或正整数。')
      return
    }
    const parsedMinutes = Number(minutes)
    addReading({
      title: title.trim(),
      url: url.trim(),
      words: parsedWords,
      minutes:
        Number.isInteger(parsedMinutes) && parsedMinutes > 0
          ? parsedMinutes
          : Math.max(1, Math.round(parsedWords / 130)),
      topic,
      newWordsPer100: parsedNewWords,
      summary: summary.trim()
    })
    setTitle('')
    setUrl('')
    setWords('')
    setMinutes('')
    setNewWords('')
    setSummary('')
    setMessage(
      parsedNewWords > MAX_NEW_WORDS
        ? `已记一笔。这篇偏难：${parsedNewWords}/100 词不认识，下次换一篇。`
        : '已记一笔。'
    )
    setVersion((value) => value + 1)
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const raw = await file.text()
    const result = importStore(raw)
    setMessage(
      result.ok
        ? `已导入 ${result.count} 讲进度。`
        : `导入失败：${result.message}`
    )
    event.target.value = ''
    setVersion((value) => value + 1)
  }

  const handleExport = () => {
    const blob = new Blob([exportStore()], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `lexio-${today}.json`
    anchor.click()
    URL.revokeObjectURL(href)
  }

  const belowDaily = todayWords < DAILY_TARGET_MIN
  const missingWords = DAILY_TARGET_MIN - todayWords

  return (
    <main className="shell">
      <header className="masthead">
        <p className="kicker">Lexio v2 · 语感优先</p>
        <h1>今天读了多少</h1>
        <p className="tagline">
          输入按词数计，不按讲数计。精读一讲，泛读几篇，写出五句。
        </p>
      </header>

      {!canStore && (
        <p className="notice notice-warn">
          浏览器本地存储不可用（可能是无痕模式），今天的记录会丢。先导出再换窗口。
        </p>
      )}

      <section className="home-block" aria-labelledby="home-stats">
        <h2 className="home-title" id="home-stats">
          今日
        </h2>
        <div className="stat-row">
          <p className="stat">
            <span className="stat-value">{todayWords}</span>
            <span className="stat-label">
              今日泛读 / {DAILY_TARGET_MIN}~{DAILY_TARGET_MAX}
            </span>
          </p>
          <p className="stat">
            <span className="stat-value">{weeklyWords}</span>
            <span className="stat-label">最近 7 天 / {WEEKLY_TARGET}</span>
          </p>
          <p className="stat">
            <span className="stat-value">{submitted}</span>
            <span className="stat-label">已提交精读</span>
          </p>
        </div>
        <p className="muted">
          {belowDaily
            ? `今天还差 ${missingWords} 词；按 300 词一篇，大约还差 ${Math.ceil(missingWords / 300)} 篇。`
            : '今天的下限到了。剩下的时间留给精读与输出。'}
        </p>
        <p className="muted">
          指标按滚动 7 天结算：最近 7 天 {weeklyWords} / {WEEKLY_TARGET}{' '}
          词。单日不足不算失败。
        </p>
      </section>

      <section className="home-block" aria-labelledby="home-log">
        <h2 className="home-title" id="home-log">
          记一篇泛读
        </h2>
        <form className="reading-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>标题</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="文章标题"
            />
          </label>
          <label className="field">
            <span>链接（可选）</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>词数</span>
              <input
                value={words}
                inputMode="numeric"
                onChange={(event) => setWords(event.target.value)}
                placeholder="约 300"
              />
            </label>
            <label className="field">
              <span>用时（分钟，可空）</span>
              <input
                value={minutes}
                inputMode="numeric"
                onChange={(event) => setMinutes(event.target.value)}
                placeholder="按 130 wpm 估"
              />
            </label>
            <label className="field">
              <span>主题</span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value as Topic)}>
                {topics.map((value) => (
                  <option value={value} key={value}>
                    {topicLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>第一段 100 词里不认识几个</span>
              <input
                value={newWords}
                inputMode="numeric"
                onChange={(event) => setNewWords(event.target.value)}
                placeholder="2（>3 换一篇）"
              />
            </label>
          </div>
          <label className="field">
            <span>一句话概括（英文，理解检查）</span>
            <textarea
              rows={2}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="One sentence about what the text says."
            />
          </label>
          <div className="editor-foot">
            <span className="muted">
              先读第一段数生词：超过 3 个就换文，别硬读。
            </span>
            <button className="btn btn-ink" type="submit">
              记入今天
            </button>
          </div>
        </form>

        {message.length > 0 && <p className="notice">{message}</p>}

        {readings.length > 0 && (
          <ul className="reading-list">
            {readings.map((entry) => (
              <li className="reading-entry" key={entry.id}>
                <div className="reading-head">
                  {entry.url.length > 0 ? (
                    <a
                      className="reading-title"
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer">
                      {entry.title}
                    </a>
                  ) : (
                    <span className="reading-title">{entry.title}</span>
                  )}
                  <span className="muted">
                    {entry.words} 词 · {entry.minutes} 分钟 ·{' '}
                    {topicLabels[entry.topic]} · 生词 {entry.newWordsPer100}/100
                  </span>
                </div>
                <p className="reading-summary">{entry.summary}</p>
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => {
                    removeReading(entry.id)
                    setVersion((value) => value + 1)
                  }}>
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-block" aria-labelledby="home-lessons">
        <h2 className="home-title" id="home-lessons">
          精读
        </h2>
        {books.map((book) =>
          book.units.map((unit) => (
            <div className="unit" key={`${book.id}-${unit.id}`}>
              <p className="unit-title">{unit.title}</p>
              <ul className="lesson-index">
                {unit.lessons.map((lesson) => {
                  const content = findContent(lesson.id)
                  return (
                    <li key={lesson.id}>
                      {lesson.live && content ? (
                        <a className="lesson-link" href={lessonHref(lesson.id)}>
                          <span className="lesson-number">{lesson.number}</span>
                          <span>{lesson.title}</span>
                          <span className="muted">
                            {topicLabels[lesson.topic]} · 分 {content.sessions}{' '}
                            次
                          </span>
                        </a>
                      ) : (
                        <span className="lesson-link is-planned">
                          <span className="lesson-number">{lesson.number}</span>
                          <span>{lesson.title}</span>
                          <span className="muted">待上线</span>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="home-block" aria-labelledby="home-review">
        <h2 className="home-title" id="home-review">
          复习
        </h2>
        <p className="muted">
          到期 {dueCount} 条；台账共 {ledgerTotal} 条。
          {topPatterns.length > 0
            ? `最近 7 天最多：${topPatterns
                .map(
                  (item) =>
                    findPatternKey(item.patternKey)?.label ?? item.patternKey
                )
                .join('、')}。`
            : '写完的句对先入账，再按 1/3/7/14 天回来。'}
        </p>
        <a className="backlink" href="#/review">
          打开复习
        </a>
      </section>

      <section className="home-block" aria-labelledby="home-grammar">
        <h2 className="home-title" id="home-grammar">
          查表
        </h2>
        <p className="muted">
          卡住时只查一条；卡片按错误频率补，不按章节顺序。
        </p>
        <a className="backlink" href="#/grammar">
          语法卡（{Object.keys(grammarCards).length} 张）
        </a>
      </section>

      <section className="home-block" aria-labelledby="home-data">
        <h2 className="home-title" id="home-data">
          数据
        </h2>
        <p className="muted">
          全部记录存在这台设备的 localStorage。共 {totalReadings} 篇泛读记录；
          换设备或清缓存前先导出。
        </p>
        {legacyCount > 0 && (
          <p className="notice">
            有 {legacyCount}{' '}
            条旧格式记录未迁移：不参与统计，但已保留在导出文件里。
          </p>
        )}
        <div className="data-row">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={handleExport}>
            导出 JSON
          </button>
          <label className="btn btn-ghost">
            导入 JSON
            <input
              className="file-input"
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
            />
          </label>
        </div>
      </section>
    </main>
  )
}
