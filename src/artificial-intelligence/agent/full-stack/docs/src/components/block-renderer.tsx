import type { Block, Tone } from '../data/types.ts'
import { Demo } from '../demos/index.tsx'
import { CodeBlock } from './code-block.tsx'
import { Diagram } from './diagram.tsx'
import { ExerciseBlock } from './exercise-block.tsx'
import { RichText } from './rich-text.tsx'

const toneLabels: Record<Tone, string> = {
  tip: '提示',
  warn: '注意',
  info: '说明',
  definition: '定义',
  interview: '面试',
  decision: '取舍'
}

export function BlockRenderer({
  block,
  blockIndex
}: {
  block: Block
  blockIndex: number
}) {
  switch (block.kind) {
    case 'p':
      return (
        <p className="prose-p">
          <RichText text={block.text} />
        </p>
      )
    case 'h2':
      return (
        <h2 id={`section-${blockIndex}`} className="prose-h2">
          <RichText text={block.text} />
        </h2>
      )
    case 'h3':
      return (
        <h3 className="prose-h3">
          <RichText text={block.text} />
        </h3>
      )
    case 'list':
      return block.ordered ? (
        <ol className="prose-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <RichText text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="prose-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )
    case 'note':
      return (
        <aside className={`note note-${block.tone}`}>
          <div className="note-head">
            <span className="note-tag">{toneLabels[block.tone]}</span>
            <span className="note-title">
              <RichText text={block.title} />
            </span>
          </div>
          <p className="note-body">
            <RichText text={block.text} />
          </p>
        </aside>
      )
    case 'table':
      return (
        <div className="table-wrap">
          <table className="prose-table">
            <thead>
              <tr>
                {block.head.map((cell, index) => (
                  <th key={index}>
                    <RichText text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'code':
      return (
        <CodeBlock
          title={block.title}
          lang={block.lang}
          code={block.code}
          caption={block.caption}
        />
      )
    case 'demo':
      return <Demo id={block.id} />
    case 'diagram':
      return <Diagram block={block} />
    case 'links':
      return (
        <section className="links-card">
          <h3>{block.title}</h3>
          <ul>
            {block.items.map((item, index) => (
              <li key={index}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
                {item.note ? <span>{item.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )
    case 'example':
      return (
        <div className="example">
          <div className="example-head">
            <span className="example-tag">例子</span>
            <span className="example-title">
              <RichText text={block.title} />
            </span>
          </div>
          <div className="example-problem">
            <RichText text={block.problem} />
          </div>
          <ol className="example-steps">
            {block.steps.map((step, index) => (
              <li key={index}>
                <RichText text={step} />
              </li>
            ))}
          </ol>
          {block.answer ? (
            <div className="example-answer">
              <span className="example-answer-label">答案</span>
              <RichText text={block.answer} />
            </div>
          ) : null}
        </div>
      )
    case 'exercise':
      return <ExerciseBlock title={block.title} items={block.items} />
    case 'checklist':
      return (
        <section className="checklist">
          <h3>{block.title}</h3>
          <ul>
            {block.items.map((item, index) => (
              <li key={index}>
                <span className="check-mark" aria-hidden="true">
                  ✓
                </span>
                <RichText text={item} />
              </li>
            ))}
          </ul>
        </section>
      )
  }
}
