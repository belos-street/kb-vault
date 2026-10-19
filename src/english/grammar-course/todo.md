# 语法微课平台 · 任务拆解（todo v0.1）

> 依据 [requirements.md](requirements.md)（v0.1，F1~F7）与 [plan.md](plan.md)（v0.3）拆分。UI 主题：Trae 白绿 / 黑绿双主题。
> 执行顺序即编号顺序，每个任务附验收口径；前置任务未过验收不进下一个。
> 复用基线：grammar-play 的 `normalize.ts` / `progress.ts` / `inline.ts` / 判分组件 / 双主题 / 构建管线（搬过来改造，不重写）。

---

## M1 · 内容管线 + 试点内容（5 课）

- [x] **T1 lesson.md 模板与格式契约**：定稿七件套 md 模板（`lessons/lesson-format.md` = 解析契约），含高亮句 `{★ 注解}` 标记、题号分域（P 域 B/S/P/S × Q 域）、文末答案区（收口）、词汇表 6 列。
  - ✅ 已完成：U01L03 手写样例课 `lessons/book-01/U01-句子骨架/U01L03/lesson.md`（同时是 T5 首篇成品）。
- [x] **T2 数据契约（zod schema）**：Lesson / reading（段落分组）/ vocab / notes / practice（choice/drill/produce）/ quiz（choice/fill）/ deepDive（ref+title+hint）/ dataVersion。
  - ✅ 已完成：`output` 落位 = produce 题段（含 sample 校验）；id `U\d{2}L\d{2}` / refs `G\d{2}` 锁两位；quiz 全机判枚举。
- [x] **T3 md 解析器 + build-data**：七件套固定模板切分 → lesson.json（单源产物）。
  - ✅ 已完成（二轮评审后重修）：12 条 fixture 单测全绿。**P0 复修**：`---` 分隔线混入题干——首修只堵了 notes/deepDive，题干切片漏网（S1/Q5 尾巴脏、污染 dataVersion）；fixture 已改为**按真实格式带 `---`** + 干净题干断言钉住回归。另修：`### 5.x` 吞进题干、objective 吞分隔线、fill 空位/答案段静默错配改报错、notes 例句缺失改报错（不塞占位文本）、criteria 定死括号首短语。
- [x] **T4 validate + CI 测试**：schema 校验 + 不变量断言 + **产物漂移检测**（现场解析 vs lessons.json dataVersion 深比较，「md 改了忘跑 build-data」即红）+ **syllabus outcome 逐字断言**（脚本化，容句末标点漂移——落地即抓出 U01L03 引语漂移）。
  - ✅ 已完成：U01L03 全链 `build-data → validate` 绿（1 课 / 11 题，真实产物 0 残留）；12 测试 + check 全绿。契约回写：requirements deepDive 改 `refs:[{ref,title,hint}]`、vocab 例句改全称断言、format §4 高亮句降级「约定（告警）」。
- [x] **T5 试点 5 课内容（U01L01–L05）**：五课七件套全部成文（兔叙事开篇：兔子读语法地图 → 抓主谓 → 开店 → 狼来访 → 喝汤交友），每课 8~12 词、高亮 3~4 处、练习 6 题（B×2 + P×3 + S×1）、小测 5~6 题。
  - ✅ 已完成（2026-10-16）：`build-data → validate` 全绿（**5 课 / 56 题**）；12 测试 + check 全绿。U01L05 含 2 题复习题（Q5 复习第 1 型 / Q6 复习「什么+怎么样」，U01L01–L04 复现豁免生效）；每课 outcome 与 syllabus.json 逐字一致（validate 断言）。
  - 管线又逮 2 个 gap 并修：① Q5/Q6 双括注 `（选择）（复习）` 超出题号正则 → 题被**静默丢弃**（Q4 body 吞进 Q5/Q6 变 2 空位才暴露）——修内容为单括注 + **补「孤儿答案」检测**（答案区有条目但无对应题 = 硬失败）；② U01L01 词汇表混入课文不存在的「shop」（全称断言抓住，换为课文原句词）。
  - **三轮评审修订**（U01L02 模板课口径统一，趁 dataVersion 零成本窗口）：
    - **P0-1 词汇台账**：建成 `lessons/vocab-ledger.md`（与 general 同源口径：入账唯一/复现登记/状态流转），`bun run ledger` 脚本**词形枚举精确清点**复算（不估算）——3 处跨课重复入账（grammar/rule→U01L02、smile→U01L04）归并记复现，3 处课文复现、旧词复现率逐课清点。
    - **P0-2 U01L02「谓语」口径统一窄口径**（= 动词+TAM 整体，对齐讲义）：课文台词拆「谓语=ate / 宾语=the big carrot」、Q1 答案改 A、B1/S1 解析改「主语+谓语+宾语」——消除三处互撞（这课是后续 63 课模板）。
    - **P1-1** 精讲 ❌ 例句换真错句（`The wolf ate the carrot came back.`）+ 「一句一谓语」补并列谓语豁免（原 ❌ 例句被自己 P3/课文证伪）。
    - **P1-2** validate 补 **deepDive refs 覆盖 syllabus refs** 断言（U01L01 缺 G02 被抓，已补）。
    - **P2**：U01L04 笔误「做什么/做什么」→「做什么/是什么」；U01L05 Q2/Q4 半词挖空答案补「（或 表语/副词）」变体；U01L01 P2 解析与大小写不敏感口径对齐。

