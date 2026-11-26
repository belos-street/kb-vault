import type { GrammarCard } from '../../data/types.ts'

/**
 * 语法卡注册表：课时只引 id，卡片跨讲复用。
 * 锚句必须来自同一单元已有内容的讲，由 validate 校验。
 */
export const grammarCards: Record<string, GrammarCard> = {
  'there-be-agreement': {
    id: 'there-be-agreement',
    title: '主谓一致与 there be',
    rule: '先找谓语，再回看主语；主语是单数就用 opens / is，表示“某地有某物”用 There be，不用 have。',
    anchors: [
      {
        lessonId: 'p01',
        text: 'The bakery on the corner opens before the sun.'
      },
      {
        lessonId: 'p01',
        text: 'There is a wooden table by the window.'
      },
      {
        lessonId: 'p01',
        text: 'The shop is small, but it holds a lot of stories.'
      }
    ],
    contrast:
      '中文“店里有张桌子”常被直译成 The shop has a table；英语更常说 There is a table in the shop。have 强调拥有关系，there be 强调存在。',
    commonErrors: [
      'There have a table...（错：there be 的 be 不能换成 have）',
      'The bakery on the corner open before the sun.（错：主语的核心词是 bakery，谓语要加 -s）'
    ]
  }
}

export function getGrammarCard(id: string): GrammarCard | undefined {
  return grammarCards[id]
}
