# 第 7 讲：状语从句 —九类连词一张表

> **第一册 · Unit 02 · Lesson 07** ｜ 预计用时 60 分钟
> 学完本讲你能：按语义选对九类状语从句连词，并在时间/条件/让步从句中用一般现在时表将来。

---

## 1. 课文精读

**When the Build Fails**

> Before we deploy, we compare this build with the last. The condition is simple: no release unless the tests pass. Its purpose is to prevent bad builds. Although the pipeline requires extra time, we never skip it.
>
> We allow no shortcuts（捷径）, because bugs break everything. When the build fails tonight, we will warn everyone immediately. Despite the pressure, we follow the playbook. Suppose an incident occurs; in that case, we pause the release.
>
> We stop so that nobody touches a broken build. Otherwise, errors may grow so big that everything breaks. Quick fixes are cheaper than long delays. We fix bugs where they appear, as the playbook says.

**参考译文**

> 上线前，我们会把这次构建和上一次作对比。条件很简单：除非测试通过，否则不发布。这条规则的目的是防止坏构建上线。尽管流水线要多花些时间，我们也从不跳过。
>
> 我们不留捷径，因为一个 bug 就能毁掉一切。今晚构建一旦失败，我们会立刻警告所有人。尽管有压力，我们还是照应急预案走。假设发生一起小事故；那种情况下，我们会暂停发布。
>
> 我们会停下来，好让没人去碰坏掉的构建。否则，小错误会越长越大，直到一切崩溃。快速修复比长时间的拖延更省代价。哪里出现 bug 就在哪里修，就像应急预案说的那样。

**关键句解析**

| 句子 | 拆解 |
|------|------|
| The condition is simple: **no release unless the tests pass**. | 条件状语从句：**unless = if…not**，「除非测试通过，否则不发布」；主句先给结论、从句补条件（见 3.3） |
| **When the build fails tonight**, we **will** warn everyone immediately. | **主将从现**：时间从句用一般现在（fails）表将来，will 只留主句（见 3.4） |
| **Although the pipeline requires extra time**, we never skip it. | 让步状语从句：although 已含「虽然」，后面**不再用 but**（❌ ~~Although…, but we…~~） |
| We stop **so that** nobody touches a broken build. | 目的状语从句：so that + 从句（常含 can / will / may），回答「为了什么」 |
| errors may grow **so big that** everything breaks. | 结果状语从句：**so + adj + that…**，回答「结果怎样」；与 so that（目的）划清界限（见 3.3） |
| We fix bugs **where they appear**, **as the playbook says**. | 一句挂两个状语从句：where 表地点、as 表方式 — 状语从句可以叠加 |

---

## 2. 词汇与词组

> 本讲词汇：课内精讲 7 词 + 下方高频拓展词群 5 词，共 12 词。

| 单词/词组 | 音标 | 释义 | 课文例句 | 拓展搭配 |
|-----------|------|------|----------|----------|
| condition | /kənˈdɪʃn/ | n. 条件 | The condition is simple: no release unless the tests pass. | a strict condition 严格的条件 / meet the condition 满足条件 / on one condition 有一个条件 |
| despite | /dɪˈspaɪt/ | prep. 尽管 | Despite the pressure, we follow the playbook. | despite the pressure 尽管有压力 / despite doing sth 尽管做了某事（后接名词，不接句子） |
| compare | /kəmˈper/ | v. 比较 | we compare this build with the last | compare A with B 把 A 和 B 对比 / compare A to B 把 A 比作 B / compared with 与……相比 |
| prevent | /prɪˈvent/ | v. 防止 | Its purpose is to prevent bad builds. | prevent sb from doing 阻止某人做 / prevent bad builds 防止坏构建上线 / prevent damage 防止损害 |
| require | /rɪˈkwaɪər/ | v. 需要；要求 | Although the pipeline requires extra time… | require extra time 需要额外时间 / require sb to do 要求某人做 / as required 按要求 |
| allow | /əˈlaʊ/ | v. 允许 | We allow no shortcuts. | allow sb to do 允许某人做 / allow no shortcuts 不留捷径 / allow for 考虑到 |
| purpose | /ˈpɜːrpəs/ | n. 目的 | Its purpose is to prevent bad builds. | the purpose of ……的目的 / for the purpose of 为了…… / on purpose 故意 |

### 2.1 高频拓展词群

