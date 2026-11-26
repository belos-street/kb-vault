import type { Chunk } from '../../data/types.ts'

export function ChunkList({ items }: { items: Chunk[] }) {
  return (
    <ul className="chunk-list">
      {items.map((chunk) => (
        <li className="chunk" key={chunk.text}>
          <p className="chunk-text">{chunk.text}</p>
          <p className="chunk-frame">{chunk.frame}</p>
          <p className="chunk-note">{chunk.note}</p>
        </li>
      ))}
    </ul>
  )
}