## M2 · 平台 v1（F1~F7）

- [x] **T6 项目脚手架 + 复用件迁移**：`platform/` 建 Vite + React + TS strict 项目；从 grammar-play 搬 `normalize.ts`、`progress.ts`、`inline.ts`、`theme.ts`、`styles.css` + 两个单测文件（inline 7 条 / normalize 11 条随迁）；hash 路由骨架 + 部署隔离（srcExclude / gen-sidebar 双处**精确路径**排除 `english/grammar-course/platform`）。
  - ✅ 已完成（2026-10-16）：`check` + 30 测试全绿（复用件单测随迁生效）、`vite build` 成功（base `/kb-vault/grammar-course/`）。迁移适配 3 处：normalize 的 Blank→`string[][]`（「不填」= accepts 含 ''）、progress 的 questions→`practice+quiz` 合并视图（`lessonQuestions`）、`lessonBadge` 四态中的「未上线」留给 T7 目录侧判定。侧边栏验证：platform SPA 零条目、grammar-course 内容文档 22 条正常进站（md 课本发站双用生效）。
- [x] **T7 课程导航（F1）**：单元 → 课两级列表（68 课全景，混合数据源：syllabus.json 目录 × lesson.json 已上线判定）+ 徽标四态 + 继续学习 + 上一课/下一课切换。
  - 徽标四态：**未上线（置灰不可点）/ 未开始 / x/y 题 / ✓ 全对**（全部判定且全为 ✓）。
  - 验收：**已上线课全点入 + 未上线课按「未上线」置灰态显示**（M2 时 5 课上线、63 课置灰，随 build-data 产出自动点亮）；单元尾「本单元 x/y 课已上线」；上下课切换仅在已上线课间。
  - ✅ 已完成（2026-10-16）：新增 `catalog.ts`（syllabus 全景 × byKey 上线判定，units/liveIds/neighbors）+ `library.tsx`（单元→课两级、徽标四态、继续学习、单元尾计数）+ `lesson-view.tsx` 壳（目标 + 上一课/下一课）+ app.tsx 路由接线 + styles.css（board-goal/foot、badge.off、lesson-item.off 置灰）。`check` + 30 测试全绿、`vite build` 成功；浏览器实测 10 项全过：68 行 / 5 上线 63 置灰 / U01 尾「5/7 课已上线」/ topbar「5/68」/ U01L01 仅 next / U01L05 仅 prev / 上下课仅在已上线课间 / 返回目录 / 双主题切换正常、零 console 报错。
- [x] **T8 课文阅读 + 词汇表（F2 + F3）**：①目标 + ②课文（逐句中英、高亮句 + note 注解展开）、③词卡（五要素 + 例句等宽渲染 + 例句定位课文原句）。
  - 验收：U01L01–L05 逐课走查：高亮句 3~5 处、词卡 8~12 张、双主题渲染核对（结构化样式形态，不只看内容可见——grammar-play 教训）。
  - ✅ 已完成（2026-10-16）：新增 `inlines.tsx`（parseInline 同源渲染 code/strong，ref 按纯文本——Gnn 走 T11 深读跳转）+ `reading.tsx`（段落式逐句中英、高亮句「为什么这么写」注解展开/收起、句 domId）+ `vocab.tsx`（词卡五要素 + 例句等宽 + 例句点击滚动定位课文原句并闪烁）。验收：数据核对 5 课高亮 3~4 处、词卡 10~11 张、例句原句互链 100% 命中（0 处非原句）；浏览器实测 U01L01 结构/注解展开/例句定位/双主题全过、零 console 报错。`check` + 30 测试全绿、`vite build` 成功。
