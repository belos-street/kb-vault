import type { VocabItem } from '../../data/types.ts'

export function VocabList({
  items,
  step
}: {
  items: VocabItem[]
  step: number
}) {
  return (
    <section className="section" aria-labelledby="section-vocab">
      <div className="section-head">
        <span className="section-num">{String(step).padStart(2, '0')}</span>
        <h2 id="section-vocab">词汇</h2>
        <span className="section-hint">读完速览，不背表</span>
      </div>

      <div className="vocab-wrap">
        <table className="vocab-table">
          <thead>
            <tr>
              <th>词</th>
              <th>音标</th>
              <th>释义</th>
              <th>课文例句</th>
              <th>搭配</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.word}>
                <td className="vocab-word">{item.word}</td>
                <td className="vocab-phonetic">{item.phonetic}</td>
                <td>{item.meaning}</td>
                <td className="vocab-example">{item.example}</td>
                <td className="vocab-collocation">{item.collocation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
