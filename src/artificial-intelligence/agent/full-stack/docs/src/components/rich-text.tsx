const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

export function RichText({ text }: { text: string }) {
  const parts = text.split(inlinePattern)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="inline-code">
              {part.slice(1, -1)}
            </code>
          )
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (link) {
          const [, label, href] = link
          if (label && href) {
            return (
              <a key={index} href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
            )
          }
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}
