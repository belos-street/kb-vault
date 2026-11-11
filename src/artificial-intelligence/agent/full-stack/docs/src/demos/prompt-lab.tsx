import { useMemo, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

interface Combination {
  fewShot: boolean
  cot: boolean
  jsonMode: boolean
}

const cases = [
  {
    id: 'ticket',
    label: '工单分类',
    user: '订单 ORD-1024 退款三天了还没到账，帮我催一下',
    output: {
      intent: 'refund_status',
      orderId: 'ORD-1024',
      urgency: 'high',
      reply: '已记录催办，预计 1 个工作日内更新。'
    }
  },
  {
    id: 'invoice',
    label: '发票咨询',
    user: '抬头写错了能重开吗？',
    output: {
      intent: 'invoice',
      orderId: null,
      urgency: 'normal',
      reply: '可以重开，需要提供合同主体与正确抬头。'
    }
  }
] as const

function score(current: Combination): {
  parse: number
  stability: number
  cost: number
  label: string
} {
  let parse = 62
  let stability = 45
  let cost = 1
  if (current.fewShot) {
    parse += 18
    stability += 20
    cost += 0.35
  }
  if (current.cot) {
    parse += 6
    stability += 12
    cost += 0.5
  }
  if (current.jsonMode) {
    parse += 14
    stability += 15
    cost += 0.1
  }
  const label =
    parse >= 95
      ? '可直接进生产'
      : parse >= 85
        ? '需要一次重试兜底'
        : '下游解析会频繁失败'
  return {
    parse: Math.min(99, parse),
    stability: Math.min(98, stability),
    cost,
    label
  }
}

export function PromptLabDemo() {
  const [caseId, setCaseId] = useState<(typeof cases)[number]['id']>('ticket')
  const [combo, setCombo] = useState<Combination>({
    fewShot: true,
    cot: false,
    jsonMode: true
  })

  const current = cases.find((item) => item.id === caseId) ?? cases[0]
  const result = useMemo(() => score(combo), [combo])

  const prompt = `你是客服工单分类器。
只输出 JSON，不要解释。
字段：intent（refund_status | invoice | account | other）、
orderId（形如 ORD-1234，没有就 null）、
urgency（low | normal | high）、reply（不超过 40 字）。

${combo.fewShot ? '示例：\n用户：退款一直没到\n输出：{"intent":"refund_status","orderId":null,"urgency":"normal","reply":"已为您查询退款进度。"}\n' : ''}
${combo.cot ? '先判断用户意图，再抽取订单号，最后判断紧急程度。\n' : ''}
用户：${current.user}`

  return (
    <DemoFrame
      title="Prompt 契约实验台"
      hint="切换 few-shot / CoT / JSON 约束，观察可解析率、稳定性与成本的变化。">
      <div className="prompt-controls">
        <div className="prompt-cases">
          {cases.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`preset-btn${caseId === item.id ? ' active' : ''}`}
              onClick={() => setCaseId(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <label className="prompt-switch">
          <input
            type="checkbox"
            checked={combo.fewShot}
            onChange={(event) =>
              setCombo({ ...combo, fewShot: event.target.checked })
            }
          />
          <span>few-shot 示例</span>
        </label>
        <label className="prompt-switch">
          <input
            type="checkbox"
            checked={combo.cot}
            onChange={(event) =>
              setCombo({ ...combo, cot: event.target.checked })
            }
          />
          <span>CoT 中间步骤</span>
        </label>
        <label className="prompt-switch">
          <input
            type="checkbox"
            checked={combo.jsonMode}
            onChange={(event) =>
              setCombo({ ...combo, jsonMode: event.target.checked })
            }
          />
          <span>强制 JSON 输出</span>
        </label>
      </div>

      <div className="prompt-grid">
        <div className="prompt-panel">
          <div className="prompt-panel-head">
            <span>渲染后的 Prompt</span>
            <span>{prompt.length} 字符</span>
          </div>
          <pre>{prompt}</pre>
        </div>
        <div className="prompt-panel">
          <div className="prompt-panel-head">
            <span>模拟结果</span>
            <span
              className={`prompt-verdict${result.parse >= 95 ? ' ok' : ''}`}>
              {result.label}
            </span>
          </div>
          <div className="prompt-metrics">
            <div>
              <span>首次可解析率</span>
              <strong>{result.parse}%</strong>
            </div>
            <div>
              <span>输出稳定性</span>
              <strong>{result.stability}%</strong>
            </div>
            <div>
              <span>相对成本</span>
              <strong>{result.cost.toFixed(2)}x</strong>
            </div>
          </div>
          <pre className="prompt-output">
            {combo.jsonMode
              ? JSON.stringify(current.output, null, 2)
              : `好的，我判断这条工单是${current.output.intent}，` +
                `紧急程度${current.output.urgency}。${current.output.reply}`}
          </pre>
        </div>
      </div>

      <p className="demo-note">
        CoT 开关只把「先判断意图、再抽取订单号」写进
        Prompt，不要求模型输出推理过程，
        对应正文里的「内部推理、只返回结构化结果」。这些百分比是固定演示值，不是真实评测。
        要得到真实数字，必须在自己的评估集上跑 20~50 条，并记录「首次可解析 /
        重试后可解析 / 仍失败」三档。
      </p>
    </DemoFrame>
  )
}
