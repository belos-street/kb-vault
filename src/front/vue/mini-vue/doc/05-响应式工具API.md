# 05 - 响应式工具 API

> 对应大纲模块 05（核心层 · 速过） | 预计时间：1 天
> 面试可答：shallow 系列用「放弃深层响应」换性能；toRef/toRefs 让属性引用保持响应式连接；markRaw 用跳过标记豁免代理。

---

## 定位与使用方式

本篇是**速查篇**，不走 01~04 的「测试先行 → 实现 → 对照源码」精讲节奏，而是逐组给「签名 + 最小示例 + 语义 + 踩坑」，随用随查。

> 示例统一按 `vue` 官方语义书写（可直接 `import { shallowRef } from 'vue'` 对拍验证）。mini-vue 侧的现状与扩展指引见 §7：`isReactive` / `isRef` 已在 04 篇落地并有测试基线，其余为可选扩展。

---

## 速查总表

| API | 一句话语义 | 触发时机 | 典型场景 |
| --- | --- | --- | --- |
| `shallowReactive` | 只代理第一层 | 仅第一层读写触发 | 大型配置对象 |
| `shallowRef` | 只追踪 `.value` 整体替换 | value 赋值 / `triggerRef` | 大数组、外部状态 |
| `readonly` | 深层只读代理 | 写被拦截并告警 | 全局配置、props 传导 |
| `shallowReadonly` | 仅第一层只读 | 第一层写拦截 | 只暴露根级接口 |
| `toRef(obj, key)` | 属性 → 保持连接的 ref | 读写互通原属性 | 解构单个属性 |
| `toRefs(obj)` | 全属性批量 toRef | 同上 | composable 返回值 |
| `toValue` | ref / getter / 值 → 裸值 | — | 归一化参数（3.3+） |
| `markRaw` | 打 skip 标记豁免代理 | 永不触发 | 第三方类实例 |
| `effectScope` | 批量收集并统一 stop | `scope.stop()` | 组件作用域清理 |
| `isReactive` / `isReadonly` / `isShallow` / `isProxy` / `isRef` | 类型判断 | — | 库代码、调试 |

---

## 1. shallow 系列：拿「深层响应」换性能

```ts
import { shallowReactive, shallowRef, triggerRef } from 'vue'

const state = shallowReactive({ foo: 1, nested: { bar: 2 } })
state.foo++                // ✅ 触发：第一层被代理
state.nested.bar++         // ❌ 不触发：nested 读出来是原始对象
state.nested = { bar: 3 }  // ✅ 触发：替换的是第一层属性

const list = shallowRef([1, 2, 3])
list.value.push(4)                // ❌ 不触发：value 内部没有深层代理
list.value = [...list.value, 4]   // ✅ 触发：value 整体替换
triggerRef(list)                  // ✅ 强制触发（不想复制大数组时的逃生门）
```

要点：

- 01~04 实现的 deep reactive 每次读取都要「判断是否对象 → 转 reactive → track」，shallow 直接砍掉这一整段递归——大列表、大对象的读写成本显著下降
- `shallowRef` + **整体替换**是官方推荐的大列表姿势之一；配合 `triggerRef` 可以不复制数组强行通知

---

## 2. readonly 系列：只读视图

```ts
import { readonly, shallowReadonly, isReadonly } from 'vue'

const original = { foo: 1, nested: { bar: 2 } }
const ro = readonly(original)
ro.foo = 2         // dev 下告警「Set operation on key 'foo' failed」；值不变
ro.nested.bar = 3  // 深层同样只读（readonly 是深层语义）
isReadonly(ro)     // true

const root = shallowReadonly({ a: 1, nested: { b: 2 } })
root.a = 9         // ❌ 拦截
root.nested.b = 9  // ✅ 可以改：只拦第一层
```

要点：

- `readonly` 可以包普通对象也可以包已代理对象，返回的只读代理与原对象**不是**同一引用（`isProxy` 为 true）
- 典型场景：全局配置注入、把响应式状态以「可读不可写」口径交给下游

---

## 3. toRef / toRefs / toValue：保持连接的引用

```ts
import { reactive, toRef, toRefs, toValue } from 'vue'

const state = reactive({ x: 1, y: 2 })

const x = toRef(state, 'x')
x.value++        // state.x 同步变为 2，且触发依赖 state.x 的 effect
state.x = 10     // x.value 同步为 10 —— 双向互通

// 解构不丢响应式的标准姿势
const { x: rx, y: ry } = toRefs(state)

// composable 返回值的惯例写法
function usePos() {
  const pos = reactive({ x: 0, y: 0 })
  return toRefs(pos) // 调用方解构后依然是 ref
}

// toValue：归一化「值 / ref / getter」三种入参
toValue(1)                       // 1
toValue(toRef(state, 'x'))       // 10
toValue(() => state.y)           // 2（getter 会被调用）
```

要点：

- `toRef` 的价值在「连接」：ref 的读写直接落到原属性上，响应性由原属性（reactive/ref）承担
- 对**非响应式**普通对象做 `toRef`：读写仍会同步，但没有响应性（改了不触发）——别指望它点石成金
- `toRefs` 要求入参是响应式对象，否则失去意义

---

## 4. 判断系列：ReactiveFlags 一览

