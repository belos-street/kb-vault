/* @jsxImportSource ../ */
// 交互用例（mini-react 单侧）：JSX 经 jsxImportSource 指令编译到本仓库
// src/jsx-runtime，hooks 全部来自 src/index——完整走一遍 mini-react 的渲染管线。
// 官方侧的交互行为由 React 自身保证，静态一致性已由 compare.test.ts 覆盖
import { describe, expect, it } from 'bun:test'
import {
  Suspense,
  createRoot,
  useEffect,
  useState,
  useTransition
} from '../index'
import type { Item } from './cases'
import { flush } from './helpers'

const click = (el: Element | null): void => {
  el?.dispatchEvent(new MouseEvent('click'))
}

describe('mini-react 交互回归', () => {
  it('useState：点击后 state 更新上屏', async () => {
    function Counter() {
      const [count, setCount] = useState(0)
      return (
        <div>
          <p id="count">{count}</p>
          <button id="inc" onClick={() => setCount((prev) => prev + 1)}>
            +1
          </button>
        </div>
      )
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    root.render(<Counter />)
    await flush()
    expect(container.querySelector('#count')?.textContent).toBe('0')
    click(container.querySelector('#inc'))
    await flush()
    expect(container.querySelector('#count')?.textContent).toBe('1')
  })

  it('宿主 props 更新：className 改 attribute，checked 改 property', async () => {
    function HostPropsDemo({ name, on }: { name: string; on: boolean }) {
      return (
        <div>
          <p id="label" className={name}>
            {name}
          </p>
          <input id="toggle" type="checkbox" checked={on} />
        </div>
      )
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    root.render(<HostPropsDemo name="old" on={false} />)
    await flush()
    const label = container.querySelector('#label')
    const toggle = container.querySelector('#toggle') as HTMLInputElement
    expect(label?.getAttribute('class')).toBe('old')
    expect(toggle.checked).toBe(false)
    root.render(<HostPropsDemo name="new" on={true} />)
    await flush()
    // 更新路径走 commitUpdate：className 经 ATTR_ALIASES 写成 class 属性，
    // checked 是布尔值走 property 赋值——DOM 节点复用、原地变更
    expect(label?.getAttribute('class')).toBe('new')
    expect(toggle.checked).toBe(true)
  })

  it('列表 key diff：重排时复用 DOM 节点而非重建', async () => {
    const items: Item[] = [
      { id: 1, text: '甲' },
      { id: 2, text: '乙' },
      { id: 3, text: '丙' }
    ]
    function ListView({ list }: { list: Item[] }) {
      return (
        <ul>
          {list.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      )
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    root.render(<ListView list={items} />)
    await flush()
    const before = [...container.querySelectorAll('li')]
    expect(before.map((li) => li.textContent)).toEqual(['甲', '乙', '丙'])
    // 把「乙」挪到最前：key 命中复用 → 节点对象保持同一引用，只是被移动
    root.render(<ListView list={[items[1]!, items[0]!, items[2]!]} />)
    await flush()
    const after = [...container.querySelectorAll('li')]
    expect(after.map((li) => li.textContent)).toEqual(['乙', '甲', '丙'])
    expect(after[0]).toBe(before[1])
  })

  it('useEffect：依赖变化先 cleanup 后 effect，删除子树触发 cleanup', async () => {
    const log: string[] = []
    function EffectDemo({ step }: { step: number }) {
      useEffect(() => {
        log.push(`effect:${step}`)
        return () => {
          log.push(`cleanup:${step}`)
        }
      }, [step])
      return <p>第 {step} 步</p>
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    root.render(<EffectDemo step={1} />)
    await flush()
    expect(log).toEqual(['effect:1'])
    root.render(<EffectDemo step={2} />)
    await flush()
    expect(log).toEqual(['effect:1', 'cleanup:1', 'effect:2'])
    root.render(<p>替换</p>)
    await flush()
    expect(log).toEqual(['effect:1', 'cleanup:1', 'effect:2', 'cleanup:2'])
  })

  it('Transition：高优先级插队上屏，低优先级更新不丢', async () => {
    const renders: string[] = []
    function TransitionDemo() {
      const [urgent, setUrgent] = useState('输入 A')
      const [list, setList] = useState('列表 A')
      const [isPending, start] = useTransition()
      // 渲染期采样（测试用副作用）：记录每次渲染看到的两个 state
      renders.push(`${urgent}|${list}`)
      return (
        <div>
          <p id="urgent">{urgent}</p>
          <p id="list">{list}</p>
          {isPending && <p id="pending">过滤中…</p>}
          <button
            id="go"
            onClick={() => {
              start(() => {
                setList('列表 B')
              })
              setUrgent('输入 B')
            }}>
            触发
          </button>
        </div>
      )
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    root.render(<TransitionDemo />)
    await flush()
    expect(container.querySelector('#urgent')?.textContent).toBe('输入 A')
    click(container.querySelector('#go'))
    await flush()
    // 高优先级先上屏：urgent 变了，transition 里的 list 还是旧值
    expect(container.querySelector('#urgent')?.textContent).toBe('输入 B')
    expect(container.querySelector('#list')?.textContent).toBe('列表 B')
    expect(container.querySelector('#pending')).toBeNull()
    // 渲染序列证明两段都发生过：SyncLane 上屏在前，transition 渲染补齐在后
    expect(renders).toContain('输入 A|列表 A')
    expect(renders).toContain('输入 B|列表 A')
    expect(renders).toContain('输入 B|列表 B')
  })

  it('Suspense：先 fallback，resolve 后 children 上屏', async () => {
    // 可落定的异步资源：promise 缓存复用（重试渲染不能再次 throw 新 promise）
    let snapshot: string | null = null
    let resolveData: (() => void) | undefined
    const dataPromise = new Promise<void>((resolve) => {
      resolveData = resolve
    })
    dataPromise.then(() => {
      snapshot = '数据已就绪'
      return snapshot
    })
    function Data() {
      if (snapshot === null) {
        throw dataPromise
      }
      return <p id="data">{snapshot}</p>
    }
    function SuspenseDemo() {
      return (
        <Suspense fallback={<p id="fallback">加载中…</p>}>
          <Data />
        </Suspense>
      )
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    root.render(<SuspenseDemo />)
    await flush()
    expect(container.querySelector('#fallback')?.textContent).toBe('加载中…')
    expect(container.querySelector('#data')).toBeNull()
    resolveData?.()
    await flush()
    expect(container.querySelector('#data')?.textContent).toBe('数据已就绪')
    expect(container.querySelector('#fallback')).toBeNull()
  })
})
