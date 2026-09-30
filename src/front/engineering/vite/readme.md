# Vite — 速查与快速上手

> 定位：**工具速查**。会创建项目、会改配置、知道底层谁在干活，就够了。不深入源码与原理推导。
> 版本口径：Vite 8（Rolldown 唯一引擎，验证时间：2026-09）。以 [官方文档](https://vite.dev/) 为准。

***

## 学习目标

完成本模块后，你应该能够：

- 画出 dev（按需转译 + HMR）与 build 两条工作流，说清"为什么 dev 快"
- 独立写出一个 transform / 虚拟模块插件，理解 Rollup 兼容钩子与 Vite 专属钩子分工
- 按 Vite 8 迁移对照表（advancedChunks / rolldownOptions）完成老项目升级

## 篇目

| 篇 | 内容 | 定位 |
| -- | ---- | ---- |
| [01-Vite核心工作流](doc/01-Vite核心工作流.md) | dev/build 双链路 + 日常四件事 + 分包缓存策略 | 教学 |
| [02-底层引擎与插件生态](doc/02-底层引擎与插件生态.md) | Rolldown 统一动机 + 三层插件钩子（含手写插件）+ babel 退休 + 迁移对照 | 教学 |

***

## 30 秒理解 Vite

| 阶段 | 干什么 | 靠谁干活 |
| ---- | ------ | -------- |
| Dev | 不打包，按需编译：浏览器请求哪个模块就编译哪个（原生 ESM）+ 依赖预构建 | Rolldown + oxc |
| Build | 打包成静态产物（HTML/JS/CSS 分包） | Rolldown（CSS 压缩用 Lightning CSS） |

核心卖点：**dev 冷启动秒开**（不用等整个依赖图打包完）+ HMR 毫秒级。

---

## 快速上手

```bash
# 创建项目（交互式选框架模板）
bun create vite my-app

# 常用模板：react / react-swc / vue / vanilla / vue-ts / react-ts
# 安装 & 启动
cd my-app
bun install
bun run dev        # 开发服务器，默认 http://localhost:5173
bun run build      # 产物输出到 dist/
bun run preview    # 本地预览 build 产物
```

项目结构（React 模板）：

```
my-app/
├── index.html          # 入口（不是 src/main.tsx！Vite 以 html 为入口）
├── vite.config.ts      # 配置文件
└── src/
    └── main.tsx
```

---

## vite.config.ts 速查

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],

  // 路径别名（TS 侧需在 tsconfig.json 的 paths 同步配置）
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },

  server: {
    port: 5173,
    proxy: {
      // 前端请求 /api → 转发到后端，解决本地跨域
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: p => p.replace(/^\/api/, ''),  // 需要去前缀时打开
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,          // 生产一般关，排查问题再开
    target: 'es2020',
    rollupOptions: {
      output: {
        // 分包（Vite 8 / Rolldown）：advancedChunks 替代了旧 manualChunks
        advancedChunks: {
          groups: [
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
```

### 环境变量

```bash
# .env.development / .env.production
VITE_API_BASE=https://api.example.com   # 必须 VITE_ 前缀才会暴露给前端
```

```ts
// 使用（有类型提示需在 src/vite-env.d.ts 补 ImportMetaEnv 声明）
const base = import.meta.env.VITE_API_BASE
```

> ⚠️ `VITE_` 前缀变量会打进客户端产物，**不要放密钥**。服务端专用变量放 `server/` 侧代码读取。

---

## 底层引擎一页看懂（Vite 8 = Rolldown 时代）

| 工具 | 语言 | 在 Vite 里的职责 | 现状 |
| ---- | ---- | ---------------- | ---- |
| Rolldown | Rust | **唯一内置引擎**：dev 转译/依赖预构建 + 生产打包，兼容 Rollup 插件 API | Vite 8 起默认 |
| oxc | Rust | Rolldown 的 parser / transformer（oxlint/oxfmt 同源） | 内置 |
| Lightning CSS | Rust | CSS 压缩 / 转换 | Vite 8 内置 |
| esbuild | Go | 旧版 dev 引擎 | 已退出 |
| Rollup | JS | 旧版生产引擎 | 被 Rolldown 取代，插件 API 仍兼容 |

一句话：**Vite 8 完成了"换引擎不换 API"——Rolldown 接管 esbuild + Rollup，`rolldown-vite` 只是历史迁移中间产物，新项目直接用 Vite 8 即可**。配置迁移对照：`optimizeDeps.esbuildOptions` → `optimizeDeps.rolldownOptions`，`build.rollupOptions.output.manualChunks` → `advancedChunks`。

---

## babel 还需要吗？（已退休）

**结论：作为"必学工具"已退休，降级为了解即可。**

| babel 的旧职责 | 现在谁接管 |
| -------------- | ---------- |
| TS/JSX 转译 | oxc（Rolldown 内置），比 babel 快两个数量级 |
| React HMR（fast refresh） | `@vitejs/plugin-react` v6+ 用 Oxc 做 Refresh 转换，**零 babel 依赖**（`plugin-react-swc` 已无存在必要） |
| Polyfill 注入 | `@vitejs/plugin-legacy`（内部用 core-js，面向兼容旧浏览器的场景） |
| React Compiler（实验性） | 经 `reactCompilerPreset` + `@rolldown/plugin-babel` 显式 opt-in，按需引入 |
| AST / 插件 / codemod | **babel 仍占优**——写自定义 AST 转换、codemod、ESLint 规则时还是它生态最全 |

新建项目零配置即可，只有"写 AST 工具"或"维护老 Webpack 项目"时才需要回头学 babel。

---

## 常用插件速查

| 插件 | 用途 |
| ---- | ---- |
| `@vitejs/plugin-react` | React 官方支持（JSX + fast refresh） |
| ~~`@vitejs/plugin-react-swc`~~ | 已退役：plugin-react v6+ 零 babel（Oxc 做 Refresh），差异点消失，存量迁移时移除即可 |
| `@vitejs/plugin-vue` | Vue 3 SFC 支持 |
| `@vitejs/plugin-legacy` | 旧浏览器兼容（自动 polyfill + 双份产物） |
| `vite-plugin-checker` | 在 dev 里跑 TS/lint，错误直接显示在浏览器 overlay |
| `@module-federation/vite` | 微前端 Module Federation（MF 2.0 官方插件，见 [micro-frontend](../micro-frontend/readme.md)） |
| `unplugin-auto-import` / `unplugin-vue-components` | 自动导入（Vue 生态常用） |

---

## 常见踩坑

- **改了 vite.config.ts 不生效** → dev server 会自动重启，但 env 文件（.env）改动需要手动重启
- **alias 前端能跑，TS 报红** → tsconfig.json 的 `compilerOptions.paths` 没同步
- **依赖预构建报错** → 用 `optimizeDeps.include` 显式声明，或 `exclude` 排除；改完删 `node_modules/.vite` 缓存
- **老配置迁移报错** → `manualChunks`（对象/函数形式）在 Vite 8 已移除，改 `advancedChunks`；`esbuildOptions` 类配置改 `rolldownOptions`
- **动态导入变量拼接失败** → `import(\`./locales/${lang}.ts\`)` 要求前缀必须是字面量路径，且文件真实存在（Vite 用 glob 分析）
- **build 后白屏** → 大概率 base 路径问题（部署在子路径需配 `base: '/sub-path/'`）

---

## 边界说明

- 测试（Vitest）→ [../testing/](../testing/readme.md)
- Lint / Format（oxlint + oxfmt）→ [../oxc/](../oxc/readme.md)
- 产物部署、CDN、CI → `src/deploy/`
- 面试向原理深挖（dev 为什么快、HMR 原理、Rolldown 统一双引擎、虚拟模块插件）→ 两篇 doc 的面试节
