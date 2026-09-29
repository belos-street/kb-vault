# Engineering — 前端工程化

> **定位声明**：本模块覆盖 **JS 生态工程化**——构建、质量、协作、交付的工具链，含跑在终端的 Node 侧工具与 CLI 开发。
> 一句话边界：**跑在终端、不跑在服务端**的 JS 工具知识都在这里。
>
> 文档口径：**readme 为速查**（30 秒理解 → 快速上手 → 速查表 → 踩坑），**doc/ 为教学篇**（学习目标 → 核心概念 → 踩坑 → 面试 → 练习，含面试节与可运行 demo）。均讲怎么用，不深挖原理。

***

## 模块一览

| 模块                                        | 定位                 | 状态    |
| ----------------------------------------- | ------------------ | ----- |
| [vite/](vite/readme.md)                   | 构建工具 + 底层引擎（Rolldown/oxc、babel 退休说明） | ✅ 完成（2 篇）        |
| [oxc/](oxc/readme.md)                     | lint（oxlint）+ format（oxfmt）+ 插件编写        | ✅ 完成（2 篇）        |
| [testing/](testing/readme.md)             | Vitest（核心/Mock + 组件测试与策略）                 | ✅ 完成（2 篇）        |
| [monorepo/](monorepo/readme.md)           | pnpm workspace + Turborepo + changesets  | ✅ 完成（2 篇）        |
| [cli/](cli/readme.md)                     | CLI 开发（commander/inquirer/ora/ink）       | ✅ 完成（2 篇 + demo） |
| [micro-frontend/](micro-frontend/readme.md) | 微前端选型 + MF/qiankun 实战                | ✅ 完成（3 篇）        |

***

## 快速上手路径

```
第一次搭项目：vite → oxc → testing          （三角基线：构建 + 质量 + 测试）
多包/发布：monorepo                          （仓库变大再加）
做内部工具：cli                             （给团队造轮子）
接老系统/多团队协作：micro-frontend           （最后再考虑，能不上就不上）
```

***

## 与其他分类的边界

| 主题 | 归属 | 说明 |
| ---- | ---- | ---- |
| XSS / CSRF / CSP / CORS / 安全响应头 / 供应链安全 | `computer-science/security/`（04、07 篇） | **不重复建 security 模块**。CS security 讲原理与全栈攻防；工程化侧只在 CI/构建配置里顺带引用 |
| JavaScript 语言核心（异步、事件循环、FP） | `programming-languages/javascript/` | 语言特性不属于工程化 |
| Node/Bun 运行时 API（HTTP server、文件 I/O） | `programming-languages/javascript/` 或 `server/` | 运行时能力不是工具链 |
| HTTP 服务端框架、中间件 | `server/` | 服务端开发与 CLI 开发分工明确：CLI 是终端工具，server 是常驻服务 |
| 部署、CDN、CI 流水线 | `deploy/` | 产物出了 dist/ 之后的事 |

***

## 版本口径

各模块 readme 头部标注验证时间（如"验证时间：2026-09"）。工具链迭代快，**以官方文档为准**；发现过时内容按 front/readme.md 的流程修订。
