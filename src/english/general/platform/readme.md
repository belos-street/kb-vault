# Lexio

> **/ˈlɛks.ioʊ/** —— **Lex**（lexicon 词库、lexis 词语）+ **-io**（轻快的经典后缀）。
> 寓意：把躺在词表里的「词汇」，练成能听、能拼、能写的「语言能力」。

线上地址：<https://belos-street.github.io/kb-vault/lexio/>

## 这是什么

Lexio 是 kb-vault 英语学习体系的练习平台：把 skill 生成的结构化课文数据编译成可交互学习页，覆盖「听 → 拼 → 测」闭环。

- **01 课文**：Web Speech API 逐句朗读（浏览器内置，零依赖）、当前句高亮、语速调节、单句循环、中英对照、自然段排版
- **02 拼写**：三个子模式——单词拼写（听音 → 拼写，三级提示）、句子默写（看中文写英文，意 → 形）、听写（听音复写，音 → 形）；统一推进规则：**必须完全正确才能进入下一项**，首次对错计入成绩
- **03 练习**：七题型判分（选择 / 判断 / 填空 / 改错 / 翻译 / 标注 / 写作自评），错题跨会话保留
- **课程库**：册 → 单元 → 讲三级目录，逐讲进度标记（未开始 / x/y 题 / 全对），上一讲 / 下一讲快切

## 数据流（markdown 是唯一数据源）

```text
lesson.md / practice.md          ← Obsidian 编辑 + english-lesson-crafter skill 生成
        ↓ 转写
lesson.json                      ← zod schema 约束的结构化数据
        ↓ bun run validate       ← md ↔ json 对账（句子 / 词汇 / 题组）
React SPA                        ← 只读消费 lesson.json，不做任何反向编辑
```

课程目录：`../book-01-foundation/01-句子工程/L01...L09/`（每讲一目录，md + json 同置）。

## 本地开发

```bash
cd src/english/general/platform
bun install
bun run dev       # http://localhost:5173/kb-vault/
bun run validate  # 数据对账（9 讲应全绿）
bun run check     # tsc strict + oxlint + oxfmt
bun test          # 单测（text / select / lcs / validate）
bun run build
```

## 部署（GitHub Pages CI）

- Workflow：[`.github/workflows/deploy-platform.yml`](../../.github/workflows/deploy-platform.yml)
- 触发：push 且 paths 命中（`src/english/general/platform/**` 或课程数据 `01-句子工程/**`）；也可在 Actions 页手动 Run
- 门禁：`validate` 与 `check` 任一失败即不发布
- 构建：`vite build --base=/kb-vault/lexio/`，产物装配到站点根的 `lexio/` 子目录，根部放跳转页
- 线上：<https://belos-street.github.io/kb-vault/lexio/>

## 目录结构

```text
platform/
├── index.html              # 入口 + 背景几何层（design.md §2.6）
├── requirements.md         # 需求文档（范围已冻结，含决策记录）
├── design.md               # 瑞士极简设计规范
├── bugfix-todo.md          # 代码评审整改清单（已闭环）
└── src/
    ├── schema/lesson.ts    # zod 数据契约
    ├── scripts/            # validate / reconcile（md↔json 对账）
    ├── tests/              # bun test（含解析器回归用例）
    └── app/
        ├── components/     # reading-player / spelling-drill / practice-grader / library 等
        ├── hooks/          # use-speech（TTS）/ use-drill-queue（队列状态机）
        ├── utils/          # text（词形归并）/ lcs（diff）/ select（核心句筛选）
        └── progress.ts     # localStorage 进度持久化
```

## 相关文档

- 需求与决策：[requirements.md](requirements.md)
- 设计规范：[design.md](design.md)
- 课程生成 skill：`../../../.agents/skills/english-lesson-crafter`（课文与练习同源生成流程）
