import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

const options = [
  { id: 'cost', label: '成本优先', hint: '高频、短任务、可接受小模型' },
  { id: 'long', label: '长上下文', hint: '合同、论文、整库文档一次读完' },
  { id: 'code', label: '代码与 Agent', hint: '工具调用、代码生成、多步执行' },
  { id: 'multimodal', label: '多模态', hint: '图片、表格、语音、视频输入' },
  { id: 'private', label: '私有化', hint: '数据不能出内网，可接受开源权重' }
] as const

type OptionId = (typeof options)[number]['id']

const recommendations: Record<
  OptionId,
  { title: string; why: string; anti: string }
> = {
  cost: {
    title: '高性价比模型 + 小模型路由',
    why: '把简单意图分给小模型，复杂任务才升级；先做 token 预算，再谈模型能力。',
    anti: '不要用旗舰模型跑分类、改写、摘要这类高频轻任务。'
  },
  long: {
    title: '长上下文模型 + 检索兜底',
    why: '长上下文适合一次性通读，但成本和延迟随长度上升；超过稳定区间就切 RAG。',
    anti: '不要把「能塞进去」当成「能稳定答对」。'
  },
  code: {
    title: '代码能力强的模型 + 工具调用',
    why: 'Agent 场景看的是工具调用准确率、参数遵循和错误恢复，不只是代码补全分数。',
    anti: '不要只看榜单分数，要用自己的工具集做 20 条回归。'
  },
  multimodal: {
    title: '原生多模态模型',
    why: '图片、表格、截图理解优先选原生多模态；OCR 后接文本模型是另一种更可控的链路。',
    anti: '不要把所有图片都先 OCR，版式信息会丢。'
  },
  private: {
    title: '开源自托管 + 量化 / 蒸馏',
    why: '数据不出内网时，优先评估开源权重模型的工具调用与长上下文能力，再谈量化损耗。',
    anti: '不要默认「开源 = 便宜」；GPU 运维和调优也是成本。'
  }
}

export function ModelPickerDemo() {
  const [selected, setSelected] = useState<OptionId>('code')
  const current = recommendations[selected]

  return (
    <DemoFrame
      title="模型选型决策器"
      hint="先选约束，不选品牌；品牌会过时，约束不会。">
      <div className="picker-options">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`picker-option${selected === option.id ? ' active' : ''}`}
            onClick={() => setSelected(option.id)}>
            <strong>{option.label}</strong>
            <span>{option.hint}</span>
          </button>
        ))}
      </div>

      <div className="picker-result">
        <span className="picker-tag">推荐方向</span>
        <h4>{current.title}</h4>
        <p>{current.why}</p>
        <div className="picker-anti">
          <span>反模式</span>
          <p>{current.anti}</p>
        </div>
      </div>

      <p className="demo-note">
        这里不写具体型号，是为了避免大纲被版本淘汰。写作时再按官方价目与 Release
        Notes 补一张「当期选型快照」。
      </p>
    </DemoFrame>
  )
}
