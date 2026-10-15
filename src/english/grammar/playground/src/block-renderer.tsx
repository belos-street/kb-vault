import { Fragment, type ReactNode } from 'react'
import { parseInline, type Inline } from './inline.ts'
import { resolveRef } from './data.ts'
import type { Block, Lesson } from './schema/lesson.ts'

function renderInlineNodes(
  nodes: Inline[],
  ctx: Lesson,
  onGoto: (key: string) => void
): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === 'text') return <Fragment key={i}>{n.text}</Fragment>
    if (n.type === 'code') {
      return (
        <code className="inline-code" key={i}>
          {n.text}
        </code>
      )
    }
    if (n.type === 'strong') {
      return (
        <strong key={i}>{renderInlineNodes(n.children, ctx, onGoto)}</strong>
      )
    }
    const key = resolveRef(n.number, ctx)
    if (key === undefined) return <Fragment key={i}>{n.number}</Fragment>
    return (
      <span
        className="lesson-ref"
        key={i}
        onClick={() => onGoto(key)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onGoto(key)
        }}>
        {n.number}
      </span>
    )
  })
}

/** 行内标记渲染：`code` / **strong** / L23 讲次引用（parseInline 同源解析） */
export function Inlines(props: {
  text: string
  ctx: Lesson
  onGoto: (key: string) => void
}) {
  return (
    <>{renderInlineNodes(parseInline(props.text), props.ctx, props.onGoto)}</>
  )
}

export function Blocks(props: {
  blocks: Block[]
  ctx: Lesson
  onGoto: (key: string) => void
}) {
  const { blocks, ctx, onGoto } = props
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'p') {
          return (
            <p className="para" key={i}>
              <Inlines text={b.text} ctx={ctx} onGoto={onGoto} />
            </p>
          )
        }
        if (b.type === 'subhead') {
          return (
            <h3 className="subhead" key={i}>
              <Inlines text={b.text} ctx={ctx} onGoto={onGoto} />
            </h3>
          )
        }
        if (b.type === 'pitfall') {
          return (
            <div className="pitfall" key={i}>
              <Inlines text={b.text} ctx={ctx} onGoto={onGoto} />
            </div>
          )
        }
        if (b.type === 'quote') {
          return (
            <blockquote className="quote" key={i}>
              <Inlines text={b.text} ctx={ctx} onGoto={onGoto} />
            </blockquote>
          )
        }
        if (b.type === 'list') {
          const items = b.items.map((item, j) => (
            <li key={j}>
              <Inlines text={item} ctx={ctx} onGoto={onGoto} />
            </li>
          ))
          return b.ordered ? (
            <ol className="rlist" key={i}>
              {items}
            </ol>
          ) : (
            <ul className="rlist" key={i}>
              {items}
            </ul>
          )
        }
        if (b.type === 'example') {
          return (
            <div className="example" key={i}>
              {b.label !== '' && <div className="ex-label">{b.label}</div>}
              {b.en.map((en, j) => (
                <div className="en" key={j}>
                  {en}
                </div>
              ))}
              {b.zh !== '' && (
                <p className="zh">
                  <Inlines text={b.zh} ctx={ctx} onGoto={onGoto} />
                </p>
              )}
            </div>
          )
        }
        return (
          <table className="rtable" key={i}>
            <thead>
              <tr>
                {b.head.map((h, j) => (
                  <th key={j}>
                    <Inlines text={h} ctx={ctx} onGoto={onGoto} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k}>
                      <Fragment>
                        <Inlines text={cell} ctx={ctx} onGoto={onGoto} />
                      </Fragment>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      })}
    </>
  )
}
