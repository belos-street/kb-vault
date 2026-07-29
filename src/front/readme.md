# Front — 前端技术知识体系

> 覆盖前端开发的核心技术栈，从语言基础到框架、工程化、可视化、跨端的完整知识图谱。

---

## 目录结构

```
front/
├── javascript/                    # JavaScript Web API（浏览器专属）
│   ├── dom/                       #   DOM 操作、事件模型、MutationObserver
│   ├── bom/                       #   BOM（history、location、navigator、storage）
│   ├── web-apis/                  #   Fetch、IntersectionObserver、Web Worker、WebSocket/SSE 等
│   └── wasm/                      #   WebAssembly（Go→WASM、前端应用场景）
│
├── css/                           # CSS 体系
│   ├── doc/
│   │   ├── 01-选择器与盒模型.md
│   │   ├── 02-布局体系（Flex/Grid/定位）.md
│   │   ├── 03-响应式与媒体查询.md
│   │   ├── 04-动画与过渡.md
│   │   ├── 05-CSS函数与自定义属性.md
│   │   ├── 06-原子化CSS（Tailwind/UnoCSS）.md
│   │   └── 07-CSS工程化（PostCSS/预处理器/CSS-in-JS）.md
│   └── readme.md
│
├── react/                         # React 生态（二级目录）
│   ├── hooks/                     #   ✅ Hooks 体系（已完成 7 篇）
│   ├── router/                    #   React Router / TanStack Router
│   ├── state-management/          #   Zustand / Jotai / Redux Toolkit / MobX
│   ├── data-fetching/             #   TanStack Query / SWR / RTK Query
│   ├── next/                      #   Next.js（App Router、RSC、Server Actions）
│   ├── patterns/                  #   设计模式（Compound、Render Props→Hooks、Suspense）
│   └── readme.md
│
├── vue/                           # Vue 生态（二级目录）
│   ├── core/                      #   响应式原理、组合式 API、生命周期
│   ├── router/                    #   Vue Router
│   ├── state-management/          #   Pinia
│   ├── nuxt/                      #   Nuxt 3（SSR/SSG）
│   └── readme.md
│
├── engineering/                   # 前端工程化
│   ├── bundler/                   #   Vite / Webpack / esbuild / Turbopack
│   ├── babel/                     #   Babel 编译原理、插件开发、AST
│   ├── lint/                      #   ESLint / Prettier / OxLint / Biome
│   ├── testing/                   #   Vitest / Jest / Testing Library / Playwright / Cypress
│   ├── monorepo/                  #   pnpm workspace / Turborepo / Nx / changesets
│   ├── cli/                       #   CLI 开发（react-ink、commander、inquirer、ora、chalk）
│   ├── security/                  #   前端安全（XSS/CSRF/CSP/SRI/Token存储策略）
│   ├── micro-frontend/            #   微前端（Module Federation / qiankun / single-spa）
│   └── readme.md
│
├── performance/                   # 前端性能优化
│   ├── doc/
│   │   ├── 01-性能指标与测量工具.md
│   │   ├── 02-加载性能（资源优化/预加载/CDN）.md
│   │   ├── 03-渲染性能（重排重绘/虚拟列表/合成层）.md
│   │   ├── 04-运行时性能（长任务/Worker/调度）.md
│   │   ├── 05-构建产物优化（分包/Tree-shaking/压缩）.md
│   │   └── 06-监控与持续优化（RUM/Lighthouse CI）.md
│   └── readme.md
│
├── ssr/                           # 服务端渲染与同构
│   ├── doc/
│   │   ├── 01-CSR-SSR-SSG-ISR渲染模式全景.md
│   │   ├── 02-Next.js-App-Router与RSC.md
│   │   ├── 03-Nuxt-3与Vue-SSR.md
│   │   ├── 04-流式渲染与Suspense.md
│   │   ├── 05-同构数据获取与状态注水.md
│   │   └── 06-SEO与元数据管理.md
│   └── readme.md
│
├── component-library/             # 组件库设计与实现
│   ├── doc/
│   │   ├── 01-组件库架构设计.md
│   │   ├── 02-样式方案（CSS变量/Token/主题）.md
│   │   ├── 03-无障碍与键盘交互.md
│   │   ├── 04-文档站与Playground.md
│   │   └── 05-发布与版本管理.md
│   └── readme.md
│
├── animation/                     # 动画（CSS + JS 驱动）
│   ├── doc/
│   │   ├── 01-CSS动画与过渡（补全css模块的动画篇）.md
│   │   ├── 02-GSAP时间线动画.md
│   │   ├── 03-Framer-Motion（React声明式动画）.md
│   │   ├── 04-React-Spring物理动画.md
│   │   └── 05-Lottie与SVG动画.md
│   └── readme.md
│
├── visual/                        # 可视化（二级目录）
│   ├── d3/                        #   ✅ D3.js（已完成 7 篇）
│   ├── konva/                     #   ✅ Konva（已完成 7 篇）
│   ├── pixi/                      #   ✅ PixiJS（已完成 9 篇）
│   ├── three/                     #   Three.js / WebGL
│   └── readme.md
│
├── cross-platform/                # 跨端技术（二级目录）
│   ├── electron/                  #   ✅ Electron（已完成 15 篇）
│   ├── react-native/              #   ✅ React Native（已完成 11 篇）
│   ├── taro/                      #   Taro / 小程序
│   └── readme.md
│
└── readme.md                      # 本文件
```

