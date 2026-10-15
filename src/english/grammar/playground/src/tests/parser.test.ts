import { describe, expect, test } from 'bun:test'
import {
  buildBlanks,
  extractFillParts,
  parseAnswers,
  parseBlocks,
  parseLesson
} from '../scripts/parser.ts'
import { parseInline } from '../inline.ts'

describe('parseAnswers', () => {
  test('加粗首片段为参考答案，全文保留为解析', () => {
    const map = parseAnswers('- **B1**：**B**。honest 的 h 不发音。')
    expect(map.get('B1')).toEqual({
      answer: 'B',
      body: '**B**。honest 的 h 不发音。',
      found: true
    })
  })
  test('无加粗 → found=false（降级自判）', () => {
    const map = parseAnswers('- **S1**：a king → **the king**。')
    // 首个加粗即 the king
    expect(map.get('S1')?.found).toBe(true)
    const map2 = parseAnswers('- **S2**：直接文字答案。')
    expect(map2.get('S2')?.found).toBe(false)
  })
})

describe('extractFillParts', () => {
  test('多个加粗按序展开，分号再拆', () => {
    const { parts } = extractFillParts('**me；little**。解释。')
    expect(parts).toEqual(['me', 'little'])
  })
  test('句型：token 参与对齐（L09 B3 式，需显式开启）', () => {
    const body =
      '前者是**实义动词**（句型：主 + 动 + 宾），后者是**系动词**（句型：主 + 系 + 表）。'
    expect(extractFillParts(body).parts).toEqual(['实义动词', '系动词'])
    expect(extractFillParts(body, { patternTokens: true }).parts).toEqual([
      '实义动词',
      '主 + 动 + 宾',
      '系动词',
      '主 + 系 + 表'
    ])
  })
})

describe('buildBlanks', () => {
  test('「不填」= 空串合法', () => {
    const blanks = buildBlanks(['不填', 'the'], 2)
    expect(blanks[0]).toEqual({ accepts: [''], allowEmpty: true })
    expect(blanks[1]).toEqual({ accepts: ['the'], allowEmpty: false })
  })
  test('「（或 …）」承载多变体', () => {
    const blanks = buildBlanks(
      ['leave you a carrot（或 leave a carrot for you）'],
      1
    )
    expect(blanks[0]?.accepts).toEqual([
      'leave you a carrot',
      'leave a carrot for you'
    ])
  })
  test('片段数 < 空数 → 余空复用末答案（成对空）', () => {
    const blanks = buildBlanks(['em dash（—）'], 2)
    expect(blanks).toHaveLength(2)
    expect(blanks[1]?.accepts).toEqual(['em dash（—）'])
  })
})

describe('parseBlocks', () => {
  test('表格剔除分隔线行', () => {
    const blocks = parseBlocks(['| a | b |', '| --- | --- |', '| 1 | 2 |'])
    expect(blocks[0]).toEqual({
      type: 'table',
      head: ['a', 'b'],
      rows: [['1', '2']]
    })
  })
  test('常见坑：列表前缀 `- ⚠️` 与裸 `⚠️` 两种形态', () => {
    const blocks = parseBlocks([
      '- ⚠️ **及物是用法**：判别看具体句子。',
      '⚠️ 另一条坑。'
    ])
    expect(blocks).toEqual([
      { type: 'pitfall', text: '⚠️ **及物是用法**：判别看具体句子。' },
      { type: 'pitfall', text: '⚠️ 另一条坑。' }
    ])
  })
  test('例句块：编号项 + 加粗 label + 行内代码英文句 + 中文解说', () => {
    const blocks = parseBlocks([
      '1. **主 + 动**：`The rabbit runs.` —— run 不及物，不索要宾语。',
      '2. **主 + 动 + 宾**：`The rabbit eats a carrot.` —— eat 单及物。'
    ])
    expect(blocks).toEqual([
      {
        type: 'example',
        label: '主 + 动',
        en: ['The rabbit runs.'],
        zh: 'run 不及物，不索要宾语。'
      },
      {
        type: 'example',
        label: '主 + 动 + 宾',
        en: ['The rabbit eats a carrot.'],
        zh: 'eat 单及物。'
      }
    ])
  })
  test('纯英文句列表项合并为一个例句块（连续无中文解说项）', () => {
    const blocks = parseBlocks([
      '- `The rabbit eats.`',
      '- `The rabbit eats a carrot, and the wolf sleeps.`'
    ])
    expect(blocks).toEqual([
      {
        type: 'example',
        label: '',
        en: [
          'The rabbit eats.',
          'The rabbit eats a carrot, and the wolf sleeps.'
        ],
        zh: ''
      }
    ])
  })
  test('带中文解说的例句项独立成块，不与相邻项合并', () => {
    const blocks = parseBlocks([
      '- `The rabbit eats.` —— 什么 + 怎么样',
      '- `The rabbit eats a carrot, and the wolf sleeps.`'
    ])
    expect(blocks).toEqual([
      {
        type: 'example',
        label: '',
        en: ['The rabbit eats.'],
        zh: '什么 + 怎么样'
      },
      {
        type: 'example',
        label: '',
        en: ['The rabbit eats a carrot, and the wolf sleeps.'],
        zh: ''
      }
    ])
  })
  test('普通列表项（非英文句）结构化为 list', () => {
    const blocks = parseBlocks([
      '- 两部分对应**主语 + 谓语**',
      '1. **找动词（步骤①）**：先找动词。'
    ])
    expect(blocks).toEqual([
      { type: 'list', ordered: false, items: ['两部分对应**主语 + 谓语**'] },
      {
        type: 'list',
        ordered: true,
        items: ['**找动词（步骤①）**：先找动词。']
      }
    ])
  })
  test('小节标题 ### 2.1 式剥离 # 号为 subhead 块', () => {
    const blocks = parseBlocks(['### 2.1 核心推导链：五步走', '正文段落。'])
    expect(blocks).toEqual([
      { type: 'subhead', text: '2.1 核心推导链：五步走' },
      { type: 'p', text: '正文段落。' }
    ])
  })
})

