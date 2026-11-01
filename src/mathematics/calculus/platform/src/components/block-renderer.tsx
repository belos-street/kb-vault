import type { Block, Tone } from '../data/types.ts'
import { Demo } from '../demos/index.tsx'
import { ExerciseBlock } from './exercise-block.tsx'
import { MathFormula, MathText } from './math.tsx'

const toneLabels: Record<Tone, string> = {
  definition: '定义',
  theorem: '定理',
  method: '方法',
  tip: '提示',
  warn: '注意',
  info: '说明'
}

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return (
        <p className="prose-p">
          <MathText text={block.text} />
        </p>
      )
    case 'h2':
      return (
        <h2 className="prose-h2">
          <MathText text={block.text} />
        </h2>
      )
    case 'h3':
      return (
        <h3 className="prose-h3">
          <MathText text={block.text} />
        </h3>
      )
    case 'formula':
      return (
        <div className="formula-block">
          <MathFormula tex={block.tex} display />
          {block.caption ? (
            <span className="formula-caption">{block.caption}</span>
          ) : null}
        </div>
      )
    case 'list':
      return block.ordered ? (
        <ol className="prose-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <MathText text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="prose-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <MathText text={item} />
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
              <MathText text={block.title} />
            </span>
          </div>
          <p className="note-body">
            <MathText text={block.text} />
          </p>
          {block.tex ? (
            <div className="note-formula">
              <MathFormula tex={block.tex} display />
            </div>
          ) : null}
        </aside>
      )
    case 'example':
      return (
        <div className="example">
          <div className="example-head">
            <span className="example-tag">例题</span>
            <span className="example-title">
              <MathText text={block.title} />
            </span>
          </div>
          <div className="example-problem">
            <MathText text={block.problem} />
          </div>
          <ol className="example-steps">
            {block.steps.map((step, index) => (
              <li key={index}>
                <MathText text={step} />
              </li>
            ))}
          </ol>
          {block.answer ? (
            <div className="example-answer">
              <span>答案</span>
              <MathText text={block.answer} />
            </div>
          ) : null}
        </div>
      )
    case 'table':
      return (
        <div className="table-wrap">
          <table className="prose-table">
            <thead>
              <tr>
                {block.head.map((cell, index) => (
                  <th key={index}>
                    <MathText text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      <MathText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'graph':
      return (
        <div className="block-graph">
          <Demo id={block.demo} />
        </div>
      )
    case 'exercise':
      return <ExerciseBlock title={block.title} items={block.items} />
  }
}
