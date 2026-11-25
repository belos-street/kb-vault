import { useMemo, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

const chunkTitles: Record<string, string> = {
  c1: '退款政策',
  c2: '发票与对公转账',
  c3: '账号与登录',
  c4: '团队与权限',
  c5: '数据导出与备份'
}

interface EvalCase {
  id: string
  query: string
  gold: string | null
  scores: Record<string, number>
}

// 分数为固定示例，模拟一次真实检索的结果；换评估集时替换 scores。
const cases: EvalCase[] = [
  {
    id: 'q1',
    query: '退款多久到账？',
    gold: 'c1',
    scores: { c1: 0.86, c2: 0.58, c5: 0.41, c3: 0.3, c4: 0.22 }
  },
  {
    id: 'q2',
    query: '发票抬头有什么要求？',
    gold: 'c2',
    scores: { c2: 0.84, c1: 0.52, c5: 0.4, c3: 0.25, c4: 0.2 }
  },
  {
    id: 'q3',
    query: '密码错几次会锁定？',
    gold: 'c3',
    scores: { c3: 0.79, c1: 0.35, c2: 0.31, c4: 0.28, c5: 0.19 }
  },
  {
    id: 'q4',
    query: '成员有哪几种角色？',
    gold: 'c4',
    scores: { c5: 0.77, c4: 0.74, c3: 0.44, c1: 0.27, c2: 0.21 }
  },
  {
    id: 'q5',
    query: '备份保留多久？',
    gold: 'c5',
    scores: { c5: 0.82, c1: 0.46, c3: 0.33, c2: 0.3, c4: 0.25 }
  },
  {
    id: 'q6',
    query: '支持微信支付吗？',
    gold: null,
    scores: { c2: 0.44, c1: 0.41, c5: 0.28, c3: 0.24, c4: 0.18 }
  },
  {
    id: 'q7',
    query: '会员积分怎么兑换？',
    gold: null,
    scores: { c3: 0.39, c4: 0.36, c1: 0.3, c5: 0.22, c2: 0.2 }
  },
  {
    id: 'q8',
    query: '可以开纸质发票吗？',
    gold: null,
    scores: { c2: 0.47, c1: 0.33, c5: 0.26, c3: 0.2, c4: 0.17 }
  }
]

function percent(part: number, total: number): string {
  return total === 0 ? '0%' : Math.round((part / total) * 100) + '%'
}

export function RagEvalDemo() {
  const [k, setK] = useState(2)
  const [threshold, setThreshold] = useState(0.6)

  const rows = useMemo(
    () =>
      cases.map((item) => {
        const ranked = Object.entries(item.scores).sort(
          (left, right) => right[1] - left[1]
        )
        const top1Id = ranked[0]?.[0] ?? ''
        const top1Score = ranked[0]?.[1] ?? 0
        const topK = ranked.slice(0, k).map(([id]) => id)
        const answered = top1Score >= threshold
        const inTopK = item.gold !== null && topK.includes(item.gold)

        let tag = '正确拒答'
        let tone = 'ok'
        if (item.gold === null) {
          tag = answered ? '误答' : '正确拒答'
          tone = answered ? 'bad' : 'ok'
        } else if (!answered) {
          tag = '误拒'
          tone = 'bad'
        } else if (top1Id === item.gold) {
          tag = '引用正确'
          tone = 'ok'
        } else if (inTopK) {
          tag = '引用错'
          tone = 'bad'
        } else {
          tag = '未命中'
          tone = 'bad'
        }

        return {
          ...item,
          top1Id,
          top1Score,
          topK,
          answered,
          inTopK,
          tag,
          tone
        }
      }),
    [k, threshold]
  )

  const answerable = rows.filter((row) => row.gold !== null)
  const unanswerable = rows.filter((row) => row.gold === null)
  const recalled = answerable.filter((row) => row.inTopK)
  const cited = answerable.filter(
    (row) => row.answered && row.top1Id === row.gold
  )
  const rejected = unanswerable.filter((row) => !row.answered)

  return (
    <DemoFrame
      title="RAG 评估台"
      hint="调 k 与阈值，看 recall@k、引用命中与拒答正确率怎么互相拉扯。">
      <div className="demo-sliders eval-controls">
        <label>
          <span>top-k：{k}</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={k}
            onChange={(event) => setK(Number(event.target.value))}
          />
        </label>
        <label>
          <span>拒答阈值：{threshold.toFixed(2)}</span>
          <input
            type="range"
            min={0.3}
            max={0.9}
            step={0.01}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="demo-metrics">
        <div>
          <span>
            recall@{k}（{answerable.length} 题可答）
          </span>
          <strong>{percent(recalled.length, answerable.length)}</strong>
        </div>
        <div>
          <span>引用命中（{answerable.length} 题可答）</span>
          <strong>{percent(cited.length, answerable.length)}</strong>
        </div>
        <div>
          <span>拒答正确（{unanswerable.length} 题不可答）</span>
          <strong>{percent(rejected.length, unanswerable.length)}</strong>
        </div>
      </div>

      <div className="eval-list">
        <div className="eval-head">
          <span>评估题</span>
          <span>top-1 / gold / 判定</span>
        </div>
        {rows.map((row) => (
          <div key={row.id} className="eval-row">
            <div className="eval-q">
              <strong>{row.id}</strong>
              <span>{row.query}</span>
            </div>
            <div className="eval-meta">
              <code>{row.top1Score.toFixed(2)}</code>
              <span>
                {row.top1Id}
                {row.top1Id ? ' ' + (chunkTitles[row.top1Id] ?? '') : ''}
              </span>
              <span>gold {row.gold ?? '—'}</span>
            </div>
            <span className={`eval-tag ${row.tone}`}>{row.tag}</span>
          </div>
        ))}
      </div>

      <p className="demo-note">
        默认 k=2、阈值 0.60 时，q4 的 top-1 被「导出与备份」抢走（0.77 vs
        0.74），所以 recall@k 满分但引用命中只有 80%。把 k 调到 1 看召回下降，
        把阈值推到 0.80 看误拒：recall 不看阈值，引用命中会掉。
      </p>
    </DemoFrame>
  )
}
