# 语法学习平台 · 任务拆解（todo v1.2）

> 依据 [requirements.md](requirements.md)（v0.2）拆分。UI 主题：**Trae 风格**——白绿（light）/ 黑绿（dark）双主题。
> 执行顺序即编号顺序，每个任务附验收口径；前置任务未过验收不进下一个。
> v1.2：二轮评审并入——T1 补侧边栏同步排除、T3 验收拆段、T4 补 dataVersion 口径、T5 分硬/软失败、T6 补解析器 fixture 单测、T2 补 script 占位口径。

---

## M0 · 前置防护 + 脚手架 + 设计契约

- [x] **T1 部署隔离（两处同步）**：`.vitepress/config.mts` `srcExclude` **和** `.vitepress/gen-sidebar.ts` `EXCLUDED_DIRS` 同步排除 `playground`（两处各自维护排除清单，只改一处会出现侧边栏空条目 / 死链）——**必须在建脚手架之前**。
  - 验收：站点 `bun run build` 产物不含 playground 页面；`bun run gen:sidebar` 产物**无 playground 条目**。
  - ✅ 已完成：config.mts + gen-sidebar.ts 双处排除（顺带补齐 `playground-work`），sidebar.generated.mts 零 playground 条目。
- [x] **T2 项目脚手架**：`playground/` 下建 Vite + React + TS strict 项目（Bun、oxlint / oxfmt 照 Lexio 配置）；依赖仅 react / react-dom / zod（+ lucide-react 图标）。
  - 验收：`bun run dev` 起页、`bun run check` 全绿；**`validate` / `test` script 占位好**（T4/T6 直接消费，不再回头改脚手架）。
  - ✅ 已完成：check / build 绿，validate + test script 已就位。
- [x] **T3 设计规范（design.md）**：Trae 主题落地——白绿 / 黑绿双主题色板、字体、瑞士极简布局、响应式断点、⚠️ 内容 emoji 与 UI 图标（lucide）边界；含目录页 / 讲义页 / 练习卡片三张关键线框。
  - 验收（本阶段口径）：design.md 评审过 + **色板 token（CSS variables 命名表）定稿**。
  - ~~「双主题可切换」~~ 移至 **T8** 验收（首个真实页面落地时动手验证），T14 走查兜底。
  - ✅ 已完成：design.md + 色板 token 定稿（可切换验证待 T8）。

## M1 · 数据管线（Q1 已拍板：md 单文件为源 + 构建期解析）

- [x] **T4 数据契约**：zod schema 定义 Lesson / Question / blanks[] / explanation / dataVersion（按 requirements §6 字段表）。
  - **dataVersion 口径（schema 设计决策，T12 直接消费）**：`dataVersion = 题号集合 + 各题（题干 + 答案）内容指纹`（FNV hash），**不含**纯讲解段落——改解析文字不误伤进度，改任何一题即整讲判定失效。构建期计算写入 lessons.json。
  - 验收：**L03 真实解析产物过 schema**（非空数据跑通 `bun run validate`）。
  - ✅ 已完成：schema + validate 就绪；dataVersion 已按「题号 + 题干/答案指纹」实现（contentHash）。
- [x] **T5 md 解析器**：七节模板切分 + 题号（`**B1（选择）**：`）解析 + 第 7 节答案提取口径（题号切分 → 首个加粗/代码片段提取参考答案 → 「（或 …）」变体 → 失败降级自判题并告警）。
  - **两种失败语义分开**：
    - **硬失败（构建红）**：七节结构缺失、题号无法解析——清单必须为空；
    - **软失败（降级 + 告警，不阻塞构建）**：答案提取失败 → 降级自判题。
  - 验收：七节 / 题号缺失清单为空（硬失败即红）；答案提取失败清单为空（软失败降级自判 + 告警）。
  - ✅ 已完成：29 讲 / 129 题解析，零 error 级告警（唯一 info 级：L29 B2 成对空复用，语义正确）。
