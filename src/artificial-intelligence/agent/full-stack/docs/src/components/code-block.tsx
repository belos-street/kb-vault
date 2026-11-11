import { useEffect, useState } from 'react'
import { createBundledHighlighter } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const createHighlighter = createBundledHighlighter({
  langs: {
    ts: () => import('@shikijs/langs/typescript'),
    tsx: () => import('@shikijs/langs/tsx'),
    json: () => import('@shikijs/langs/json'),
    bash: () => import('@shikijs/langs/bash')
  },
  themes: {
    'github-dark-default': () => import('@shikijs/themes/github-dark-default')
  },
  // JS 正则引擎：省掉 212KB wasm，语法覆盖对 ts / json / bash 足够
  engine: () => createJavaScriptRegexEngine()
})

type HighlighterInstance = Awaited<ReturnType<typeof createHighlighter>>

let highlighterPromise: Promise<HighlighterInstance> | null = null

function getHighlighter(): Promise<HighlighterInstance> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark-default'],
      langs: ['ts', 'tsx', 'json', 'bash']
    })
  }
  return highlighterPromise
}

export function CodeBlock({
  title,
  lang,
  code,
  caption
}: {
  title?: string | undefined
  lang: string
  code: string
  caption?: string | undefined
}) {
  const [copied, setCopied] = useState(false)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const lines = code.replace(/\n$/, '').split('\n')

  useEffect(() => {
    let cancelled = false
    setHighlighted(null)

    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return null
        const loaded = highlighter.getLoadedLanguages()
        const target = loaded.includes(lang) ? lang : 'text'
        setHighlighted(
          highlighter.codeToHtml(code, {
            lang: target,
            theme: 'github-dark-default'
          })
        )
        return null
      })
      .catch(() => {
        if (!cancelled) setHighlighted(null)
      })

    return () => {
      cancelled = true
    }
  }, [code, lang])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // 剪贴板不可用时保持原样，用户可手动选中
    }
  }

  return (
    <figure className="code-card">
      <div className="code-head">
        <div className="code-head-left">
          <span className="code-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {title ? <span className="code-title">{title}</span> : null}
        </div>
        <div className="code-head-right">
          <span className="code-lang">{lang}</span>
          <button type="button" className="code-copy" onClick={copy}>
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {highlighted ? (
        <div
          className="code-highlight"
          // Shiki 输出的是已转义的 HTML，只来自本仓库的静态代码内容
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre className="code-body">
          <code>
            {lines.map((line, index) => (
              <span className="code-line" key={index}>
                <span className="code-line-no">
                  {String(index + 1).padStart(2, ' ')}
                </span>
                <span className="code-line-text">{line || ' '}</span>
              </span>
            ))}
          </code>
        </pre>
      )}

      {caption ? (
        <figcaption className="code-caption">{caption}</figcaption>
      ) : null}
    </figure>
  )
}