- [x] **T9 操练 + drill 题型（F4）**：④精讲卡置顶 + ⑤三段练习（choice / **drill 新题型** / 产出自判）；drill = 模板句 + 替换槽 + 提示词，逐槽归一化比对、题级全对才 ✓；答案逐题解锁。
  - 验收：drill 判分正确（含多可接受答案槽）；drill / 归一化 `bun test` 单测覆盖（无词干还原、「不填」合法空随 normalize 单测迁移）；产出题揭示 sample 后显式自判。
  - ✅ 已完成（2026-10-16）：新增 `notes.tsx`（精讲卡：规则 + ✅/❌ 例句对照）+ `practice.tsx`（理解/操练/产出三段分组、逐题解锁、choice 四选一机判、drill 逐槽判分含空输入拦截、produce 揭示 sample 后显式自判）+ lesson-view 接入进度态（stale 提示 + setLastKey）。单测 +3 条 drill 判分口径（多槽全对、多可接受答案任一匹配、watch≠watches 无词干还原），33 测试全绿。浏览器实测 7 项全过：精讲卡渲染 / 三段顺序 / choice 锁定展开 / drill 空槽拦截 + "think"≠"thinks" 正确判错 / produce 自判锁定 / 逐题解锁无一键看全 / 双主题正常、零 console 报错。
- [x] **T10 小测 + 汇总（F5）**：4~6 题混合判分、错题清单跳转原题、重置本轮、错题记录（P1 调度不实现）。
  - 验收：U01L05 含 2 题间隔复习题判分正确；汇总机判/自判分列。
  - ✅ 已完成（2026-10-16）：新增 `quiz.tsx`（小测 Q 域全机判：choice 四选一 + fill 逐空判定含「不填」空豁免、空输入拦截、逐题解锁）+ Summary 汇总卡（机判/自判/合计分列、错题清单锚点跳原题、重置本轮、全对完成标记）。浏览器实测 6 项全过：Q1–Q6 题型分布正确、choice/fill 判分与锁定、U01L05 间隔复习题 Q5（主+动）/Q6（谓语）判分正确、汇总计数随作答实时更新（机判 x/11 · 自判 x/1 · 合计 x/12）、重置本轮全量清零、零 console 报错。`check` + 33 测试全绿、`vite build` 成功。
- [x] **T11 深读跳转（F6）**：deepDive refs → 讲义静态页锚点链接（`/kb-vault/english/grammar/…`）+ hint 展示；入口在精讲卡末尾 + 小测汇总后。
  - 验收：U01L03 点击跳 G03 对应小节（锚点定位）；线上跳转目标 = 站点讲义页（非 grammar-play）。
  - ✅ 已完成（2026-10-16）：构建期解析 `deepdive-links.ts`（Gnn→讲义文件 + `§N.M`→`###` 小节 + VitePress slugify 逐字复刻锚点，URL 落进 `refs[].url`），source.ts 接线解析失败硬错、validate 断言 URL 必有且指向讲义页；`deepdive.tsx` 双入口（精讲卡末尾 + 汇总后）渲染 ref/title/hint + 新标签跳转。锚点口径锁 4 条单测（含 U01L03 G03 线上实测值），36 测试全绿。**线上比对：8/8 深读 URL 的锚点在已部署讲义页全部真实命中**（U01L03 → `_2-2-维度13联手-…` 精确对应 §2.2），跳转目标 = 站点讲义页非 grammar-play。
