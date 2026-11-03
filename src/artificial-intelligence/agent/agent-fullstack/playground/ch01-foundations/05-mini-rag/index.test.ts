import { describe, expect, it } from 'bun:test'
import { createScriptedModel, final } from '@/shared/scripted-model'
import {
  answerWithCitations,
  chunkDocuments,
  evaluate,
  retrieve,
  type Doc
} from './src/index'

const docs: Doc[] = [
  {
    id: 'leave',
    text: '员工每年享有 10 天年假，需要提前三天在系统里提交申请。'
  },
  {
    id: 'expense',
    text: '差旅报销须在出差结束后 7 天内提交发票，逾期需要主管审批。'
  },
  {
    id: 'remote',
    text: '远程办公每周最多两天，需要提前一天获得主管批准。'
  }
]

describe('chunkDocuments', () => {
  it('按字符窗口切块并生成稳定 id', () => {
    const chunks = chunkDocuments(
      [{ id: 'a', text: '0123456789abcdefghij' }],
      10,
      2
    )

    expect(chunks).toHaveLength(3)
    expect(chunks.map((chunk) => chunk.id)).toEqual(['a#0', 'a#1', 'a#2'])
    expect(chunks[0]?.text).toBe('0123456789')
    expect(chunks[1]?.text).toBe('89abcdefgh')
    expect(chunks[2]?.text).toBe('ghij')
  })

  it('非法参数抛 RangeError', () => {
    expect(() => chunkDocuments([{ id: 'a', text: 'x' }], 0, 0)).toThrow(
      RangeError
    )
    expect(() => chunkDocuments([{ id: 'a', text: 'x' }], 10, -1)).toThrow(
      RangeError
    )
    expect(() => chunkDocuments([{ id: 'a', text: 'x' }], 10, 10)).toThrow(
      RangeError
    )
  })
})

describe('retrieve', () => {
  it('第一条命中对应制度', () => {
    const chunks = chunkDocuments(docs)

    expect(retrieve('年假怎么申请', chunks)[0]?.chunk.docId).toBe('leave')
    expect(retrieve('报销发票什么时候交', chunks)[0]?.chunk.docId).toBe(
      'expense'
    )
    expect(retrieve('远程办公每周几天', chunks)[0]?.chunk.docId).toBe('remote')
  })

  it('没有相关块时返回空数组', () => {
    const chunks = chunkDocuments(docs)
    expect(retrieve('量子纠缠实验', chunks)).toEqual([])
  })

  it('topK 小于 1 抛 RangeError', () => {
    const chunks = chunkDocuments(docs)
    expect(() => retrieve('年假', chunks, 0)).toThrow(RangeError)
  })
})

describe('answerWithCitations', () => {
  it('把答案里的 [1] 映射回 chunk id', async () => {
    const model = createScriptedModel([
      final('年假为 10 天，需要提前三天申请 [1]。')
    ])

    const result = await answerWithCitations('年假怎么申请', docs, model)

    expect(result.answer).toContain('10 天')
    expect(result.citations).toEqual(['leave#0'])
    expect(result.chunks[0]?.docId).toBe('leave')
    expect(model.calls).toHaveLength(1)

    const userMessage = model.calls[0]?.find(
      (message) => message.role === 'user'
    )
    expect(userMessage?.content).toContain('[1]')
    expect(userMessage?.content).toContain('年假怎么申请')
  })

  it('无召回时直接拒答且不调用模型', async () => {
    const model = createScriptedModel([])

    const result = await answerWithCitations('量子纠缠实验', docs, model)

    expect(result.answer).toBe('知识库中没有找到相关内容。')
    expect(result.citations).toEqual([])
    expect(model.calls).toHaveLength(0)
  })
})

describe('evaluate', () => {
  it('三条用例全部命中', () => {
    const summary = evaluate(
      [
        { query: '年假怎么申请', expectedDocId: 'leave' },
        { query: '报销发票什么时候交', expectedDocId: 'expense' },
        { query: '远程办公每周几天', expectedDocId: 'remote' }
      ],
      docs
    )

    expect(summary.total).toBe(3)
    expect(summary.hits).toBe(3)
    expect(summary.hitRate).toBe(1)
  })
})
