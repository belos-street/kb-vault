import type { Chunk } from '../../data/types.ts'

export function ChunkList({ items, step }: { items: Chunk[]; step: number }) {
  return (
    <section className="section" aria-labelledby="section-chunks">
      <div className="section-head">
        <span className="section-num">{String(step).padStart(2, '0')}</span>
        <h2 id="section-chunks">句块</h2>
        <span className="section-hint">划出可复用的框架</span>
      </div>

      <ul className="chunk-list">
        {items.map((chunk) => (
          <li className="chunk" key={chunk.text}>
            <p className="chunk-text">{chunk.text}</p>
            <p className="chunk-frame">{chunk.frame}</p>
            <p className="chunk-note">{chunk.note}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
