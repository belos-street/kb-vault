import { useMemo, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

const sampleText = `# 退款政策

签收后 7 天内可申请无理由退款。审核通过后款项原路退回，通常 3-5 个工作日。

## 发票与对公转账

发票抬头必须与合同主体一致，财务确认后 1-3 个工作日到账。

### 开票资料

对公转账需要提供开户行、账号与纳税人识别号；资料缺失会被退回重提。

## 账号与登录

支持邮箱与手机号登录；连续 5 次密码错误会锁定 15 分钟，管理员可以强制下线成员设备。

## 数据导出与备份

支持 CSV 与 JSON 导出。每天 02:00 自动备份，保留 30 天。超过 30 天的备份需要提交工单恢复。恢复时先校验快照完整性，再按租户逐个恢复；大批量恢复建议拆成多个任务，避免单次超时把连接占满。`

interface SplitChunk {
  id: string
  heading: string
  text: string
  hard: boolean
  overlap: number
}

const HEADING = /^(#{1,6})\s+(.+)$/

function splitLong(text: string, maxChars: number, overlap: number): string[] {
  const parts: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(text.length, start + maxChars)
    if (end < text.length) {
      const slice = text.slice(start, end)
      const cut = Math.max(
        slice.lastIndexOf('。'),
        slice.lastIndexOf('；'),
        slice.lastIndexOf('\n')
      )
      if (cut > maxChars / 2) end = start + cut + 1
    }
    parts.push(text.slice(start, end))
    if (end >= text.length) break
    start = Math.max(end - overlap, start + 1)
  }
  return parts
}

function splitDoc(
  source: string,
  maxChars: number,
  overlap: number
): SplitChunk[] {
  const chunks: SplitChunk[] = []
  const headingPath: string[] = []
  let heading = '正文'

  const emit = (text: string, hard: boolean, overlapChars: number) => {
    const clean = text.trim()
    if (clean.length === 0) return
    chunks.push({
      id: 'c' + (chunks.length + 1),
      heading,
      text: clean,
      hard,
      overlap: Math.min(overlapChars, clean.length)
    })
  }

  for (const section of source.split(/\n(?=#{1,6}\s)/)) {
    const lines = section.split('\n')
    const match = HEADING.exec(lines[0]?.trim() ?? '')
    if (match) {
      const level = match[1]?.length ?? 1
      headingPath.length = level - 1
      headingPath[level - 1] = match[2]?.trim() ?? ''
      heading = headingPath.filter(Boolean).join(' / ')
      lines.shift()
    }

    let buffer: string[] = []
    const flush = () => {
      emit(buffer.join('\n'), false, 0)
      buffer = []
    }

    for (const line of lines) {
      const paragraph = line.trim()
      if (paragraph === '') {
        if (buffer.length > 0 && buffer[buffer.length - 1] !== '') {
          buffer.push('')
        }
        continue
      }
      const candidate = [...buffer, line].join('\n')
      if (candidate.length <= maxChars) {
        buffer.push(line)
        continue
      }
      flush()
      if (paragraph.length <= maxChars) {
        buffer.push(line)
      } else {
        const pieces = splitLong(paragraph, maxChars, overlap)
        pieces.forEach((piece, index) => {
          emit(piece, true, index === 0 ? 0 : overlap)
        })
      }
    }
    flush()
  }
  return chunks
}

export function StructureSplitDemo() {
  const [maxChars, setMaxChars] = useState(120)
  const [overlap, setOverlap] = useState(20)

  const safeOverlap = Math.min(overlap, Math.max(0, maxChars - 1))

  const chunks = useMemo(
    () => splitDoc(sampleText, maxChars, safeOverlap),
    [maxChars, safeOverlap]
  )

  const avgLength =
    chunks.length > 0
      ? Math.round(
          chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) /
            chunks.length
        )
      : 0
  const hardCount = chunks.filter((chunk) => chunk.hard).length

  return (
    <DemoFrame
      title="结构切分实验台"
      hint="按标题分节、短段合并，只有超长段落才硬切；调参数看块怎么变。">
      <div className="chunk-controls">
        <label>
          <span>chunk 上限：{maxChars} 字符</span>
          <input
            type="range"
            min={60}
            max={240}
            step={10}
            value={maxChars}
            onChange={(event) => setMaxChars(Number(event.target.value))}
          />
        </label>
        <label>
          <span>硬切 overlap：{safeOverlap} 字符</span>
          <input
            type="range"
            min={0}
            max={40}
            step={5}
            value={overlap}
            onChange={(event) => setOverlap(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="chunk-stats">
        <div>
          <span>块数</span>
          <strong>{chunks.length}</strong>
        </div>
        <div>
          <span>平均长度</span>
          <strong>{avgLength} 字符</strong>
        </div>
        <div>
          <span>硬切块</span>
          <strong>{hardCount}</strong>
        </div>
      </div>

      {safeOverlap !== overlap ? (
        <p className="demo-warn">
          overlap 不能大于等于 chunk 上限，已自动夹到 {safeOverlap}。
        </p>
      ) : null}

      <div className="chunk-list">
        {chunks.map((chunk) => (
          <article key={chunk.id} className="chunk-card">
            <header>
              <strong>{chunk.id}</strong>
              <span>
                {chunk.heading} · {chunk.hard ? '硬切' : '结构'}
              </span>
            </header>
            <pre>
              <mark>{chunk.text.slice(0, chunk.overlap)}</mark>
              {chunk.text.slice(chunk.overlap)}
            </pre>
          </article>
        ))}
      </div>

      <p className="demo-note">
        <mark>高亮</mark> 是硬切留下的重叠；结构切分的块之间没有重复。 把 chunk
        上限调到 60，看「数据导出与备份」被硬切成几块；调回 240，
        看它是否整节一块。标题决定分节，长度只负责兜底。
      </p>
    </DemoFrame>
  )
}
