# Vitest — 快速上手

> 定位：**工具速查**。装 → 配 → 写 → 测组件 → 看覆盖率。不深入框架内部。
> 版本口径：Vitest 4.x（验证时间：2026-09）。以 [官方文档](https://vitest.dev/) 为准。

***

## 学习目标

完成本模块后，你应该能够：

- 按轻到重选用四种 mock（fn / spyOn / 模块 / 时间），说清 vi.mock 的 hoisting 行为
- 用 Testing Library 按"查询优先级"写纯行为断言的组件测试
- 为项目定测试策略（金字塔比例 + mock 边界铁律 + 覆盖率阈值）

## 篇目

| 篇 | 内容 | 定位 |
| -- | ---- | ---- |
| [01-Vitest核心与Mock](doc/01-Vitest核心与Mock.md) | 运行模型 + matcher 分场景 + 四层 mock + hoisting 坑 | 教学 |
| [02-组件测试与策略](doc/02-组件测试与策略.md) | RTL 查询优先级 + 测什么不测什么 + 金字塔 + 覆盖率 + CI | 教学 |

***

## 30 秒理解

Vitest = **复用 Vite 配置和转换管线的测试框架**。API 兼容 Jest（describe/it/expect/vi），从 Jest 迁移基本零成本；dev 模式下 watch 极快。**Vite 项目直接选它，不用纠结。**

---

## 快速上手

```bash
bun add -d vitest @vitest/coverage-v8   # coverage 的 v8 provider 是独立包，要单独装
bunx vitest               # watch 模式
bunx vitest run           # 跑一遍（CI 用）
bunx vitest run --coverage  # 覆盖率
```

```jsonc
// package.json scripts
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**第一个测试：**

```ts
// src/utils/add.ts
export const add = (a: number, b: number) => a + b
```

```ts
// src/utils/add.test.ts
import { describe, expect, it } from 'vitest'
import { add } from './add'

describe('add', () => {
  it('两数相加', () => {
    expect(add(1, 2)).toBe(3)
  })

  it.each([
    [0, 0, 0],
    [-1, 1, 0],
  ])('%i + %i = %i', (a, b, expected) => {
    expect(add(a, b)).toBe(expected)
  })
})
```

约定：`*.test.ts` / `*.spec.ts` 自动被发现。

---

## 常用配置

Vitest 独立配置文件 `vitest.config.ts`（会自动合并 vite.config.ts，通常只在测试项不同时才单独建）：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',        // DOM 测试；纯 Node 逻辑用默认 'node'
    globals: true,               // 免导入 describe/it（要配 tsconfig types）
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
    },
  },
})
```

DOM 环境需要装依赖：`bun add -d jsdom`。

---

## Matcher 速查

```ts
expect(value).toBe(3)                    // === （Object.is）
expect(obj).toEqual({ a: 1 })            // 深比较
expect(fn).toThrow()                     // 抛错
expect(list).toContain(2)                // 包含
expect(html).toMatch(/<div/)             // 正则/字符串匹配
expect(x).toBeNull() / toBeUndefined() / toBeTruthy() / toBeFalsy()
expect(x).toBeCloseTo(0.3)               // 浮点数比较，别用 toBe

// 异步
await expect(fetchUser()).resolves.toEqual({ id: 1 })
await expect(fetchUser()).rejects.toThrow('401')
```

---

## Mock 速查

```ts
import { vi, describe, it, expect } from 'vitest'

// 模拟整个模块
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'belos' }),
}))

// 部分模拟（保留其他导出）
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  fetchUser: vi.fn(),
}))

// 模拟时间（测"7 天后过期"这类逻辑）
vi.useFakeTimers()
vi.setSystemTime(new Date('2026-09-29'))
vi.useRealTimers()

// spy
const spy = vi.spyOn(obj, 'method')
expect(spy).toHaveBeenCalledWith('arg')
```

> 💡 原则：**mock 边界（网络、时间、随机），不 mock 被测逻辑内部**。mock 泛滥的测试等于没测。

---

## React 组件测试

```bash
bun add -d @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'

test('点击按钮后计数 +1', async () => {
  render(<Counter />)
  const btn = screen.getByRole('button', { name: /加一/i })   // 按可访问性角色查询
  await userEvent.click(btn)
  expect(screen.getByText('1')).toBeInTheDocument()
})
```

心法一句话：**像用户一样操作（找文本/角色 → 点/输入 → 断言可见结果），不断言实现细节**（class 名、state 内部值）。

> 💡 需要**真实浏览器环境**（Web Component、canvas、多标签页）时，Vitest 4 的 browser mode 已稳定，用 `browser.instances` 配置指定浏览器即可，不再依赖 jsdom 模拟。

---

## bun test 边界

**纯 Node 工具/脚本项目**（无 DOM、无组件）可以直接用 Bun 内置的 `bun test`——零配置、API 兼容 Jest、跑得飞快，与仓库 demo 约定（Bun 优先）天然一致。**组件测试、依赖 Vite 插件生态（alias/自动导入）的项目仍选 Vitest。**

---

## 常见踩坑

- **测纯函数也开了 jsdom** → 多余且慢，按文件注释 `// @vitest-environment node` 分流；批量分流用 `projects` 配置（Vitest 4 已移除旧的 `environmentMatchGlobs`）
- **mock 了模块但另一测试拿到真实现** → `vi.restoreAllMocks()` 放 `afterEach`，或 config 里 `unstubGlobals: true`
- **跨测试文件状态污染** → Vitest 每个文件默认独立 worker，文件内注意 `beforeEach` 重置
- **只测了快乐路径** → 每个函数至少：正常值 + 边界（0/空/极值）+ 异常路径
- **覆盖率 100% 但 bug 照出** → 覆盖率是"没测到的警报"，不是"测好了的证明"，断言质量 > 数量

---

## 边界说明

- 组件怎么跑起来（Vite 配置）→ [../vite/](../vite/readme.md)
- E2E（Playwright）→ 后续按需补一篇，本模块只覆盖单元/组件测试
- 面试向原理深挖（三种 mock 选型、hoisting 设计动机、mock 边界铁律）→ 两篇 doc 的面试节
