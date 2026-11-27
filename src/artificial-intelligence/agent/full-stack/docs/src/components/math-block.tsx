import { useMemo } from 'react'
import { renderToString } from 'katex'
import { RichText } from './rich-text.tsx'

export function MathBlock({
  latex,
  caption
}: {
  latex: string
  caption?: string | undefined
}) {
  const html = useMemo(
    () =>
      renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        strict: false
      }),
    [latex]
  )

  return (
    <figure className="math-block">
      {/* KaTeX 输出的是已转义的 HTML，只来自本仓库的静态 LaTeX 内容 */}
      <div className="math-body" dangerouslySetInnerHTML={{ __html: html }} />
      {caption ? (
        <figcaption className="math-caption">
          <RichText text={caption} />
        </figcaption>
      ) : null}
    </figure>
  )
}
