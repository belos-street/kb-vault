// 行内标记解析（纯函数，构建期结构化块 + 运行时共用）
// 覆盖三种标记：`code`、**strong**、讲次引用 L23。
// 为什么不放进 parser 剥离：explanation / answer 必须保留 `**` 原文
// 供答案提取（extractFillParts 依赖加粗标记），又要渲染展示，
// 用一个共用 tokenizer 保证「提取口径」与「展示口径」同源。

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'ref'; number: string }

const INLINE_RE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(L\d{2}(?!\d))/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  const re = new RegExp(INLINE_RE.source, 'g')
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: 'text', text: text.slice(last, m.index) })
    }
    const code = m[1]
    const bold = m[2]
    const ref = m[3]
    if (code !== undefined) {
      out.push({ type: 'code', text: code.slice(1, -1) })
    } else if (bold !== undefined) {
      out.push({ type: 'strong', children: parseInline(bold.slice(2, -2)) })
    } else if (ref !== undefined) {
      out.push({ type: 'ref', number: ref })
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out
}
