import type { VocabItem } from '../../data/types.ts'

export function VocabList({ items }: { items: VocabItem[] }) {
  return (
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
  )
}
