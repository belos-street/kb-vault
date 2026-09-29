# oxc — oxlint + oxfmt 速查

> 定位：**工具速查**。怎么装、怎么配、怎么写插件，一页够用。
> oxc 是 Rust 写的 JS 工具链，`oxlint` 替代 ESLint，`oxfmt` 替代 Prettier，快一个数量级。
> 版本口径：oxlint 1.x / oxfmt 0.x（验证时间：2026-09）。以 [oxc 官方文档](https://oxc.rs/) 为准。

***

## 学习目标

完成本模块后，你应该能够：

- 用 categories + rules 两级旋钮配出噪音可控的 lint 基线，写出带 fixture 的自定义规则
- 用 `--migrate prettier` 完成存量迁移，说清 oxfmt 的能力边界（插件不支持、行宽默认 100）
- 把 lint/format 接进 CI 与提交前钩子形成闭环

## 篇目

| 篇 | 内容 | 定位 |
| -- | ---- | ---- |
| [01-oxlint规则与插件](doc/01-oxlint规则与插件.md) | 两级旋钮心智 + JS 插件编写 + tsgolint 边界与双跑 + ESLint 迁移 | 教学 |
| [02-oxfmt配置与迁移](doc/02-oxfmt配置与迁移.md) | 配置与默认值差异 + 多语言/排序能力 + 迁移实操 + 钩子接线 | 教学 |

***

## 30 秒理解

| 工具 | 替代谁 | 干什么 |
| ---- | ------ | ------ |
| oxlint | ESLint | 代码检查，默认开启 correctness 类规则 |
| oxfmt | Prettier | 代码格式化，Prettier 兼容（风格选项同名同义） |

两者共享 oxc 的 Rust parser，比 ESLint/Prettier 快 50~100 倍，整仓 lint 秒级完成。

---

## 快速上手

```bash
bun add -d oxlint oxfmt

# 检查（配置文件 .oxlintrc.json 存在时自动读取）
bunx oxlint
bunx oxlint --fix           # 自动修复

# 格式化（裸跑 = 按默认范围直接格式化写盘）
bunx oxfmt
bunx oxfmt --check          # 只检查不改（CI 用）
```

package.json 加脚本：

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check ."
  }
}
```

---

## .oxlintrc.json 速查

```jsonc
{
  // 规则类别批量开关（优先级低于 rules 里的单条覆盖）
  "categories": {
    "correctness": "error",   // 默认就开
    "pedantic": "off",        // 学究类，一般不开
    "style": "warn",
    "suspicious": "warn"
  },

  // 内置规则组（相当于 ESLint 插件，按需启用）
  "plugins": ["typescript", "react", "unicorn", "import", "node", "jest"],

  // 单条规则覆盖
  "rules": {
    "no-console": "warn",
    "eqeqeq": "error",
    "no-unused-vars": "error"
  },

  // 全局设置
  "settings": {
    "react": { "version": "detect" }
  },

  // 按路径差异化配置
  "overrides": [
    {
      "files": ["*.test.ts", "*.spec.ts"],
      "rules": { "no-console": "off" }
    }
  ],

  // 忽略目录（默认已忽略 node_modules / dist 等）
  "ignorePatterns": ["coverage", "dist"]
}
```

> 💡 心智模型：**categories 是批量旋钮，rules 是单点微调**。从"只开 correctness"起步，被噪音烦到了再调。

---

## .oxfmtrc.jsonc 速查

```jsonc
{
  "semi": false,              // 无分号
  "singleQuote": true,        // 单引号
  "trailingComma": "none",    // 无尾逗号
  "arrowParens": "always",    // 箭头函数始终加括号
  "printWidth": 80,           // 行宽 80（oxfmt 默认是 100，显式设置避免歧义）
  "indentWidth": 2,           // 2 空格缩进
  "endOfLine": "lf"
}
```

> 💡 上面这份就是本仓库 AGENTS.md 5.6 规定的代码风格，新项目直接复制。

**oxfmt 能力边界（2026-02 beta 起）**：

- 支持格式化 JSON / YAML / TOML / HTML / Vue / CSS / Markdown / GraphQL，不只是 JS/TS
- 内置常用"格式化 + 排序"能力：**import 排序**、**Tailwind class 排序**、package.json 字段排序——过去要靠 Prettier + 多个插件拼出来的，现在开箱即用
- 从 Prettier 迁移：`oxfmt --migrate prettier` 读取现有 `.prettierrc` 生成对应配置
- **不支持 Prettier 插件**：常用能力已原生内置，但依赖冷门 Prettier 插件的团队暂时还得保留 Prettier 双跑

**oxlint 的已知短板**：类型感知规则（type-aware linting，tsgolint）仍在建设中。强依赖 `typescript-eslint` type-aware 规则的团队，现阶段保留 ESLint 双跑（oxlint 管快速规则，ESLint 只跑类型相关规则）。

---

## 插件怎么写

oxlint 内置规则组（react / typescript / unicorn / import 等）覆盖日常 90% 场景，需要自定义时写 **JS 插件**：

**第 1 步：写规则文件**

```js
// plugins/no-console-log.js
export default {
  name: 'my-plugin',
  rules: {
    'no-console-log': {
      create(context) {
        return {
          CallExpression(node) {
            const callee = node.callee
            if (callee?.object?.name === 'console' && callee?.property?.name === 'log') {
              // 报告问题
              context.report({ node, message: '禁止 console.log，请使用项目日志工具' })
            }
          },
        }
      },
    },
  },
}
```

**第 2 步：在 .oxlintrc.json 里挂载**

```jsonc
{
  "jsPlugins": ["./plugins/no-console-log.js"],
  "rules": {
    "my-plugin/no-console-log": "error"
  }
}
```

注意：

- JS 插件 API 仍在快速迭代，visitor 节点类型与 ESLint 一致（基于 ESTree），以官方文档为准
- 只写访问器函数（如 `CallExpression`）即可命中对应节点，其余节点自动跳过
- 修复（fixer）能力以当前版本文档为准，没有的能力降级为仅报告

---

## 从 ESLint 迁移速查

| ESLint 习惯 | oxlint 对应 |
| ----------- | ----------- |
| `eslint .` | `oxlint` |
| `eslint . --fix` | `oxlint --fix` |
| `extends: ['eslint:recommended']` | `categories: { correctness: 'error' }` |
| `plugins: ['react']` | `plugins: ['react']` |
| `.eslintignore` | `.oxlintrc.json` 的 `ignorePatterns` |
| `// eslint-disable-next-line xxx` | `// oxlint-disable-next-line xxx`（也兼容 eslint 风格注释） |

典型迁移路径：**oxlint 先跑一遍看告警量 → 规则逐条对齐 → 老的 ESLint 配置归档删除**。两者并存过渡也没问题，oxlint 快，先跑它。

---

## 常见踩坑

- **CI 里 oxfmt 通过但同事本地没格式化** → 提交前钩子（lefthook / husky）里跑 `oxfmt --check` + `oxlint`，双保险
- **规则太多全是警告** → 回到"correctness only"基线，按需加类，别一上来开 pedantic
- **配置了 jsPlugins 但没生效** → 路径是相对 `.oxlintrc.json` 所在目录的，且导出必须是 `export default`

***

## 边界说明

- 类型感知 lint 短板（tsgolint）与 ESLint 双跑 → [doc/01](doc/01-oxlint规则与插件.md) 第 5 节
- Prettier 插件依赖的迁移边界 → [doc/02](doc/02-oxfmt配置与迁移.md) 迁移边界检查清单
- 面试向原理深挖（oxlint 为什么快、linter/formatter 职责划分）→ 两篇 doc 的面试节
