/* @jsxImportSource ../ */
// 双实现对照的共享用例：组件源码只写一份（编译到 mini 的 jsx-runtime），
// 分别交给官方 react-dom/server 与 mini-react 渲染，断言 DOM 一致
export type Item = { id: number; text: string }

export function Card() {
  return (
    <article id="card" title="卡片" data-kind="static">
      <h2>卡片标题</h2>
      {/* 相邻文本节点会被 Fizz 插入分隔注释，这里用元素隔开保持两侧一致 */}
      <p>
        <span>正文内容</span>
        {2026}
      </p>
    </article>
  )
}

export function List({ items }: { items: Item[] }) {
  return (
    <ul id="list">
      {items.map((item) => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  )
}

export function Page({ show }: { show: boolean }) {
  return (
    <div id="page">
      {show ? <span>显示</span> : null}
      {false}
      <Card />
      <List items={ITEMS} />
    </div>
  )
}

export const ITEMS: Item[] = [
  { id: 1, text: '甲' },
  { id: 2, text: '乙' },
  { id: 3, text: '丙' }
]