- [x] **T6 一致性校验 + CI 测试**：md ↔ 结构化数据对账（题数、题号、答案配对），固化 `bun test` 常驻测试（照 Lexio validate.ts 模式）；**解析器各分支 fixture 单测**（七节切分、题号正则、加粗/句型 token 提取、`（或 …）` 变体、「不填」空、成对空复用——与 T10 归一化单测同级的纯函数防护）。
  - 验收：改一处 md 不同步即测试红；解析器分支 fixture 覆盖。
  - ✅ 已完成：21 测试 / 449 断言全绿（reconcile 防漂移 + parser fixture）。

## M2 · 课程导航 + 讲义阅读（F1 / F2）

- [x] **T7 目录首页**：板块 → 讲两级列表、核心问题、进度徽标（未开始 / x/y 题 / ✓ 全对）、「继续学习」；复合键（板块标识 + 讲号）。
  - 徽标口径：**「✓ 全对」= 本讲全部题目均已判定且判定全为 ✓**（机判 ✓ + 自判 ✓；有 ✗ 或未判定则只显示 x/y）。
  - 验收：29 讲全部可点入，**新增讲次零代码接入**（讲文件 readdir 自动发现；板块清单为硬编码数组，新增板块需改代码——F1 原文口径即「新增讲次零接入」）。
  - ✅ 已完成：29 讲 5 板块全点入（浏览器实测）；徽标当前恒「未开始」，计数口径待 T9/T12 接管；「继续学习」无历史隐藏（持久化待 T12）；目录页 topbar 已加主题切换入口（二轮评审 #5）。
- [x] **T8 讲义阅读页**：第 1–6 节渲染（段落缩进两端对齐、规则表格、例句中英区分、⚠️ 坑条目、引语总结）；第 6 节只出题干、第 7 节不进阅读流；文内「详见 L23」讲次引用可跳转；上一讲 / 下一讲 / 返回目录。
  - **双主题可切换验证挪到本任务**（首个真实页面落地）：手动切换白绿 / 黑绿、跟随系统、选择持久化。
  - 验收：抽 L03 / L11 / L29 三讲核对渲染——**内容与样式形态都核对**（结构化块计数 + CSS 计算样式），不只看内容可见；**双主题切换动手验证过**。
  - ✅ 已完成（含二轮评审后重开修复）：
    - 修 P0#1：坑判定兼容 `- ⚠️` 列表形态 → **pitfall 0 → 145 条**（此前 145 处 ⚠️ 全落普通段落、样式死代码）
    - 修 P0#2：新增例句块抽取（编号项 + 加粗 label + 行内代码英文句 + zh 解析分离）→ **example 0 → 61 条**；纯英文句列表项合并；普通列表结构化 `list` 块 31 条
    - 修 P0#3：`**加粗**` 经共用行内解析器（inline.ts，构建期结构化 + 运行时同源）渲染为 `<strong>`——explanation/answer 保留 `**` 原文供答案提取，展示走同一 tokenizer；浏览器实测 `**` 零泄漏
    - 浏览器核样式形态：pitfall 暖色边条（--c-warn）、example 绿边条 + JetBrains Mono 等宽英文（对齐 design.md）；L29 B2 ①②③ 在；目录页主题按钮 light↔dark 实测生效；无答案泄露
    - fixture 单测补 pitfall 双形态 / example 抽取 / list / parseInline 四类（27 测试全绿）

## M3 · 随堂练习（F3）

- [x] **T9 练习框架 + ProgressStore 接口**：题型路由 + 难度层分组（B / S）+ 答案逐题解锁（作答后才展开该题解析，禁一键看全）+ 本讲汇总（机判 x/y · 自判 x/y 分列，错题清单跳转原题）。**本任务同时定义 `ProgressStore` 接口（判定读写 / 重置本轮 / dataVersion 询问）并以内存实现接入**。
  - 验收：L01 全流程跑通；判定 / 解锁 / 汇总全部经 `ProgressStore` 读写。
  - ✅ 已完成：`src/progress.ts` 定义 ProgressStore + 内存实现；practice.tsx 全部判定走 store（无散落内存态）；汇总分列机判/自判、错题清单跳转原题、重置本轮。
