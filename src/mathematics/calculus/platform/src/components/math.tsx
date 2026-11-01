import { renderToString } from 'katex'
import { useMemo } from 'react'

function renderTex(tex: string, displayMode: boolean): string {
  return renderToString(tex, {
    displayMode,
    throwOnError: false,
    strict: false,
    trust: false
  })
}

export function MathFormula({
  tex,
  display = false
}: {
  tex: string
  display?: boolean
}) {
  const html = useMemo(() => renderTex(tex, display), [tex, display])
  return (
    <span
      className={display ? 'math math-display' : 'math math-inline'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

const TOKEN = /(\$[^$]+\$|\*\*[^*]+\*\*)/g

/** 渲染含有 $...$ 行内公式与 **粗体** 的文案 */
export function MathText({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          return <MathFormula key={index} tex={part.slice(1, -1)} />
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}
