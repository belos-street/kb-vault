# Vitest 核心与 Mock

> 对应大纲模块 1 | 预计时间：1 天
> 面试可答：vi.mock 的四个层次（fn/spy/模块/时间）+ hoisting 行为是 Vitest 实战的核心考点。
> 前置阅读：[../readme.md](../readme.md)（速查版）

---

## 学习目标

完成本篇后，你应该能够：

- 按需选用 vi.fn / spyOn / vi.mock 三种 mock 手段，并说清各自适用边界
- 解释 vi.mock 的 hoisting 行为，避开"工厂函数里引用外部变量"的经典坑
- 用 fake timers 测试"过期、节流"这类时间依赖逻辑

---

## 核心概念

### 1. 运行模型：测试文件即隔离单位

Vitest 按文件并行调度（默认每个测试文件一个独立 worker），所以：

- **文件间**天然隔离（不同进程/worker，互不污染）
- **文件内**所有测试共享同一模块注册表和全局状态——`beforeEach` 重置是你的责任

```
describe  →  测试分组（可嵌套，形成树）
it/test   →  最小执行单元
beforeAll / beforeEach / afterEach / afterAll → 生命周期钩子（作用域跟随所在 describe）
```

### 2. Matcher 分场景速查

```ts
// 相等与引用
expect(a).toBe(b)                 // Object.is（引用相等）
expect(a).toEqual(b)              // 深比较
expect(a).toStrictEqual(b)        // 深比较 + 区分 undefined/可选属性 + 检查 class

// 数值与字符串
expect(x).toBeCloseTo(0.3)        // 浮点专用，别用 toBe
expect(s).toMatch(/pattern/)
expect(s).toContain('sub')

// 集合与对象结构
expect(arr).toContain(item)
expect(obj).toMatchObject({ id: 1 })        // 部分匹配
expect(obj).toHaveProperty('a.b[0].c', 1)   // 路径取值断言

// 真值族
expect(x).toBeNull() / toBeUndefined() / toBeDefined() / toBeTruthy() / toBeFalsy()

// 异常（必须包在函数里，不能直接传值）
expect(() => fn()).toThrow('msg')
```

**异步断言**（漏 await 是静默失败的头号来源）：

```ts
await expect(fetchUser()).resolves.toEqual({ id: 1 })
await expect(fetchUser()).rejects.toThrow('401')

// 有断言的可回调（如事件回调、afterEach 里的清理）要用 expect.assertions
it('回调被调用一次', async () => {
  expect.assertions(1)
  await run(cb)
  expect(cb).toHaveBeenCalledWith('x')
})
```

### 3. Mock 的四个层次（由轻到重）

**① vi.fn —— 匿名函数替身**（测回调/依赖注入的参数）：

```ts
const cb = vi.fn()
run(cb)
expect(cb).toHaveBeenCalledTimes(1)
expect(cb).toHaveBeenCalledWith('x')

cb.mockReturnValueOnce(42)      // 一次性的返回值
cb.mockResolvedValue({ id: 1 }) // 异步返回
```

**② vi.spyOn —— 劫持已有对象的方法**（保留原实现能力的观察）：

```ts
const spy = vi.spyOn(cache, 'get').mockReturnValue(undefined)
// 默认仍走原实现；mockReturnValue 才替换。afterEach 恢复：spy.mockRestore()
```

**③ vi.mock —— 替换整个模块**（隔离外部边界）：

```ts
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'belos' }),
}))

// 部分模拟：保留其他导出，只换一个
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  fetchUser: vi.fn(),
}))
```

**④ fake timers —— 时间替身**：

```ts
vi.useFakeTimers()
it('token 7 天后过期', () => {
  vi.setSystemTime(new Date('2026-09-01'))
  const t = createToken()
  vi.setSystemTime(new Date('2026-09-10'))
  expect(isExpired(t)).toBe(true)
})
it('防抖只执行一次', async () => {
  debounced(); debounced(); debounced()
  vi.advanceTimersByTime(300)     // 推进时间而不是真等
  expect(fn).toHaveBeenCalledTimes(1)
})
```

