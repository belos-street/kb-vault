# CLI 开发 — 大纲与速查

> 定位：**工具速查 + 快速上手**。常用库一张表、一个最小可运行脚手架，讲怎么用不深挖原理。
> 场景：脚手架（create-xxx）、发布工具、本地研发工具链。全部基于 Node/Bun 运行时。
> 参考：[commander](https://github.com/tj/commander.js) · [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js) · [ora](https://github.com/sindresorhus/ora) · [picocolors](https://github.com/alexeyraspopov/picocolors) · [ink](https://github.com/vadimdemedes/ink) · [@clack/prompts](https://github.com/bombshell-dev/clack)

***

## 学习目标

完成本模块后，你应该能够：

- 按"解析 → 交互 → 渲染 → 执行"四层给 CLI 场景选对库
- 从零写出一个可全局安装、可发布的脚手架 CLI
- 判断"该用 ink 了"还是"inquirer 就够了"

## 篇目

| 篇 | 内容 | 定位 |
| -- | ---- | ---- |
| [01-CLI库全景与选型](doc/01-CLI库全景与选型.md) | 四层职责模型 + 各层库对比与选型判断 | 概念 + 选型 |
| [02-脚手架实战](doc/02-脚手架实战.md) | 从零到可发布的完整脚手架（bin/link/模板渲染/发布） | 实战 |
| [src/scaffold-demo](src/scaffold-demo/package.json) | 可运行最小脚手架，`bun link` 后全局可用 | 示例 |

***

## 库选型速查

| 职责 | 库 | 一句话点评 |
| ---- | -- | --------- |
| 参数解析 | **commander** | 事实标准，声明式定义命令/选项 |
| 参数解析（轻量） | cac | vue-cli 在用，更省事 |
| 交互式问答 | **@inquirer/prompts** | 新版 inquirer，按需导入 select/input/confirm |
| 交互式问答（更轻更美） | @clack/prompts | create-astro 等新一代脚手架在用，API 简洁、观感好 |
| 加载动画 | **ora** | spinner，一行搞定 |
| 颜色 | **picocolors** | 比 chalk 轻（chalk 也常用，功能更全） |
| 终端 UI 框架 | **ink** | 用 React 组件写 CLI 界面（如 Claude Code 风格的交互） |
| 子进程 | execa | 替代 child_process，Promise 化 |
| shell 脚本 | zx | JS 版 bash，写运维脚本舒服 |
| 文件遍历 | globby | glob 匹配文件 |

> 💡 起手式就四个：**commander + @inquirer/prompts + picocolors + ora**，覆盖 90% 场景。

---

## 快速上手：30 行拼一个脚手架

```bash
bun add commander @inquirer/prompts picocolors ora
```

```ts
// src/cli.ts
#!/usr/bin/env bun
import { Command } from 'commander'
import { input, select } from '@inquirer/prompts'
import pc from 'picocolors'
import ora from 'ora'

const program = new Command()

program
  .name('my-create')
  .description('项目脚手架')
  .version('0.1.0')
  .argument('[name]', '项目名')
  .option('-t, --template <tpl>', '指定模板，跳过询问')
  .action(async (name, opts) => {
    const projectName = name ?? (await input({ message: '项目名叫什么？' }))
    const template =
      opts.template ??
      (await select({
        message: '选个模板',
        choices: [
          { value: 'react', name: 'React + Vite' },
          { value: 'vue', name: 'Vue + Vite' },
        ],
      }))

    const spinner = ora('生成中...').start()
    // 这里做真实工作：拉模板、渲染变量、写文件
    await new Promise(r => setTimeout(r, 1000))
    spinner.succeed(`完成！cd ${projectName} && bun install`)

    console.log(pc.cyan(`模板：${template}`))
  })

program.parse()
```

```bash
bun run src/cli.ts my-app        # 带名字直接跑
bun run src/cli.ts               # 不带名字进入交互
```

---

## 让命令全局可用

```jsonc
// package.json —— bin 字段把包名映射到可执行文件
{
  "name": "my-create",
  "bin": { "my-create": "./dist/cli.js" }
}
```

```bash
# 本地调试：把当前包软链到全局
bun link          # 或 npm link；之后任意目录敲 my-create 即可
bun unlink        # 解除
```

> 首行的 `#!/usr/bin/env bun`（shebang）决定用什么运行时执行；发布到 npm 后用户 `bun add -g` 或 `npx` 即可用。

---

## commander 选项速查

```ts
program
  .option('-d, --dry-run')                 // 布尔开关 → opts.dryRun === true
  .option('-p, --port <number>', '端口', '3000')   // 必填值 + 默认值
  .option('--tag [name]', '可选值')          // 值可选
  .requiredOption('--env <env>', '必填')     // 缺了直接报错
  .command('add <pkg>')                     // 子命令：my-create add zod
  .alias('a')
  .description('安装依赖')
```

---

## 什么时候用 ink

命令有**持续交互界面**（选择列表实时过滤、进度面板、聊天式输入）→ 用 ink，直接写 React 组件，状态驱动渲染：

```tsx
import React from 'react'
import { render, Text, Box } from 'ink'

const App = () => (
  <Box flexDirection="column">
    <Text color="green">✔ 构建完成</Text>
    <Text dimColor>按 q 退出</Text>
  </Box>
)

render(<App />)
```

一次性问答式流程（问几个问题然后干活）→ 用上面的 `@inquirer/prompts` 就够，别杀鸡用牛刀。

---

## 常见踩坑

- **Windows 下 bin 脚本不执行** → 确认有 shebang 且 npm/bun 的 shim 生成正常；路径分隔符用 `path.join`，别手拼 `/`
- **stdout 被 CI 管道吞了颜色** → picocolors 自动检测 TTY；要强制彩色设 `FORCE_COLOR=1`
- **交互问答在 CI 卡死** → 入口处判断 `process.env.CI`，CI 环境要求参数全显式传入、跳过询问
- **Node 用户跑不动 shebang 为 bun 的脚本** → 对外发布的 CLI 首行用 `#!/usr/bin/env node` 最保险，Bun 语法按 Node 兼容子集写
- **解析时把 `--` 后的参数吃了** → commander 会透传 `--` 之后的内容，用于 `my-create -- some --weird --args`

***

## 边界说明

- 包发布与版本管理 → [../monorepo/](../monorepo/readme.md)（changesets 一节）
- 构建单文件产物（bun build --compile）→ Bun 官方文档
- 面试向原理深挖 → [doc/01](doc/01-CLI库全景与选型.md) / [doc/02](doc/02-脚手架实战.md) 的面试节