- [x] **T10 机判题型**：选择（点选即判、不可改）；填空家族（blanks[] 逐空、归一化——大小写/空白/标点不敏感、无词干还原、空内多答案任一匹配、题粒度全对才 ✓；「∅ 不填」合法空）。
  - 验收：L03 B3 / L09 B3 / L12 B2（不填空）/ L29 B2 判分正确；归一化单测全分支覆盖。
  - ✅ 已完成：`src/normalize.ts` 纯函数 + 13 条单测（含 snows≠snow 反例、分词差容错、「∅ 不填」三态）；浏览器实测 L03 B1/B2（✓）、L12 B2 空串+the 双空 ✓、「∅」按钮在。
- [x] **T11 自判题型**：改错 / 翻译（可接受变体）/ 拆句 / 辨析——输入 → 展示参考 → 显式选 ✓ / ✗。
  - 验收：L23 S2 / L28 S2 自判流正确。
  - ✅ 已完成：SelfAnswer 组件（textarea → 查看参考 → 显式自评 ✓/✗）；浏览器实测 L03 S1 流正确。

## M4 · 进度持久化（F4）

- [x] **T12 progress 模块（localStorage 后端）**：实现 T9 的 `ProgressStore`——按讲存判定 + 完成状态 + 上次讲次 + dataVersion；「重置本轮」；不可用降级单会话。
  - 失效口径：dataVersion 失配整讲判定清空、状态回「未开始」+ 提示。
  - ✅ 已完成：`createStore()` 自动选 localStorage / 内存降级；失配清空 + `stale` 提示（lesson-view 顶栏 ⚠️）；浏览器实测刷新后判定保留（persistVerdict ✓）、目录徽标「1/5 题」计数正确。

## M5 · 部署与收尾

- [x] **T13 CI 部署**：GitHub Pages 子路径部署、push 触发、门禁 build-data + validate + check + test。
  - 前置决策：**部署路径 `/kb-vault/grammar-play/`**（2026-10-15 裁定，已回写 requirements Q8）。
  - ✅ 已完成：vite base 固定 `/kb-vault/grammar-play/`；deploy.yml 新增 grammar-play 构建门禁（build-data → validate → check → test → build）+ 装配 `grammar-play/` 子路径。
  - **四轮评审 P0 修复**：`.oxfmtrc.jsonc` ignorePatterns 补 `src/data`（生成物）+ `*.md`（文档），此前 check 在格式环节红、CI 会挂在 build 之前；已按 **CI 同序**（build-data → validate → check → test → build）真实复验全绿——check 门禁已随 oxfmt ignorePatterns 修复转绿。教训：「本地构建验证」不等于「门禁全绿」，验收要跑完整门禁链。
  - **五轮评审修补**：`### 2.1` 式小节标题（122 处）原当段落裸渲染 `###` 号 → 新增 `subhead` 块剥离 # 号 + 子标题样式；fill-hint 提示改为开始补填即消失。
  - 同批修：F3 空输入校验（非 allowEmpty 空 → 阻止提交 + 提示，「不填」空豁免）；清掉冗余 tick 刷新（顺带暴露「重置本轮」遗留 `refresh` 引用，tsc 逮出改 `onChanged`）；讲次引用作用域裁定进 requirements F2（正文可跳、练习题干/解析内仅展示不跳）。
  - 备注：SelfAnswer textarea 不受控（判定持久、草稿不持久，F4 口径如此），T14 走查留意文案暗示落差。
- [ ] **T14 收尾自审**：双主题视觉走查（PC + 移动端，push 后看线上 `https://belos-street.github.io/kb-vault/grammar-play/`）、29 讲抽样走读、doc 同步（readme / requirements 状态更新）。
  - ⚠️ 已知项：bundle 561KB（lessons.json 内联），P1 可考虑数据分包 / 代码分割。

---

**P1 备选（Q3 拍板后再排）**：语法地图页（复用 readme 推导链）、错题重做（机判/自判分列）、讲内小节锚点、bundle 分包。

**依赖链**：T1 → T2 → T3 ∥ T4 → T5 → T6 → T7 → T8 → T9 → T10 ∥ T11 → T12 → T13 → T14。（已全链完成，仅 T14 收尾自审余项）
