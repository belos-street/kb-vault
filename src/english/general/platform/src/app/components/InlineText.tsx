/** 渲染行内 **加粗** 片段（词汇例句 / 拆解里保留了 markdown 加粗标记） */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>
      )}
    </>
  )
}