---

## 完成状态

| 模块 | 状态 | 篇数 | 备注 |
|------|:----:|:----:|------|
| react/hooks | ✅ 已完成 | 7 | 含面试模板 + 练习 |
| visual/d3 | ✅ 已完成 | 7 | 含可运行 demo |
| visual/konva | ✅ 已完成 | 7 | 含实战项目 |
| visual/pixi | ✅ 已完成 | 9 | 含飞机大战实战 |
| cross-platform/electron | ✅ 已完成 | 15 | 含 API 速查 |
| cross-platform/react-native | ✅ 已完成 | 11 | 含上架流程 |
| css | 🔲 待实现 | — | |
| javascript (Web API) | 🔲 待实现 | — | 含 DOM/BOM/WebSocket/SSE |
| javascript/wasm | 🔲 待实现 | — | WebAssembly |
| react/router | 🔲 待实现 | — | |
| react/state-management | 🔲 待实现 | — | |
| react/data-fetching | 🔲 待实现 | — | TanStack Query / SWR |
| react/next | 🔲 待实现 | — | |
| react/patterns | 🔲 待实现 | — | |
| vue/core | 🔲 待实现 | — | |
| vue/router | 🔲 待实现 | — | |
| vue/state-management | 🔲 待实现 | — | |
| vue/nuxt | 🔲 待实现 | — | |
| engineering/bundler | 🔲 待实现 | — | |
| engineering/babel | 🔲 待实现 | — | |
| engineering/lint | 🔲 待实现 | — | |
| engineering/testing | 🔲 待实现 | — | |
| engineering/monorepo | 🔲 待实现 | — | |
| engineering/cli | 🔲 待实现 | — | |
| engineering/security | 🔲 待实现 | — | XSS/CSRF/CSP |
| engineering/micro-frontend | 🔲 待实现 | — | Module Federation / qiankun |
| performance | 🔲 待实现 | — | |
| ssr | 🔲 待实现 | — | |
| component-library | 🔲 待实现 | — | |
| animation | 🔲 待实现 | — | GSAP / Framer Motion / React Spring |
| visual/three | 🔲 待实现 | — | |
| cross-platform/taro | 🔲 待实现 | — | |

---

## 不属于 front 的内容（建议归属）

以下内容与前端相关但更适合放在其他顶层分类中：

| 技术 | 建议目录 | 理由 |
|------|----------|------|
| JavaScript 语言核心（ES6+、异步、事件循环、FP） | `programming-languages/javascript/` | 纯语言特性，与浏览器无关，和 go/rust 同级 |
| TypeScript 类型系统 | `programming-languages/typescript/` | 语言级知识 |
| Bun / Node 运行时（HTTP server、文件 I/O、SQLite） | `programming-languages/javascript/` 或 `server/` | 运行时能力属于语言/后端范畴 |
| Bun / Node 作为前端工具（bundler、test runner、pkg manager） | `front/engineering/` 中顺带覆盖 | 在 Vite/Vitest 等文档中提及即可，无需独立模块 |
| 网络协议（HTTP/2/3、TCP、DNS） | `computer-science/networking/` 或 `deploy/network/` | 已有相关目录 |

---

## 文档格式规范

每个技术模块遵循统一结构（详见各模块 readme）：

```
{tech}/
├── doc/
│   ├── 01-xxx.md
│   ├── 02-xxx.md
│   └── ...
├── src/              # 可运行示例（可选）
└── readme.md         # 模块大纲 + 学习目标
```

**单篇文档结构**：

```markdown
# XX - 标题

> 对应大纲模块 X | 预计时间：X 天
> 面试可答：一句话总结

---

## 学习目标
## 核心概念（含完整可运行代码）
## 常见踩坑点
## 面试高频问题
## 面试回答模板（> **问：** 格式）
## 练习（要求 + 提示 + 预期效果）
## 本模块完成标准
```

---

## 学习路径建议

```
第一阶段（基础）：css → javascript (Web API) → react/hooks ✅
第二阶段（框架）：react/router → react/state-management → react/data-fetching → react/next
第三阶段（工程化）：engineering/bundler → engineering/lint → engineering/testing → engineering/monorepo
第四阶段（进阶）：performance → engineering/security → ssr → component-library
第五阶段（扩展）：vue → animation → visual → cross-platform → engineering/micro-frontend → engineering/cli
```