| 词 | 课文句 | 高频搭配 |
|----|--------|---------|
| case（n. 情况）— 为 L09《高频词群实战 II·观点句词群》铺垫 | Suppose an incident occurs; **in that case**, we pause the release. | in that case 在那种情况下 / in case 以防；万一 / in any case 无论如何 |
| otherwise（adv. 否则） | **Otherwise**, errors may grow so big that everything breaks. | or otherwise 或其他情况 / do otherwise 另行处理 / unless otherwise stated 除非另有说明 |
| immediately（adv. 立即） | When the build fails tonight, we will warn everyone **immediately**. | immediately after ……后立即 / respond immediately 立即响应 / act immediately 立即行动 |
| suppose（v. 假设） | **Suppose** an incident occurs; in that case, we pause the release. | be supposed to do 应该做 / suppose that… 假设…… / I suppose so 我想是这样 |
| warn（v. 警告） | When the build fails tonight, we will **warn** everyone immediately. | warn sb about/of sth 提醒某人某事 / warn sb to do 警告某人去做 / warn against 提醒提防 |

> 这 5 个词先混个脸熟；其中 case 将并入 L09《高频词群实战 II·观点句词群》的搭配网（为该讲铺垫）。

---

## 3. 语法点拆解

### 3.1 什么是状语从句（先定义后使用）

| 术语 | 一句话定义 | 课文例句 |
|------|-----------|---------|
| **状语从句**（adverbial clause） | 修饰主句的从句，说明动作发生的时间 / 条件 / 让步 / 原因 / 目的 / 结果 / 比较 / 方式 / 地点 | **When the build fails tonight**, we will warn everyone immediately. |
| **从属连词**（subordinating conjunction） | 领起状语从句、把从句「挂」到主句上的词，如 when / unless / although | when, unless, although（全表见 3.2） |

状语从句在句中作**状语**（修饰谓语或整句），位置灵活：放句首时常加逗号，放句尾常不加。删掉它句子主干照样成立 — 这是「先剥状语、再看主干」的依据。

### 3.2 九类连词一张表

| 类别 | 代表连词 | 课文例句 |
|------|---------|---------|
| 时间 | when, before, until / as soon as | **Before we deploy**, we compare this build with the last. / **When the build fails tonight**, we will warn everyone immediately. |
| 条件 | if, unless, as long as | no release **unless the tests pass**. / **Suppose an incident occurs**… |
| 让步 | although, though, even if / despite | **Although the pipeline requires extra time**, we never skip it. / **Despite the pressure**, we follow the playbook. |
| 原因 | because, since, as | We allow no shortcuts, **because bugs break everything**. |
| 目的 | so that, in order that | We stop **so that nobody touches a broken build**. |
| 结果 | so…that, such…that | errors may grow **so big that everything breaks**. |
| 比较 | than, as…as | Quick fixes are cheaper **than long delays**（than 从句常省略主谓，完整版是 than long delays are） |
| 方式 | as, as if / as though | …**as the playbook says**. |
| 地点 | where, wherever | We fix bugs **where they appear**. |

💡 记法：拿到从句先问「它在回答什么问题」— 何时？条件？让步？为什么？为了什么？结果？比谁？怎么做？在哪里？答案就是类别，类别定连词。

### 3.3 重点辨析：六组高频混淆

**when / while / as（何时发生）**

| 连词 | 用法 | 例句 |
|------|------|------|
| when | 动作可长可短，「当……时」，最通用 | **When the build fails**, we warn everyone. |
| while | 从句动作延续（常配进行时），「在……期间」 | **While the tests are running**, I write the summary. |
| as | 两动作同时，「一边……一边……」/「随着」 | **As the log grows**, the picture gets clearer. |

**until / before（到何时 / 在何时之前）**

| 连词 | 用法 | 例句 |
|------|------|------|
| until | 动作延续到某点为止；not…until =「直到……才」 | We wait **until the tests pass**. / We **do not** release **until** the tests pass. |
| before | 在某点之前（先后顺序），可译「还没来得及……就」 | Check twice **before you deploy**. |

**unless = if…not（条件的否定式）**

- 课文句改写对照：**Unless the tests pass**, we do not release. = **If the tests do not pass**, we do not release.（原文：The condition is simple: no release unless the tests pass.）
- ⚠️ unless 自带否定，后面不再加 not：❌ ~~Unless the tests do not pass…~~

**although / though / even though（让步，不与 but 连用）**

| ✅ | ❌ |
|----|----|
| **Although** the incident was minor, we wrote a full report. | ~~**Although** the incident was minor, **but** we wrote a full report.~~ |
| The incident was minor, **but** we wrote a full report. | （although 与 but 一句只能留一个） |

- even though 语气更重（事实如此）；even if 表假设（即使）；**despite 后只接名词**（Despite the pressure ✅），不接句子。