- [x] **T12 进度持久化（F7）**：ProgressStore（localStorage + 降级）按课存判定 / 上次课 / dataVersion（题号 + 题干/答案指纹）；失配整课清空 + 提示。
  - 验收：刷新续学、判定保留、dataVersion 失配回「未开始」+ 提示、隐私模式降级——四条手测过。
  - ✅ 已完成（2026-10-16）：契约已在 T6–T11 接线（createStore → localStorage 后端 + 内存降级 + lesson-view stale 提示 + setLastKey），本任务补 `progress.test.ts` 5 条单测锁定（判定写读 / dataVersion 失配整讲清空 + stale / 按课隔离 / resetLesson / lastKey），41 测试全绿。验收口径：**三条手测**（刷新续学判定保留、目录徽标「1/11 题」+ 继续学习按钮、dataVersion 篡改后提示「本讲内容已更新…」+ 徽标清零）+ **隐私模式代码级验证**（try/catch 降级单会话契约，非浏览器手测，单测覆盖内存实现）。

## M3 · 铺课与收尾

> **M2 评审修复（2026-10-17）**：P0-1 oxfmt 6 文件格式修复后全链重跑（check ✓ / 41 测试 ✓ / build-data→validate ✓ / vite build ✓）；P0-2 `design.md` 指向 `grammar/playground/design.md` 的死链改为行内路径文本（playground 被 srcExclude 不入站，链接即死链炸站点构建）+ 站点构建复绿；P1-1 drill 空输入拦截补「不填」豁免（与 quiz.tsx 同口径：accepts 含 '' 的空可留空）；P2-1 theme key 改 `grammar-course-theme`（避免与 grammar-play 两站主题联动）；P2-2 library badgeOf 死分支注释澄清；P2-3 domId 双实现抽公共 `sentence-id.ts` 单源。M2 以当前 HEAD 重跑为准。

- [x] **T13 铺课 U01L06/L07 + U02 单元（11 课）**：双宾 / 宾补 + 名词家族 9 课（it 拆课 L15/L16、复现全量生效）。
  - 验收：每课 validate 全绿；U02 单元收尾跑一次深度审校（doc-quality-reviewer）。
  - ✅ 已完成（2026-10-17）：11 课全部落盘（U01L06 双宾 / U01L07 宾补 / U02L08–L16 名词家族），16 课 / 188 题全链门禁绿（build-data → validate → check → test → build）。词汇台账重算回写：147 词条、重复入账 19 处归并、课文复现 72 词，U02 复现占比 50~72%（「约 70% 旧 + 30% 新」螺旋达标）；scan-vocab 修复纯课文复现漏扫（原只扫词汇表已列的课，与「课文复现按课次精确登记」口径不符）。深度审校（doc-quality-reviewer）：总评 9/10，修掉 1 条 P1（U02L10 P3「not ten」对比语境与答案 a 矛盾 → 模板去掉对比、让 Q4 独占 one 语境）+ 5 条 P2（Q4 答案变体「es（或 ies）」收敛、Q3-D 解析措辞、反身代词公式精确化（讲义同源简化，himself/itself/themselves 为宾格+self）、Q3-D 干扰项换学科名、收束句挪 U02L16 作单元终句），修复后全链复绿、台账三处同步。
- [x] **T14 部署 + 收尾自审**：deploy.yml 加 grammar-course 段（build-data → validate → check → test → build，门禁全链）；线上双主题 + 移动端 + 5 课抽样走查；doc 同步（plan/requirements/todo 状态）。
  - 验收：线上 `/kb-vault/grammar-course/` 可访问；CI 同序门禁绿（「本地构建通过 ≠ 门禁绿」教训）。
  - ✅ 已完成（2026-10-18）：3 commit 推送后 CI 全链绿（run 39097970352，build + deploy 双 success——「CI 同序门禁绿」实证）。线上走查 8 项全过：16/68 点亮（52 课置灰）+ 徽标四态 + 单元尾计数（DOM 实测 9 个 board-foot，U01 7/7、U02 9/9）+ U02L08 课页全模块零 console 报错 + 操练提示词去答案化生效（「再次提及/乐器/一类人」）+ 深读跳转锚点命中讲义「不定冠词」小节 + 双主题切换 + 375×812 真仿真无横向溢出（目录页与课页 scrollWidth=375）。doc 同步：plan.md 实施进度行、requirements.md 状态行 v0.2 已实施；「提示=答案」小项 11 处整改（hints 不进 dataVersion，用户零进度成本）。

---

**P1 备选**：拼写模块、跨课复习队列调度、小测自动选题、**bundle 分包**（二审实测已到 1MB / gzip 298KB——lessons.json 68 课全内联，按单元动态 import + React.lazy 改造，下次动平台时优先做）。
**已评估不做**：数词并课（L33/L34）/ 虚拟加课（U08 混合练习）——课号全局连续编号，一并一加牵动约 35 课顺移 + 进度全失配，成本远大于收益；轻量替代已落 U08L65 练习加厚（S2 仿写句群），L33/L34 已是全书最简课、读者可自行快速过。

