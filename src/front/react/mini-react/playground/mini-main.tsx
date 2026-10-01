/* @jsxImportSource ../src */
// 篇 12 验收场景：与 main.tsx 同一 Demo，仅换 import——
// hooks / createRoot / Suspense 全部来自本仓库 src/index.ts；
// 首行 jsxImportSource 指令把 JSX 编译到 src/jsx-runtime（vite dev 会用
// src/jsx-dev-runtime）。除首行与 import 外，组件代码与 main.tsx 逐字一致
import { Suspense, createRoot, useState, useTransition } from '../src/index'

type Todo = { id: number; text: string; done: boolean }

const initialTodos: Todo[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i + 1,
  text: `待办 ${i + 1}`,
  done: i % 3 === 0
}))

// 模拟异步资源（篇 11）：快/慢网络两种表现
const fetchProfile = (delay: number): Promise<{ name: string }> =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ name: 'mini-react 读者' }), delay)
  )

let profileSnapshot: { name: string } | null = null
let profilePromise: Promise<{ name: string }> | null = null

const readProfile = (delay: number): { name: string } => {
  if (profileSnapshot !== null) {
    return profileSnapshot
  }
  profilePromise ??= fetchProfile(delay).then((data) => {
    profileSnapshot = data
    return data
  })
  throw profilePromise
}

function Profile({ delay }: { delay: number }) {
  const profile = readProfile(delay)
  return <p>当前读者：{profile.name}</p>
}

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [keyword, setKeyword] = useState('')
  const [isPending, startTransition] = useTransition()
  // 篇 11 练习场景：快网络（0ms）/ 慢网络（2000ms）切换后重载
  const [delay, setDelay] = useState<number | null>(null)

  const visible = todos.filter((t) => t.text.includes(keyword))

  return (
    <main>
      <h1>mini-react 对照组</h1>
      <input
        value={keyword}
        placeholder="过滤 5000 条待办…"
        onChange={(e) => {
          setKeyword(e.target.value)
          // 篇 10 场景：输入保持同步响应，列表过滤降为低优先级
          startTransition(() => {
            setTodos((prev) =>
              prev.filter((t) => t.text.includes(e.target.value))
            )
          })
        }}
      />
      {isPending && <span> 过滤中…</span>}
      <button
        onClick={() =>
          setTodos((prev) => prev.map((t) => ({ ...t, done: !t.done })))
        }>
        全部取反
      </button>
      <div>
        <button onClick={() => setDelay(0)}>加载资料（快网络）</button>
        <button onClick={() => setDelay(2000)}>加载资料（慢网络）</button>
        <Suspense fallback={<p>资料加载中…</p>}>
          {delay !== null && <Profile delay={delay} />}
        </Suspense>
      </div>
      <ul>
        {visible.map((t) => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.done} readOnly /> {t.text}
            </label>
          </li>
        ))}
      </ul>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<TodoApp />)