### 4. vi.mock 的 hoisting：必须懂的坑

`vi.mock` 调用会被**提升到文件最顶部**（在所有 import 之前执行），所以：

```ts
// ❌ 报错：Cannot access '__mockUser' before initialization
const mockUser = vi.fn()
vi.mock('./api', () => ({ fetchUser: mockUser }))   // 工厂被提升时 mockUser 还没初始化

// ✅ 解法 1：工厂内自包含
vi.mock('./api', () => ({ fetchUser: vi.fn() }))
import { fetchUser } from './api'
// 使用处：vi.mocked(fetchUser).mockResolvedValue(...)

// ✅ 解法 2：vi.hoisted（与 vi.mock 一起提升）
const { mockUser } = vi.hoisted(() => ({ mockUser: vi.fn() }))
vi.mock('./api', () => ({ fetchUser: mockUser }))
```

配套习惯：用 `vi.mocked(fetchUser)` 获得类型完整的 mock 视角，编辑器里 `.mockResolvedValue` 有提示。

---

## 常见踩坑点

- **mock 状态跨用例泄漏** → `beforeEach` 里 `vi.restoreAllMocks()`，或 config 开 `unstubGlobals: true` / `unstubEnvs: true`
- **异步断言没 await** → 测试绿了但根本没断言；对回调场景用 `expect.assertions(n)` 兜底
- **测了 mock 而不是被测代码** → mock 了 `fetchUser` 又断言它的返回值，等于在测 mock 自己；mock 只替边界（网络/时间/随机），断言打在被测逻辑上
- **fake timers 忘了关** → `afterEach(() => vi.useRealTimers())`，否则后续用例的 setTimeout 永远不执行
- **只测快乐路径** → 每个函数三件套：正常值、边界（0/空/极值）、异常路径

---

## 面试高频问题

1. vi.fn / vi.spyOn / vi.mock 三者的区别与选择依据？
2. vi.mock 的 hoisting 行为是什么？为什么这样设计？
3. Vitest 的测试隔离模型？（文件级 vs 用例级）

## 面试回答模板

> **问：三种 mock 怎么选？**
> **答：** 看你有没有"拿到替身的引用"：能依赖注入或直接持有函数引用 → `vi.fn`；目标是真实存在的对象方法、且默认想保留原实现 → `vi.spyOn`；要隔离的是 import 边界（模块级）→ `vi.mock` 替换整个模块注册表。顺序上从轻到重：能用前两者就不要动模块——模块级 mock 影响该文件所有用例，恢复成本最高。

> **问：hoisting 为什么这样设计？**
> **答：** import 语句本身会被 JS 引擎提升，`vi.mock` 要在"被测代码 import 真模块"之前完成替换，就必须同样提升到 import 之前执行。代价是 mock 工厂运行时外部变量尚未初始化，于是有了 `vi.hoisted` 这个配套逃生口——它和 vi.mock 一起提升，专供"工厂需要引用 mock 函数"的场景。理解这一点后，"Cannot access before initialization" 类报错可以直接定位。

---

## 练习

1. **三层次连做**：写一个 `createOrder(payment, logger)`——用 vi.fn 替 payment、spyOn 替 logger.warn、vi.mock 替支付模块，分别触发三种 mock 的断言。
2. **hoisting 坑复现**：先写出"❌ 报错版"复现 Cannot access 错误，再用 vi.hoisted 修复，保留两个版本对照。
3. **时间测试**：实现一个防抖函数并测它（fake timers + advanceTimersByTime），覆盖"连续触发只执行一次、最后一次触发后 delay 才执行"。

**预期效果**：练习 2 后你对 hoisting 不再是背书而是见过现场；练习 3 是 fake timers 的标准应用。

---

## 本模块完成标准

- [ ] 能默写四种 mock 层次及选择顺序（轻 → 重）
- [ ] 能不看答案解释 hoisting + vi.hoisted
- [ ] 三个练习全部跑绿