## M4 · TTS 朗读（2026-10-18 补齐）

- [x] **T15 TTS 阅读**：课文句点击播放 + 自动播放逐句连播；词汇表点词/点例句播放（例句兼定位课文原句）。
  - 实现：`use-speech.ts` 自 Lexio 迁移（音色链本地女声优先、interrupted/canceled 忽略、pausePoll 防移动端卡死、4s 看门狗兜底缺引擎静默失败），语速 0.9；activeKey 播放态跟踪，句/词/例句三处高亮跟随。
  - 交互：点句播单句（note 按钮 stopPropagation 不误触）；「▶ 自动播放 / ■ 停止」逐句连播滚动跟随，点句即中断连播切单句；切课自动停；speechSynthesis 不可用时隐藏入口优雅降级。
  - ✅ 已完成（2026-10-18）：`check` + 41 测试全绿 + build ✓；Chrome 实测 DOM 级 7 项全过（真实 speaking 态、连播 sent-0→sent-1 推进、停止后零残留高亮、按钮复位、console 零 error）。移动端边界沿用既知结论（Chrome 需可达 Google 的网络走网络音色；国行 ROM 缺引擎时看门狗兜底不卡连播）。

**依赖链**：T1 → T2 → T3 → T4 → T5 ∥ T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14。
（T5 内容与 T6 脚手架可并行；T9 依赖 T2 的 drill schema 落定。）

## M5 · 全书铺满 + Review（2026-10-18）

- [x] **T16 铺课 U03–U09 共 52 课**：U03 时态 8 + U04 形副介数 10 + U05 三大从句 9 + U06 非谓语 8 + U07 句法变形 8 + U08 助动词语气 6 + U09 综合收口 3。
  - ✅ 68 课 / 812 题全链门禁绿（build-data → validate → check → 41 测试 → build）；词汇台账重算回写 515 词条（重复入账 173 处归并、课文复现 311 词）；兔叙事连续剧从森林晨景到开店一周年全程贯通，L68 收束。
- [x] **T17 52 课深度 review + 修复**：五路并行审查（U03/U04/U05/U06/U07）+ U08/U09 一路，对照 syllabus 契约与 grammar 讲义逐题核答案。
  - ✅ 发现并修复 5 个 P0（U04L32 短语动词中置规则错、U07L59 P3 主谓不一致、U07L57 过去虚拟主句形态、U07L57/U07L54 集体名词反判、U08L62 should have done 判别绝对化）+ 40 余条 P1/P2（提示词泄漏、答案变体缺失、跨课情节矛盾、失效指路、术语撞名）；修复后全链复绿、台账复算同步。
  - ✅ 二审闭环（2026-10-19，review-u03-u09-tts.md）：4 P1 + 13 P2 全部修复（U03L24 计划语境改 be going to + 临场 will 对比例、U04 操练提示词改回与答案同序、U05L35 课程地图课号、U09L68 B2 TAM 释义去「语态」；TAM 字面全书统一「时 / 态 / 气」对齐讲义 G02）；plan.md 进度回写。

## M6 · 练习层强化（2026-10-19 三审收口）

- [x] **T18 练习层三项强化**（三审结论「教成品、练句型」）：
  - 间隔复习远期化：7 个单元首课 Q6 跨单元回访 + U08L64 虚拟语气双题回访 U03 时态基础（过去完成——时态退移根基）+ U08L65 回访一般过去
  - 段落级产出：U05L43/U06L51/U07L59/U08L65 各加 S2 仿写句群（3 句+衔接）；U09L68 收束「拆句+写一段」；U06L51 独立主格标注识别型边界
  - 单元自测：`#/unit/:id` + UnitQuiz 组卷（各课小测抽 1 题、优先非复习题、封顶 8 题），判分复用 quiz 单份实现、不持久化可重做，目录单元尾按钮
  - 难度曲线：U08L64 课文 209→128 词、U08L65 193→136 词
  - ✅ 68 课 / 816 题全链门禁绿；台账复算 174/311/515 一致；单元自测浏览器实测过（8 题组卷/判分/汇总/重做）
