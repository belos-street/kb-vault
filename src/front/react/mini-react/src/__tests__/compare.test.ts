// 双实现对照测试：用 mini-react 的 createElement 构造**同一个 element 实例**，
// 分别交给官方 react（renderToString 基线，无需 DOM/act）与 mini-react（createRoot
// 渲染到容器）各渲染一遍，断言 DOM 结果逐字一致。组件源码在 ./cases 只写一份。
import { describe, expect, it } from 'bun:test'
import { renderToString } from 'react-dom/server'
import type { ReactNode } from 'react'
import { createElement, createRoot } from '../index'
import type { ReactElement } from '../index'
import { Card, ITEMS, List, Page } from './cases'
import { flush } from './helpers'

// mini-react 的首挂载走调度器（宏任务）：渲染后先排空再断言
const renderMini = async (element: ReactElement): Promise<string> => {
  const container = document.createElement('div')
  createRoot(container).render(element)
  await flush()
  return container.innerHTML
}

// 类型层桥接：两套 ReactElement 类型结构同构（运行时协议同源 Symbol.for），
// 但 @types/react 19 的 ReactElement 构造约束不含对象形态的 type，需显式断言
const renderOfficial = (element: ReactElement): string =>
  renderToString(element as unknown as ReactNode)

describe('双实现对照：同一用例，DOM 一致', () => {
  it('静态嵌套结构（属性/文本/数字子项）', async () => {
    const element = createElement(Card, null)
    const official = renderOfficial(element)
    const mini = await renderMini(element)
    expect(mini).toBe(official)
  })

  it('key 列表渲染', async () => {
    const element = createElement(List, { items: ITEMS })
    const official = renderOfficial(element)
    const mini = await renderMini(element)
    expect(mini).toBe(official)
  })

  it('组件嵌套 + 条件渲染（true 分支）', async () => {
    const element = createElement(Page, { show: true })
    const official = renderOfficial(element)
    const mini = await renderMini(element)
    expect(mini).toBe(official)
  })

  it('组件嵌套 + 条件渲染（false 分支渲染为空）', async () => {
    const element = createElement(Page, { show: false })
    const official = renderOfficial(element)
    const mini = await renderMini(element)
    expect(mini).toBe(official)
  })
})
