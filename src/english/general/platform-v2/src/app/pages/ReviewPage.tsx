import { useMemo, useState } from 'react'
import { errorTagLabels, findPatternKey } from '../../data/tags.ts'
import {
  dueLedger,
  ledgerPatternCounts,
  listLedger,
  reviewLedgerEntry,
  todayKey
} from '../../lib/progress.ts'
import { REVIEW_INTERVALS, isGraduated } from '../../lib/review.ts'
import { seedDueEntries } from '../../lib/seed.ts'
import { lessonHref } from '../router.ts'

export function ReviewPage() {
  const [version, setVersion] = useState(0)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  const due = useMemo(() => dueLedger(), [version])
  const counts = useMemo(() => ledgerPatternCounts(7), [version])
  const ledger = useMemo(() => listLedger(), [version])

  const total = ledger.length
  const unsorted = ledger.filter((entry) => entry.tag === 'unsorted').length
  const graduated = ledger.filter((entry) => isGraduated(entry.stage)).length
  const unsortedShare = total === 0 ? 0 : Math.round((unsorted / total) * 100)
  const maxCount = counts[0]?.count ?? 1

  const reveal = (id: string) => {
    setRevealed((current) => new Set(current).add(id))
  }

  const review = (id: string, passed: boolean) => {
    reviewLedgerEntry(id, passed)
    setVersion((value) => value + 1)
  }

  return (
    <main className="shell">
      <header className="masthead">
        <p className="kicker">
          <a className="backlink" href="#/">
            Lexio v2
          </a>
          {' · 复习'}
        </p>
        <h1>到期条目</h1>
        <p className="tagline">
          1 / 3 / 7 / 14 天。先看自己写的，再决定记没记住。
        </p>
      </header>

      <section className="home-block">
        <div className="stat-row">
          <p className="stat">
            <span className="stat-value">{due.length}</span>
            <span className="stat-label">今天到期</span>
          </p>
          <p className="stat">
            <span className="stat-value">{total}</span>
            <span className="stat-label">台账总条数</span>
          </p>
          <p className="stat">
            <span className="stat-value">{graduated}</span>
            <span className="stat-label">已走完 14 天</span>
          </p>
          <p className="stat">
            <span className="stat-value">{unsortedShare}%</span>
            <span className="stat-label">未分类占比（&gt;30% 缺卡）</span>
          </p>
        </div>
        <p className="muted">
          复现率要等条目攒满 14 天才有读数；在那之前只看下面这张结构分布。
        </p>
        {import.meta.env.DEV && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              if (seedDueEntries()) setVersion((value) => value + 1)
            }}>
            造 3 条到期（仅开发）
          </button>
        )}
      </section>

      <section className="home-block">
        <h2 className="home-title">最近 7 天各结构出现次数</h2>
        {counts.length === 0 ? (
          <p className="muted">
            还没有台账记录。先去精读页写一次，提交后把句对记入台账。
          </p>
        ) : (
          <ul className="count-list">
            {counts.map((item) => {
              const pattern = findPatternKey(item.patternKey)
              return (
                <li className="count-item" key={item.patternKey}>
                  <span>{pattern?.label ?? item.patternKey}</span>
                  <span className="count-bar">
                    <span
                      style={{
                        width: `${Math.min(100, (item.count / maxCount) * 100)}%`
                      }}
                    />
                  </span>
                  <span className="muted">{item.count}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="home-block">
        <h2 className="home-title">逐条过</h2>
        {due.length === 0 ? (
          <p className="muted">
            今天没有到期条目。台账共 {total} 条，下一次到期日见各条记录。
          </p>
        ) : (
          <ul className="review-list">
            {due.map((entry) => {
              const isRevealed = revealed.has(entry.id)
              const pattern = findPatternKey(entry.patternKey)
              return (
                <li className="review-card" key={entry.id}>
                  <div className="review-head">
                    <span className="level">{errorTagLabels[entry.tag]}</span>
                    <span className="muted">
                      {pattern?.label ?? entry.patternKey} · 第{' '}
                      {entry.stage + 1} 次 · 下次{' '}
                      {entry.nextReviewAt || '已毕业'}
                    </span>
                    <a className="backlink" href={lessonHref(entry.lessonId)}>
                      出处
                    </a>
                  </div>

                  <p className="review-mine">{entry.mySentence}</p>

                  {isRevealed ? (
                    <p className="review-target">
                      参考：{entry.targetSentence}
                    </p>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => reveal(entry.id)}>
                      看参考
                    </button>
                  )}

                  {isRevealed && (
                    <div className="review-actions">
                      <button
                        className="btn btn-ink"
                        type="button"
                        onClick={() => review(entry.id, true)}>
                        记住了，推进
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => review(entry.id, false)}>
                        没记住，明天再来
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <footer className="footer">
        <p>
          间隔：{REVIEW_INTERVALS.join(' / ')} 天。没记住的条目回到第 1 天；走完
          14 天即毕业，不再出现在到期列表。
        </p>
        <p className="muted">今天：{todayKey()}</p>
      </footer>
    </main>
  )
}
