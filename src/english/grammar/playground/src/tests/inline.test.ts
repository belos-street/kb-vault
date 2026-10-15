import { describe, expect, test } from 'bun:test'
import { parseInline } from '../inline.ts'

// parseInline 是「提取与展示同源」不变量的承载体：
// explanation / answer 字段带 `**` 原文，渲染时必须走它，不得直插文本。

describe('parseInline', () => {
  test('加粗内嵌 code', () => {
    expect(parseInline('**看 `The rabbit runs.` 这句**')).toEqual([
      {
        type: 'strong',
        children: [
          { type: 'text', text: '看 ' },
          { type: 'code', text: 'The rabbit runs.' },
          { type: 'text', text: ' 这句' }
        ]
      }
    ])
  })
  test('多个加粗段 + 加粗内 code', () => {
    const nodes = parseInline('**外层** 和 **内 `x` 层**')
    expect(nodes).toEqual([
      { type: 'strong', children: [{ type: 'text', text: '外层' }] },
      { type: 'text', text: ' 和 ' },
      {
        type: 'strong',
        children: [
          { type: 'text', text: '内 ' },
          { type: 'code', text: 'x' },
          { type: 'text', text: ' 层' }
        ]
      }
    ])
  })
  test('L23 引用在加粗内', () => {
    expect(parseInline('**详见 L23 一节**')).toEqual([
      {
        type: 'strong',
        children: [
          { type: 'text', text: '详见 ' },
          { type: 'ref', number: 'L23' },
          { type: 'text', text: ' 一节' }
        ]
      }
    ])
  })
  test('不平衡 ** 降级为纯文本（不炸、不丢字符）', () => {
    const nodes = parseInline('半截 **加粗没有收尾')
    expect(nodes).toEqual([{ type: 'text', text: '半截 **加粗没有收尾' }])
  })
  test('伪嵌套 **a **b** c**：按就近配对拆段，字符不丢', () => {
    const nodes = parseInline('**a **b** c**')
    expect(nodes).toEqual([
      { type: 'strong', children: [{ type: 'text', text: 'a ' }] },
      { type: 'text', text: 'b' },
      { type: 'strong', children: [{ type: 'text', text: ' c' }] }
    ])
  })
  test('裸 L23 前后数字不误判（L230 不是引用）', () => {
    expect(parseInline('L230 不跳，L23 跳')).toEqual([
      { type: 'text', text: 'L230 不跳，' },
      { type: 'ref', number: 'L23' },
      { type: 'text', text: ' 跳' }
    ])
  })
  test('纯文本原样', () => {
    expect(parseInline('没有任何标记。')).toEqual([
      { type: 'text', text: '没有任何标记。' }
    ])
  })
})
