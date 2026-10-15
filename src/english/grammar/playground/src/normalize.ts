import type { Blank } from './schema/lesson.ts'

// 判分归一化（requirements §6 判分归一化，T10 口径）：
// 大小写不敏感；首尾空白不敏感；内部空白折叠；标点不敏感；
// 不做词干/词形还原（snows ≠ snow）；空内多可接受答案任一匹配即该空对。

// ASCII 标点 + 中文标点 + 破折号/引号/省略号 + 全角符号
const PUNCT_RE =
  /[!-/:-@[-`{-~—–…‘’“”、。，；：？！…—～「」『』（）【】《》〈〉·\u3000-\u303F！-＠［-｀｛-～]/g

/** 归一化：小写 + 去标点 + 空白折叠为单空格 + 去首尾空白 */
export function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(PUNCT_RE, '').replace(/\s+/g, ' ').trim()
}

function despace(s: string): string {
  return s.replace(/\s+/g, '')
}

/**
 * 比对：归一化后全等，或去空格后全等（容「主+动+宾」vs「主 + 动 + 宾」式分词差）。
 * 不做词形还原——snows ≠ snow 仍判不同。
 */
export function answerEquals(input: string, accept: string): boolean {
  const a = normalizeAnswer(input)
  const b = normalizeAnswer(accept)
  return a === b || despace(a) === despace(b)
}

/** 单空判定：空内多可接受答案任一匹配即对；「不填」空允许空串 / 「∅」「不填」字样 */
export function judgeBlank(input: string, blank: Blank): boolean {
  if (blank.allowEmpty) {
    const t = input.trim()
    if (t === '' || t === '不填' || t === '∅') {
      return blank.accepts.some((a) => normalizeAnswer(a) === '')
    }
  }
  return blank.accepts.some((acc) => answerEquals(input, acc))
}

/** 题粒度判定：全部空都对才 ok（空级结果随解析展示） */
export function judgeFill(
  inputs: string[],
  blanks: Blank[]
): { ok: boolean; perBlank: boolean[] } {
  const perBlank = blanks.map((b, i) => judgeBlank(inputs[i] ?? '', b))
  return { ok: perBlank.length > 0 && perBlank.every(Boolean), perBlank }
}