**because / since / as（原因三兄弟）**

| 连词 | 语气 | 例句 |
|------|------|------|
| because | 最强，回答 why，句首句尾都行 | We allow no shortcuts **because bugs break everything**. |
| since | 双方已知的原因，「既然」，常在句首 | **Since the tests are green**, we can ship. |
| as | 最弱，「由于」，常在句首 | **As the log was short**, the fix was easy. |

- ⚠️ because 与 so 不同框：❌ ~~Because the log is short, **so** the problem is easy to find.~~

**so that（目的）vs so…that（结果）**

| 结构 | 含义 | 课文例句 |
|------|------|---------|
| so that + 从句（常含 can / will / may） | 目的：为了 | We stop **so that nobody touches a broken build**. |
| so + adj / adv + that… | 结果：如此……以至于 | errors may grow **so big that everything breaks**. |

- 判别法：把「为了」代进句里通顺 → so that；把「如此……以至于」代进去通顺 → so…that。

### 3.4 主将从现：从句用一般现在时表将来

**主将从现**（定义卡）：时间、条件、让步等状语从句谈**将来**时，从句用**一般现在时**代替 will，将来含义交给主句（will / be going to / 祈使句）。课文例句：**When the build fails tonight**, we **will** warn everyone immediately.（fails 用一般现在表将来，will 留在主句）

复习 U01-L05：if / when 从句「主将从现」早已建立；本讲扩展到 **before / until / as soon as / unless / although / even if** — 只要从句谈将来，一律用一般现在。

| ✅ 正确 | ❌ 错误 |
|---------|---------|
| When the build **fails** tonight, we **will** warn everyone. | ~~When the build **will fail** tonight, we will warn everyone.~~ |
| We will not deploy before the lead **approves** the plan. | ~~…before the lead **will approve** the plan.~~ |
| Unless the tests **pass**, we will not ship. | ~~Unless the tests **will pass**, we will not ship.~~ |
| Even if the demo **breaks** tomorrow, we will stay calm. | ~~Even if the demo **will break** tomorrow…~~ |

> 💡 让步从句同样适用：although / even if / whenever 谈将来都用一般现在。主句也不一定非要 will — 祈使句、情态动词都行：If the tests fail, **stop** the release. / We **can** ship when the checks **pass**.

### 3.5 课文复现自查

本讲课文英文共 108 词、词形 type 81 个（仅字母词），自然复现已入账旧词 17 个词条：deploy、build（builds）、last、test（tests）、release、pipeline、extra、skip、bug（bugs）、break（breaks）、fail（fails）、follow、playbook、incident、occur（occurs）、fix（fixes）、delay（delays）。原始分数 **17/81 ≈ 21%**（≥ 10% 达标）。（本讲 12 个新词全部首次入账，不计入分子。）

---

## 4. 输出

1. **复述**：用 2~3 句英文复述这篇发布纪律（线索：deploy → condition → incident → rule）
2. **仿写（核心）**：以你的发布 / 上线（或考试、交作业）纪律为主题写 4~5 句英文小结，至少含：1 个时间或条件从句（主将从现）、1 个让步从句（although / despite / even if）、1 个目的从句（so that）；如能再加 1 个结果句（so…that）更佳。参考起点：
   - Before we deploy, we compare this build with the last.
   - Unless the tests pass, we do not release.
   - Although the pipeline requires extra time, we never skip it.
   - We stop so that nobody touches a broken build.
   - When the build fails tonight, we will warn everyone immediately.
3. **自检**：按「连词三问」过一遍 — 从句谈将来用一般现在了吗？although 后面有 but 吗？so that 是「为了」吗？

---

## 5. 配套练习

- 题目：[L07 练习](practice.md)（基础层必做，强化层选做，答案在文末）
- 错题记录：

| 题号 | 错因 | 回流安排 |
|------|------|---------|
|      |      |         |

---

## 6. 本讲小结

- [ ] 能按语义说出九类状语从句的代表连词（时间 / 条件 / 让步 / 原因 / 目的 / 结果 / 比较 / 方式 / 地点）
- [ ] 能说清 unless = if…not、although 不与 but 连用、because 不与 so 连用
- [ ] 能区分 so that（目的）与 so…that（结果）
- [ ] 时间 / 条件 / 让步从句谈将来用一般现在（主将从现），will 只留主句
- [ ] 能在课文里指认 when / before / unless / although / because / so that / so…that 各一例
- [ ] 基础层练习正确率 ≥ 80%

---

🔗 下一讲：[L08 综合实战 —长句合并与拆解](../L08-综合实战-长句合并与拆解/lesson.md)
