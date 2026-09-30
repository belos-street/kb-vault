# 微前端 — 大纲与速查

> 定位：**工具速查 + 快速上手**。方案选型一张表 + 两个最小接入示例 + 核心问题对策。
> 版本口径：验证时间 2026-09，以各方案官方文档为准。

***

## 学习目标

完成本模块后，你应该能够：

- 按决策树在 MF / qiankun / wujie / micro-app 中做选型，并给出"上/不上"的判断
- 跑通 Module Federation 与 qiankun 的最小接入
- 对样式隔离、JS 沙箱、公共依赖、通信四大问题给出对策

## 篇目

| 篇 | 内容 | 定位 |
| -- | ---- | ---- |
| [01-微前端全景与选型](doc/01-微前端全景与选型.md) | 问题本质 + 原理谱系 + 决策树 + 劝退信号 | 概念 + 选型 |
| [02-Module-Federation实战](doc/02-Module-Federation实战.md) | @module-federation/vite 双应用接入 + shared 协商 | 实战 |
| [03-qiankun实战](doc/03-qiankun实战.md) | 主子应用接入 + 沙箱原理 + 样式隔离 + 通信 | 实战 |

***

## 30 秒理解

把一个大前端应用拆成多个**独立开发、独立部署**的子应用，运行时拼在一个壳里。

**真实适用场景**（满足越多越值得上）：

- 多团队并行开发同一门户/工作台，发布互不阻塞
- 子应用技术栈不同（React 老系统 + Vue 新模块）或无法重构合并
- 需要灰度/按需加载"插件式"功能模块

**不建议上的信号**：团队小、技术栈统一、能在一个仓库里模块化解决 → 直接用**路由分模块 + npm 包共享**就好。微前端的复杂度（样式冲突、沙箱逃逸、公共依赖版本地狱）常年超过它带来的好处。

---

## 方案选型速查

| 方案 | 原理 | 隔离能力 | 上手成本 | 适用 |
| ---- | ---- | ------- | ------- | ---- |
| **Module Federation** | 构建期声明"导出/导入"模块，运行时按需加载共享 | 弱（共享运行时，无沙箱） | 中 | 技术栈统一、追求性能与依赖共享 |
| **qiankun** | 基于 single-spa，HTML 入口 + Proxy 沙箱 | 强（JS 沙箱 + 样式隔离） | 低 | React/Vue 混合、老系统接入 |
| **wujie** | iframe（JS 隔离）+ Web Component（渲染） | 最强（iframe 级 JS 隔离） | 低 | 强隔离诉求（第三方/不可信子应用） |
| **micro-app** | Web Component 封装 | 较强 | 低 | 像"用组件一样用子应用" |
| **single-spa** | 元框架：生命周期注册与调度 | 无（只管调度） | 中 | 被上面几层封装，一般不直接用 |

> 💡 2026 视角：**技术栈统一的新项目优先 Module Federation**（`@module-federation/vite` 官方插件，MF 2.0；Rolldown 已把 MF 列为原生能力方向）；**存量多栈系统选 qiankun 或 wujie**——注意 qiankun npm 上的 2.x 已多年停滞，3.0 处于 RC 阶段，选型前确认实际维护状态。一次只选一个，别混。

---

## 最小示例 ①：Module Federation（@module-federation/vite）

> 用官方维护的 `@module-federation/vite`（MF 2.0），**不要再用已停更的 `@originjs/vite-plugin-federation`**。完整讲解见 [doc/02](doc/02-Module-Federation实战.md)。

```bash
bun add @module-federation/vite   # 主/子应用都装
```

```ts
// 子应用（提供方）vite.config.ts
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/Button.tsx',   // 暴露的模块
      },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
  ],
})
```

```ts
// 主应用（消费方）vite.config.ts
federation({
  name: 'host',
  remotes: {
    // 格式："本地引用名@remoteEntry 地址"（@ 前须与子应用 name 一致）
    remote: 'remote@https://remote.example.com/assets/remoteEntry.js',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
})
```

```tsx
// 主应用里像 import 本地模块一样用（配 lazy + Suspense）
const RemoteButton = React.lazy(() => import('remote/Button'))

<Suspense fallback="加载中...">
  <RemoteButton />
</Suspense>
```

---

## 最小示例 ②：qiankun

完整讲解（含子应用改造与沙箱原理）见 [doc/03](doc/03-qiankun实战.md)。

```bash
bun add qiankun
```

```ts
// 主应用：注册子应用
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'vue-app',
    entry: '//localhost:7101',        // 子应用地址
    container: '#subapp-container',   // 挂载容器
    activeRule: '/vue-app',           // 路由命中时激活
  },
])

start({ sandbox: true })   // 默认开 JS 沙箱
```

```ts
// 子应用：导出三个生命周期（Vue/React 通用，public-path 处理按官方模板）
export async function bootstrap() {}
export async function mount(props) {
  app.mount(props.container)
}
export async function unmount() {
  app.unmount()
}

// 独立运行时也要能自己启动（本地直开）
if (!window.__POWERED_BY_QIANKUN__) {
  mount({ container: '#app' })
}
```

---

## 四大核心问题对策速查

| 问题 | 对策 |
| ---- | ---- |
| **样式冲突** | 子应用样式加前缀/命名空间（postcss-prefix）、CSS Modules；qiankun 开 `strictStyleIsolation`（Shadow DOM，代价大需评估） |
| **JS 全局污染** | qiankun/wujie 沙箱自动处理；MF 方案靠约定（不用 window 存状态） |
| **公共依赖重复** | MF 用 `shared` 声明单例；qiankun 场景尽量 externals + CDN 共享 |
| **应用间通信** | 首选 URL 参数；qiankun 用 `initGlobalState`（共享事件总线）；避免大对象频繁同步 |
| **路由** | 主应用管"前缀分发"，子应用管自己前缀内的路由；history 模式注意各应用 base 配置 |

---

## 常见踩坑

- **MF 共享依赖版本不一致白屏** → `shared` 里配 `singleton: true` + `requiredVersion`，主/子用同一大版本
- **qiankun 子应用图片/字体 404** → 子应用入口是 HTML 抓取，相对路径会基于主应用域名解析；动态 publicPath 或改绝对地址
- **Shadow DOM 里 React 事件丢失** → 事件绑定在 document 上，Shadow DOM 隔离后收不到；用 `strictStyleIsolation` 前先查组件库兼容性
- **子应用独立跑正常，进主应用就挂** → 八成是 webpack/vite 的 `base` 和 `publicPath` 没按主应用前缀调整
- **调试困难** → 每个子应用保留独立启动入口（能脱离主应用跑），是排障的生命线

***

## 边界说明

- 构建与共享依赖的底层（Vite 插件）→ [../vite/](../vite/readme.md)
- 多团队的仓库组织 → [../monorepo/](../monorepo/readme.md)
- 部署与网关（子应用域名/CDN/灰度）→ `src/deploy/`
- 面试向原理深挖 → [doc/01](doc/01-微前端全景与选型.md) / [doc/02](doc/02-Module-Federation实战.md) / [doc/03](doc/03-qiankun实战.md) 的面试节
