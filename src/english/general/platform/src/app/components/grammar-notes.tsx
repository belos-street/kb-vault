import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { Lesson, NoteBlock, OutputTask } from '../../schema/lesson.ts'
import { useSpeech } from '../hooks/use-speech.ts'
import { progressStore } from '../progress.ts'
import { extractEnglish } from '../utils/text.ts'
import { InlineText } from './inline-text.tsx'

const OUTPUT_LABEL: Record<OutputTask['kind'], string> = {
  retell: '复述',
  writing: '仿写',
  check: '自检'
}

/** 通用讲解块渲染：段落 / 表格 / 提示框 / 有序步骤 */
function NoteBlocks({ blocks }: { blocks: NoteBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'table') {
          return (
            <div key={i} className="table-wrap">
              <table className="note-table">
                <thead>
                  <tr>
                    {b.headers.map((h, j) => (
                      <th key={j}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j}>
                      {r.map((c, k) => (
                        // 移动端卡片化：td 以列名作为 data-label，由 CSS 渲染
                        <td key={k} data-label={b.headers[k]}>
                          <InlineText text={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (b.type === 'tip') {
          return (
            <p key={i} className="note-tip">
              <InlineText text={b.text} />
            </p>
          )
        }
        if (b.type === 'steps') {
          return (
            <ol key={i} className="note-steps">
              {b.items.map((s, j) => (
                <li key={j}>
                  <InlineText text={s} />
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i} className="note-p">
            <InlineText text={b.text} />
          </p>
        )
      })}
    </>
  )
}

/** 输出任务卡：textarea 草稿 + checklist 自评，blur / 勾选时持久化 */
function OutputTaskCard({
  lessonId,
  task,
  index
}: {
  lessonId: string
  task: OutputTask
  index: number
}) {
  const key = `output-${index}`
  const saved = progressStore.notesDraft(lessonId, key)
  const [draft, setDraft] = useState(saved.draft)
  const [checked, setChecked] = useState<number[]>(saved.checked)
  // 参考范文默认折叠（答案分离）：写完自评后再揭示对照
  const [showSample, setShowSample] = useState(false)

  const persist = (d: string, c: number[]) => {
    progressStore.saveNotesDraft(lessonId, key, { draft: d, checked: c })
  }

  const toggle = (i: number) => {
    const next = checked.includes(i)
      ? checked.filter((x) => x !== i)
      : [...checked, i]
    setChecked(next)
    persist(draft, next)
  }

  return (
    <div className="output-task">
      <h3>
        <span className="kind">{OUTPUT_LABEL[task.kind]}</span>
        {task.prompt}
      </h3>
      {task.reference && <p className="note-ref">{task.reference}</p>}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => persist(draft, checked)}
        placeholder="在这里写下你的答案（失焦自动保存）"
      />
      {task.checklist && (
        <>
          {task.checklist.map((c, i) => (
            <label key={i} className="note-check">
              <input
                type="checkbox"
                checked={checked.includes(i)}
                onChange={() => toggle(i)}
              />
              <span>
                <strong>{c.label}</strong>：<InlineText text={c.text} />
              </span>
            </label>
          ))}
        </>
      )}
      {task.sample && (
        <>
          <button
            className="btn sample-toggle"
            onClick={() => setShowSample(!showSample)}>
            {showSample ? <EyeOff size={15} /> : <Eye size={15} />}
            {showSample ? '收起参考范文' : '写完再看参考范文'}
          </button>
          {showSample && (
            <p className="note-sample">
              <InlineText text={task.sample} />
            </p>
          )}
        </>
      )}
    </div>
  )
}

/** 词汇总览：精讲词 + 词群（数据已在 lesson.json，此前只在拼写里当提示）；点词 / 例句可朗读 */
function VocabOverview({ lesson }: { lesson: Lesson }) {
  const { supported, speak, stop } = useSpeech()
  const { core, wordGroups } = lesson.vocab
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const [speechError, setSpeechError] = useState(false)

  // 单格朗读：点同一格再次 → 停止；点新格 → 顶掉旧朗读（speak 内部 cancel）
  const speakCell = (key: string, text: string) => {
    if (!supported) return
    setSpeechError(false)
    if (playingKey === key) {
      stop()
      setPlayingKey(null)
      return
    }
    setPlayingKey(key)
    speak(text, {
      onend: () => setPlayingKey(null),
      onerror: () => {
        setPlayingKey(null)
        setSpeechError(true)
      }
    })
  }

  const cellCls = (key: string, extra = '') =>
    `${extra}${supported ? ' speakable' : ''}${
      playingKey === key ? ' speaking' : ''
    }`.trim()

  return (
    <section className="card">
      <h2>词汇总览</h2>
      {supported && (
        <p className="hint">
          点击词、例句、拓展例句、搭配等格可朗读，再点一次停止。
        </p>
      )}
      {speechError && (
        <p className="hint">
          朗读失败：当前设备可能缺少英语语音引擎，可在系统「文字转语音（TTS）」设置中启用引擎后重试，或改用桌面端浏览器。
        </p>
      )}
      {core.length > 0 && (
        <>
          <h3>课内精讲词</h3>
          <div className="table-wrap">
            <table className="note-table">
              <thead>
                <tr>
                  <th>词</th>
                  <th>音标</th>
                  <th>释义</th>
                  <th>例句（课文 / 拓展）</th>
                  <th>拓展搭配</th>
                </tr>
              </thead>
              <tbody>
                {core.map((v) => {
                  const wk = `core-w-${v.word}`
                  const ek = `core-e-${v.word}`
                  const xk = `core-x-${v.word}`
                  const ck = `core-c-${v.word}`
                  const colText = extractEnglish(v.collocations)
                  return (
                    <tr key={v.word}>
                      <td
                        data-label="词"
                        className={cellCls(wk, 'w')}
                        onClick={() => speakCell(wk, v.word)}>
                        {v.word}
                      </td>
                      <td data-label="音标">{v.phonetic}</td>
                      <td data-label="释义">{v.meaning}</td>
                      <td
                        data-label="例句（课文 / 拓展）"
                        className={cellCls(ek)}
                        onClick={() => speakCell(ek, v.example)}>
                        <InlineText text={v.example} />
                        <span className="extra-example">
                          <span
                            className={cellCls(xk)}
                            onClick={(e) => {
                              e.stopPropagation()
                              speakCell(xk, v.extraExample)
                            }}>
                            <InlineText text={v.extraExample} />
                          </span>
                          <span className="zh-line">{v.extraExampleZh}</span>
                        </span>
                      </td>
                      <td
                        data-label="拓展搭配"
                        className={colText ? cellCls(ck) : ''}
                        onClick={
                          colText ? () => speakCell(ck, colText) : undefined
                        }>
                        <InlineText text={v.collocations} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {wordGroups.length > 0 && (
        <>
          <h3>高频拓展词群</h3>
          <div className="table-wrap">
            <table className="note-table">
              <thead>
                <tr>
                  <th>词</th>
                  <th>课文句</th>
                  <th>高频搭配</th>
                </tr>
              </thead>
              <tbody>
                {wordGroups.map((w) => {
                  const wk = `wg-w-${w.word}`
                  const ek = `wg-e-${w.word}`
                  const ck = `wg-c-${w.word}`
                  const colText = extractEnglish(w.collocations)
                  return (
                    <tr key={w.word}>
                      <td
                        data-label="词"
                        className={cellCls(wk, 'w')}
                        onClick={() => speakCell(wk, w.word)}>
                        {w.word}
                      </td>
                      <td
                        data-label="课文句"
                        className={cellCls(ek)}
                        onClick={() => speakCell(ek, w.sentence)}>
                        <InlineText text={w.sentence} />
                      </td>
                      <td
                        data-label="高频搭配"
                        className={colText ? cellCls(ck) : ''}
                        onClick={
                          colText ? () => speakCell(ck, colText) : undefined
                        }>
                        <InlineText text={w.collocations} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

/** F7 讲解页：词汇总览 + 语法讲解块 + 输出任务（草稿与自评持久化） */
export function GrammarNotes({ lesson }: { lesson: Lesson }) {
  const { core, wordGroups } = lesson.vocab
  const notes = lesson.notes ?? []
  const output = lesson.output ?? []
  const hasVocab = core.length > 0 || wordGroups.length > 0

  if (!hasVocab && notes.length === 0 && output.length === 0) {
    return (
      <section className="card">
        <p className="hint">本讲暂无讲解内容，可直接进入拼写与练习。</p>
      </section>
    )
  }

  return (
    <>
      {hasVocab && <VocabOverview lesson={lesson} />}
      {notes.length > 0 && (
        <section className="card">
          <h2>语法讲解</h2>
          {notes.map((s, i) => (
            <div key={i} className="note-section">
              <h3>{s.heading}</h3>
              <NoteBlocks blocks={s.blocks} />
            </div>
          ))}
        </section>
      )}
      {output.length > 0 && (
        <section className="card">
          <h2>输出任务</h2>
          {output.map((t, i) => (
            <OutputTaskCard key={i} lessonId={lesson.id} task={t} index={i} />
          ))}
        </section>
      )}
    </>
  )
}