```ts
import { reactive, readonly, shallowReactive, isReactive, isReadonly, isShallow, isProxy } from 'vue'

const s = reactive({ a: 1 })
isReactive(s)                  // true
isReadonly(s)                  // false
isProxy(s)                     // true —— isProxy = isReactive || isReadonly
isProxy(readonly({}))          // true
isShallow(shallowReactive({})) // true
isReactive({ a: 1 })           // false —— 原始对象直接读 flag 得 undefined
```

原理回顾（04 篇）：判断函数不遍历、不检查原型链，就是读一个特殊的字符串 key（如 `__v_isReactive`），Proxy 的 get 拦截器开头短路返回 `true`；原始对象上没有这个属性，返回 `undefined` 落到 false。

---

## 5. markRaw：豁免代理

```ts
import { reactive, markRaw } from 'vue'

class Chart { /* 第三方重量级实例 */ }
const chart = markRaw(new Chart())

const state = reactive({ chart })
state.chart === chart // true：读出来就是原始实例，不会被转代理
```

要点：

- 原理：`markRaw` 在对象上打 `__v_skip` 标记，reactive 的 get 拦截看到 skip 就**不再转代理**
- 场景：① 第三方类实例（echarts、地图、编辑器）——代理化可能破坏其内部逻辑且毫无收益；② 性能敏感的大型不可变数据
- 踩坑：对「已经是代理」的对象补 `markRaw` 无效（它已经不是原始对象了）；标记要在**进响应式体系之前**打

---

## 6. effectScope：批量停止

```ts
import { effectScope, ref, computed, watch } from 'vue'

const counter = ref(0)

const scope = effectScope()
scope.run(() => {
  const doubled = computed(() => counter.value * 2)
  watch(counter, () => console.log(counter.value))
  // 期间创建的 effect/computed/watch 全部被 scope 收集
})
scope.stop() // 一键全部停止，无需逐个持有 runner/stop 函数
```

mini-vue 落地指引（可选扩展，不在 32 条测试基线内；04 篇地基已备齐）：

```ts
// 伪代码级别指引：真实版还有 detached、parent 链、onScopeDispose
let activeEffectScope: EffectScope | undefined

export class EffectScope {
  effects: ReactiveEffect[] = []
  active = true

  run<T>(fn: () => T): T | undefined {
    const prev = activeEffectScope
    activeEffectScope = this
    try {
      return fn()
    } finally {
      activeEffectScope = prev // 栈式恢复，支持嵌套 scope
    }
  }

  stop() {
    this.effects.forEach((e) => e.stop())
    this.active = false
  }
}

// ReactiveEffect 首次 run 时登记：
// if (activeEffectScope?.active) activeEffectScope.effects.push(this)
```

04 篇的 `active` 守卫 + `cleanupEffect` 让 `stop()` 可以独立调用——scope 只是把「逐个 stop」升级成「收集 + 批量 stop」。

---

## 7. mini-vue 侧现状与扩展

| API | mini-vue 现状 |
| --- | --- |
| `isReactive` / `isRef` | ✅ 04 篇已实现（测试基线内） |
| `unref` / `proxyRefs` | ✅ 04 篇已实现 |
| `shallow` 系列 / `readonly` 系列 / `markRaw` | 可选扩展：ReactiveFlags 加 `IS_READONLY` / `IS_SHALLOW` / `SKIP` 三个 key，照 04 篇的 flag 短路模式各加几行 |
| `toRef` / `toRefs` / `toValue` | 可选扩展：基于 `RefImpl` 与已有 reactive 组合，无内核改动 |
| `effectScope` | 可选扩展：按 §6 指引，不改内核既有行为 |

> 判断是否扩展的标尺：面试要能讲语义（本篇足够），内核要能写主线（01~04 已覆盖）——扩展项动手前先问自己「它是否加深了我对依赖收集的理解」，否则随用随查即可。

---

## 练习

**要求 + 提示 + 预期效果**：不改动 01~04 的测试基线，新写一个 `misc.spec.ts`（用 `vue` 包或自研扩展均可）对拍三组行为——① `shallowRef`：push 不触发、整体替换触发、`triggerRef` 补救触发；② `toRefs`：解构出的 ref 改动会同步原 reactive 对象且触发依赖它的 effect；③ `markRaw`：放进 reactive 后读出的是原始实例。全部通过后，口头解释每条「为什么」，尤其 ① 里三种触发路径的差异。

---

## 对照源码（关键文件）

| 主题 | vuejs/core 位置 |
| --- | --- |
| shallow / readonly handler 变体、ReactiveFlags 完整定义 | `packages/reactivity/src/baseHandlers.ts`、`reactive.ts` |
| shallowRef / triggerRef / toRef / toRefs / toValue | `packages/reactivity/src/ref.ts` |
| markRaw（`__v_skip`） | `packages/reactivity/src/reactive.ts` |
| EffectScope / detached / onScopeDispose | `packages/reactivity/src/effectScope.ts` |

> 对照入口：[vuejs/core/packages/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity)

---

## 本篇完成标准

- [ ] 三组对拍行为全部通过，能解释 shallow 的三种触发路径
- [ ] 能说出 toRefs 解决的问题与 composable 惯用法
- [ ] effectScope 语义能复述，mini-vue 落地思路能讲清（实现可选）
- [ ] 面试可答：`ref vs shallowRef`、`reactive vs shallowReactive`、`markRaw 什么时候用`
