import { useMemo, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

const sampleText = `退款政策：签收后 7 天内可申请无理由退款，定制商品与已激活的软件除外。退款审核通过后，原路退回，通常 3-5 个工作日到账。
发票与对公转账：发票抬头必须与合同主体一致；对公转账需要提供开户行、账号与纳税人识别号，财务确认后 1-3 个工作日到账。
账号与登录：支持邮箱与手机号登录；连续 5 次密码错误会锁定 15 分钟；管理员可以强制下线成员设备。
团队与权限：管理员可以邀请成员，并分配只读、编辑、管理三种角色；只读成员不能导出数据。
数据导出与备份：支持 CSV 与 JSON 导出；每天 02:00 自动备份，保留 30 天；超过 30 天的备份需要提交工单恢复。`

interface Chunk {
  id: string
  start: number
  end: number
  text: string
}

export function ChunkLabDemo() {
  const [text, setText] = useState(sampleText)
  const [chunkSize, setChunkSize] = useState(120)
  const [overlap, setOverlap] = useState(30)

  const safeOverlap = Math.min(overlap, Math.max(0, chunkSize - 1))

  const chunks = useMemo(() => {
    const result: Chunk[] = []
    if (chunkSize <= 0) return result
    let start = 0
    while (start < text.length) {
      const end = Math.min(text.length, start + chunkSize)
      result.push({
        id: `c${result.length + 1}`,
        start,
        end,
        text: text.slice(start, end)
      })
      if (end === text.length) break
      start = Math.max(end - safeOverlap, start + 1)
    }
    return result
  }, [text, chunkSize, safeOverlap])

  const avgLength =
    chunks.length > 0
      ? Math.round(
          chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) /
            chunks.length
        )
      : 0

  return (
    <DemoFrame
      title="切分实验台"
      hint="调 chunk 大小与 overlap，观察块数、平均长度和重复内容怎么变。">
      <div className="chunk-controls">
        <label className="chunk-text">
          <span>文档内容</span>
          <textarea
            value={text}
            rows={4}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <label>
          <span>chunk 大小：{chunkSize} 字符</span>
          <input
            type="range"
            min={40}
            max={240}
            step={10}
            value={chunkSize}
            onChange={(event) => setChunkSize(Number(event.target.value))}
          />
        </label>
        <label>
          <span>overlap：{safeOverlap} 字符</span>
          <input
            type="range"
            min={0}
            max={80}
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
          <span>重叠总量</span>
          <strong>{chunks.length > 1 ? safeOverlap : 0} 字符 / 块</strong>
        </div>
      </div>

      {safeOverlap !== overlap ? (
        <p className="demo-warn">
          overlap 不能大于等于 chunk 大小，已自动夹到 {safeOverlap}。
        </p>
      ) : null}

      <div className="chunk-list">
        {chunks.map((chunk, index) => {
          const overlapLength =
            index === 0 ? 0 : Math.min(safeOverlap, chunk.text.length)
          return (
            <article key={chunk.id} className="chunk-card">
              <header>
                <strong>{chunk.id}</strong>
                <span>
                  [{chunk.start}, {chunk.end})
                </span>
              </header>
              <pre>
                <mark>{chunk.text.slice(0, overlapLength)}</mark>
                {chunk.text.slice(overlapLength)}
              </pre>
            </article>
          )
        })}
      </div>

      <p className="demo-note">
        <mark>高亮</mark> 部分是上一块与本块的重叠。overlap
        太小会切断语义，太大会让索引膨胀、召回重复。真实项目按 token
        切，这里用字符数是为了肉眼可观察。
      </p>
    </DemoFrame>
  )
}
