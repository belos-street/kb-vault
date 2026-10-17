import { Fragment, type ReactNode } from 'react'
import { parseInline, type Inline } from './inline.ts'

// 行内标记渲染（parseInline 同源）：`code` / **strong**。
// 本项目讲义引用是 Gnn → VitePress 深读跳转（T11），不走 L23 讲内跳转；
// parseInline 的 Lnn ref 节点在此按纯文本渲染。
function renderNodes(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === 'code') {
      return (
        <code className="inline-code" key={i}>
          {n.text}
        </code>
      )
    }
    if (n.type === 'strong') {
      return <strong key={i}>{renderNodes(n.children)}</strong>
    }
    if (n.type === 'ref') return <Fragment key={i}>{n.number}</Fragment>
    return <Fragment key={i}>{n.text}</Fragment>
  })
}

export function Inlines(props: { text: string }) {
  return <>{renderNodes(parseInline(props.text))}</>
}