describe('parseInline', () => {
  test('加粗 / 行内代码 / 讲次引用', () => {
    expect(parseInline('**主语** + `The rabbit runs.` （详见 L23）')).toEqual([
      { type: 'strong', children: [{ type: 'text', text: '主语' }] },
      { type: 'text', text: ' + ' },
      { type: 'code', text: 'The rabbit runs.' },
      { type: 'text', text: ' （详见 ' },
      { type: 'ref', number: 'L23' },
      { type: 'text', text: '）' }
    ])
  })
})

describe('parseLesson 端到端（最小样例）', () => {
  const md = `# L99：测试讲

> 学完本讲你能：**学会测试**。

## 1. 为什么需要这个概念

背景段落。

## 2. 核心概念与规则

| 维度 | 用途 |
| --- | --- |
| ① 宾语 | 推句型 |

## 3. 例句精讲

例句段。

## 4. 常见坑

⚠️ 别认错。

## 5. 一句话总结

> 动词定句型。

## 6. 随堂练习

**B1（选择）**：句型是？
- A. 主 + 动
- B. 主 + 动 + 宾
- C. 双宾
- D. 宾补

**B2（填空）**：前者是 ____ 动词，后者是 ____ 动词。

## 7. 参考答案与解析

- **B1**：**B**。eat 单及物。
- **B2**：前者是**不及物**，后者是**系动词**。
`
  const { lesson, warnings } = parseLesson({
    md,
    board: '02-动词体系',
    index: 99,
    fileName: 'L99.md'
  })

  test('复合键与七节', () => {
    expect(lesson.key).toBe('02-动词体系-L99')
    expect(lesson.number).toBe('L99')
    expect(lesson.goal).toBe('学会测试。')
    expect(lesson.sections.summary).toBe('动词定句型。')
    expect(lesson.questions).toHaveLength(2)
    expect(warnings).toHaveLength(0)
  })
  test('选择题抽取选项与答案', () => {
    const q = lesson.questions[0]
    expect(q?.kind).toBe('choice')
    expect(q?.options).toEqual(['主 + 动', '主 + 动 + 宾', '双宾', '宾补'])
    expect(q?.answer).toBe('B')
  })
  test('「判断」归入 fill 家族并按空位对齐', () => {
    // 本样例用「填空」标签
    const q = lesson.questions[1]
    expect(q?.kind).toBe('fill')
    expect(q?.blanks).toEqual([
      { accepts: ['不及物'], allowEmpty: false },
      { accepts: ['系动词'], allowEmpty: false }
    ])
  })

  test('dataVersion：改讲解文字不变、改题目必变（T12 失配判定口径）', () => {
    const base = lesson.dataVersion
    // 改「为什么需要」段落（纯讲解）
    const md2 = md.replace('背景段落。', '背景段落（改写）。')
    const v2 = parseLesson({
      md: md2,
      board: '02-动词体系',
      index: 99,
      fileName: 'L99.md'
    }).lesson.dataVersion
    expect(v2).toBe(base)
    // 改题干（加一个字）
    const md3 = md.replace('前者是 ____ 动词', '前者也是 ____ 动词')
    const v3 = parseLesson({
      md: md3,
      board: '02-动词体系',
      index: 99,
      fileName: 'L99.md'
    }).lesson.dataVersion
    expect(v3).not.toBe(base)
    // 改答案（第 7 节）
    const md4 = md.replace('**不及物**', '**不及物动词**')
    const v4 = parseLesson({
      md: md4,
      board: '02-动词体系',
      index: 99,
      fileName: 'L99.md'
    }).lesson.dataVersion
    expect(v4).not.toBe(base)
  })
})
