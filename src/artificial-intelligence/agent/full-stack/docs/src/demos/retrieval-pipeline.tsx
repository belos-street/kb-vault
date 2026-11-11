import { useMemo, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

interface Doc {
  id: string
  title: string
  text: string
  x: number
  y: number
}

const docs: Doc[] = [
  {
    id: 'c1',
    title: '退款政策',
    text: '签收后 7 天内可申请无理由退款；退款 3-5 个工作日到账。',
    x: 0.92,
    y: 0.12
  },
  {
    id: 'c2',
    title: '发票与对公转账',
    text: '发票抬头需与合同主体一致；对公转账 1-3 个工作日到账。',
    x: 0.18,
    y: 0.94
  },
  {
    id: 'c3',
    title: '账号与登录',
    text: '支持邮箱与手机号登录；连续 5 次失败锁定 15 分钟。',
    x: -0.86,
    y: 0.38
  },
  {
    id: 'c4',
    title: '团队与权限',
    text: '管理员可邀请成员并分配只读 / 编辑 / 管理角色。',
    x: -0.32,
    y: -0.9
  },
  {
    id: 'c5',
    title: '数据导出与备份',
    text: '支持 CSV / JSON 导出；每天 02:00 自动备份，保留 30 天。',
    x: 0.58,
    y: -0.72
  }
]

const presets = [
  { label: '退款多久到账', x: 0.95, y: 0.15 },
  { label: '发票怎么开', x: 0.2, y: 0.95 },
  { label: '成员权限怎么配', x: -0.3, y: -0.92 },
  { label: '导出备份在哪', x: 0.6, y: -0.7 }
] as const

function cosine(ax: number, ay: number, bx: number, by: number): number {
  const aNorm = Math.hypot(ax, ay)
  const bNorm = Math.hypot(bx, by)
  if (aNorm === 0 || bNorm === 0) return 0
  return (ax * bx + ay * by) / (aNorm * bNorm)
}

const center = 180
const scale = 130

function px(x: number): number {
  return center + x * scale
}

function py(y: number): number {
  return center - y * scale
}

export function RetrievalPipelineDemo() {
  const [queryX, setQueryX] = useState(0.95)
  const [queryY, setQueryY] = useState(0.15)
  const [topK, setTopK] = useState(3)
  const [threshold, setThreshold] = useState(0.75)

  const ranked = useMemo(
    () =>
      docs
        .map((doc) => ({
          ...doc,
          score: cosine(queryX, queryY, doc.x, doc.y)
        }))
        .sort((left, right) => right.score - left.score),
    [queryX, queryY]
  )

  const top = ranked.slice(0, topK)
  const best = ranked[0]
  const answer =
    best && best.score >= threshold
      ? `根据 ${best.id}《${best.title}》：${best.text}`
      : '拒答：最高分低于阈值，没有足够依据。'

  return (
    <DemoFrame
      title="检索闭环实验台"
      hint="拖动 query 向量，观察 cosine 排序、top-k、阈值与引用如何一起工作。">
      <div className="retrieval-grid">
        <div className="retrieval-plot">
          <svg viewBox="0 0 360 360" role="img" aria-label="二维向量空间">
            <rect x="0" y="0" width="360" height="360" className="plot-bg" />
            {[-1, -0.5, 0, 0.5, 1].map((value) => (
              <g key={value}>
                <line
                  x1={px(value)}
                  y1={py(-1.15)}
                  x2={px(value)}
                  y2={py(1.15)}
                  className="plot-grid"
                />
                <line
                  x1={px(-1.15)}
                  y1={py(value)}
                  x2={px(1.15)}
                  y2={py(value)}
                  className="plot-grid"
                />
              </g>
            ))}
            <circle cx={center} cy={center} r={scale} className="plot-circle" />
            <line
              x1={px(-1.2)}
              y1={center}
              x2={px(1.2)}
              y2={center}
              className="plot-axis"
            />
            <line
              x1={center}
              y1={py(-1.2)}
              x2={center}
              y2={py(1.2)}
              className="plot-axis"
            />

            {top.map((doc) => (
              <line
                key={`line-${doc.id}`}
                x1={px(queryX)}
                y1={py(queryY)}
                x2={px(doc.x)}
                y2={py(doc.y)}
                className="plot-link"
              />
            ))}

            {docs.map((doc) => {
              const inTop = top.some((item) => item.id === doc.id)
              return (
                <g key={doc.id}>
                  <circle
                    cx={px(doc.x)}
                    cy={py(doc.y)}
                    r={inTop ? 7 : 5}
                    className={inTop ? 'plot-doc top' : 'plot-doc'}
                  />
                  <text
                    x={px(doc.x) + 10}
                    y={py(doc.y) - 8}
                    className="plot-label">
                    {doc.id}
                  </text>
                </g>
              )
            })}

            <circle
              cx={px(queryX)}
              cy={py(queryY)}
              r={9}
              className="plot-query"
            />
            <text
              x={px(queryX) + 12}
              y={py(queryY) + 18}
              className="plot-query-label">
              query
            </text>
          </svg>
          <div className="plot-legend">
            <span>
              <i className="legend-query" /> query
            </span>
            <span>
              <i className="legend-doc" /> chunk
            </span>
            <span>
              <i className="legend-top" /> top-k
            </span>
          </div>
        </div>

        <div className="retrieval-controls">
          <div className="preset-row">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset-btn"
                onClick={() => {
                  setQueryX(preset.x)
                  setQueryY(preset.y)
                }}>
                {preset.label}
              </button>
            ))}
          </div>

          <label>
            <span>query.x：{queryX.toFixed(2)}</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={queryX}
              onChange={(event) => setQueryX(Number(event.target.value))}
            />
          </label>
          <label>
            <span>query.y：{queryY.toFixed(2)}</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={queryY}
              onChange={(event) => setQueryY(Number(event.target.value))}
            />
          </label>
          <label>
            <span>top-k：{topK}</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={topK}
              onChange={(event) => setTopK(Number(event.target.value))}
            />
          </label>
          <label>
            <span>拒答阈值：{threshold.toFixed(2)}</span>
            <input
              type="range"
              min={0.5}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="retrieval-results">
        <div className="ranked-list">
          <div className="ranked-head">
            <span>排序结果</span>
            <span>cosine</span>
          </div>
          {ranked.map((doc, index) => {
            const inTop = index < topK
            return (
              <div
                key={doc.id}
                className={`ranked-row${inTop ? ' in-top' : ''}`}>
                <span className="ranked-index">{index + 1}</span>
                <span className="ranked-title">
                  <strong>{doc.id}</strong>
                  {doc.title}
                </span>
                <span className="ranked-bar">
                  <i style={{ width: `${Math.max(0, doc.score) * 100}%` }} />
                </span>
                <span className="ranked-score">{doc.score.toFixed(3)}</span>
              </div>
            )
          })}
        </div>

        <div
          className={`answer-card${best && best.score >= threshold ? ' ok' : ' reject'}`}>
          <div className="answer-head">
            <span>
              {best && best.score >= threshold ? '带引用回答' : '拒答'}
            </span>
            <strong>
              {best ? `top-1 = ${best.score.toFixed(3)}` : 'no candidate'}
            </strong>
          </div>
          <p>{answer}</p>
          {best && best.score >= threshold ? (
            <div className="answer-cite">
              <span>引用</span>
              <code>
                [{best.id}] {best.title}
              </code>
            </div>
          ) : null}
        </div>
      </div>

      <p className="demo-note">
        这是二维投影，真实 Embedding 是几百到几千维。但排序逻辑一样： 归一化 →
        点积 / cosine → top-k → 阈值 → 引用。 把阈值调到 0.95，再看拒绝路径。
      </p>
    </DemoFrame>
  )
}
