# 第 1 讲：从句总览 —句子是怎么「长出」句子的

> **第一册 · Unit 02 · Lesson 01** ｜ 预计用时 60 分钟
> 学完本讲你能：建立「主句 + 从句」框架观，并用提问法区分名词性/定语/状语三类从句。

---

## 1. 课文精读

**Reading Long Sentences Like Nested Functions**

> Long docs often confuse developers. Complex sentences can seem unreadable. When you meet one, treat it like nested functions（嵌套调用）: the main clause（主句） is the entry function, and it carries the main point. A clause（从句） is a call inside the call — it describes details, replaces a task list, or tells you why a build fails. Divide the sentence into parts, and its structure gets clear. Split it again, connect the parts with questions, and run them one by one. Ask what each clause does, check the answers, and you will expand the logic that makes a complex doc readable. Keep this habit, and long docs will improve.

**参考译文**

> 长文档常常让开发者困惑。复杂的句子可能看起来根本读不懂。遇到这种句子，把它当成嵌套函数（嵌套调用）来读：主句是那个入口函数，它承载着全句的主要观点。从句是「调用里的调用」——它描述细节、替代一张任务清单，或者告诉你构建为什么失败。把句子拆成几部分，它的结构就清楚了。再拆细一点，用问题把各部分连起来，然后逐个「执行」这些问题。问问每个从句在干什么，核对答案，你就能扩展那套让复杂文档变得易读的逻辑。坚持这个习惯，长文档也会变得好读。

**关键句解析**

| 句子 | 拆解 |
|------|------|
| **When** you meet one, treat it like nested functions. | 主句只有 treat it like nested functions；When 引导的整块自带主谓（you meet one），提问「何时？」→ 时间状语从句 |
| ...tells you **why a build fails**. | tells you 后面整段是宾语从句，提问「告诉你什么？」→ 名词性从句；why 是从句内部自带的疑问词，不决定类型 |
| ...the logic **that makes a complex doc readable**. | that 引导的整块修饰 the logic，提问「什么样的逻辑？」→ 定语从句 |
| ...ask **what each clause does**. | ask 的宾语是整个 what 从句，提问「问什么？」→ 名词性从句 |

---

## 2. 词汇与词组

> 本讲新授 12 词：课内精讲 7 词 + 下方高频词群 5 词，均为台账未入账词。

| 单词/词组 | 音标 | 释义 | 课文例句 | 拓展搭配 |
|-----------|------|------|----------|----------|
| structure | /ˈstrʌktʃər/ | n. 结构 | ...and its structure gets clear. | sentence structure 句子结构 / data structure 数据结构 |
| confuse | /kənˈfjuːz/ | v. 使困惑 | Long docs often confuse developers. | confuse A with B 把 A 和 B 混淆 / confusing 令人困惑的 |
| divide | /dɪˈvaɪd/ | v. 拆分；划分 | Divide the sentence into parts. | divide... into... 把……分成…… / divide and conquer 分而治之 |
| logic | /ˈlɑːdʒɪk/ | n. 逻辑 | ...expand the logic that makes... | business logic 业务逻辑 / logic error 逻辑错误 |
| complex | /kəmˈpleks/ | adj. 复杂的 | Complex sentences can seem unreadable. | complex system 复杂系统 / overly complex 过于复杂 |
| readable | /ˈriːdəbl/ | adj. 易读的 | ...makes a complex doc readable. | human-readable 人类可读的 / more readable 更易读 |
| expand | /ɪkˈspænd/ | v. 扩展 | ...you will expand the logic... | expand the scope 扩大范围 / expandable 可扩展的 |

### 2.1 高频拓展词群（为 L09《高频词群实战 II·观点句词群》铺垫）

| 词 | 课文句 | 高频搭配 |
|----|--------|---------|
| point | ...it carries the **main point**. | the main point 主要观点 / to the point 切中要害 / make a point 陈述观点 |
| describe | ...it **describes** details... | describe a problem 描述问题 / describe... as... 把……描述为 |
| replace | ...**replaces** a task list... | replace A with B 用 B 替换 A / replace entirely 完全替换 |
| split | **Split** it again... | split... into... 把……拆成 / split up 拆分 / code split 代码分割 |
| connect | ...**connect** the parts with questions... | connect A to B 把 A 接到 B / connect with 与……建立联系 |

> 这 5 个词将并入 L09《高频词群实战 II·观点句词群》的搭配网（为该讲铺垫），本讲先混个脸熟。

---

## 3. 语法点拆解

### 3.1 主句与从句：函数嵌套的两个角色

读长句先把「嵌套」拆出来。三个术语的定义卡：

| 术语 | 一句话定义 | 课文例句 |
|------|-----------|---------|
| **主句**（main clause） | 能独立成句、不被任何引导词领起的那一截，是全句的「入口函数」 | The main clause is the entry function. |
| **从句**（clause） | 由引导词领头、自带主谓、整体只充当一个句子成分的「嵌套调用」 | **When** you meet one, treat it like nested functions. |
| **引导词**（linker） | 从句开头的连接词，既领起从句，也标出它与主句的关系 | **why** a build fails / **that** makes a complex doc readable |

读长句三步：

1. **找谓语动词**：数出有几个主谓结构（呼应 Unit 01 三步判型法）
2. **切主句**：没被任何引导词领起的那一截就是主句
3. **收从句**：剩下的「引导词 + 主谓」整块就是从句，整体只算一个成分

### 3.2 提问法：给从句归类

从句属于哪类，不看引导词长相，看它在**回答什么问题**。把从句遮住提问，答案落在哪一格，它就是哪一类：

| 对从句提的问题 | 从句类型 | 整体充当什么 | 课文例句 |
|---------------|---------|-------------|---------|
| 什么 / 谁 | 名词性从句 | 名词（主语 / 宾语 / 表语） | ask **what each clause does** |
| 什么样的 / 哪个 | 定语从句 | 形容词（修饰前面的名词） | the logic **that makes a complex doc readable** |
| 何时 / 何地 / 为何 / 如何 | 状语从句 | 副词（修饰整句或谓语） | **When you meet one**, treat it like nested functions |

提问法三步：

1. **定问题**：遮住从句，看主句缺什么、在问什么
2. **对答案**：什么 / 谁 → 名词性；什么样的 / 哪个 → 定语；何时 / 何地 / 为何 / 如何 → 状语
3. **验一遍**：把从句换成一个词组，句子还通，类型就对了

课文例句标注：

| 课文片段 | 遮住从句后问 | 类型 |
|---------|-------------|------|
| **When you meet one**, treat it like nested functions. | 何时 treat…？ | 状语从句 |
| ...tells you **why a build fails**. | 告诉你什么？ | 名词性从句 |
| ...the logic **that makes a complex doc readable**. | 什么样的逻辑？ | 定语从句 |
| ...ask **what each clause does**. | 问什么？ | 名词性从句 |

引导词总览（只做识别预览，L02~L07 逐类展开）：

| 引导词 | 常领起 | 课文 / 预告 |
|--------|--------|------------|
| that | 名词性 / 定语从句 | the logic **that** makes...（定语） |
| which / who | 定语从句 | L02 展开，本讲先认出它们是引导词 |
| where / when / why | 三类都可能，看提问法 | **when** you meet one（状语）；**why** a build fails（名词性） |
| if / whether | 名词性（是否）/ 条件状语从句 | L05 / L07 展开 |
| because / although | 原因 / 让步状语从句 | L07 展开 |

> 💡 **陷阱一：why ≠ 状语**。I know **why the build failed** 答「知道什么？」→ 名词性；从句坐的是 know 的宾语位。

> 💡 **陷阱二：一个分句只留一个引导词**。because 与 so、although 与 but 不同框：❌ Because the docs are long, **so** I split them. → ✅ Because the docs are long, I split them.

### 3.3 课文复现自查

本讲课文中出现的已入账词：developer / seem / task / tell / build / fail / get / run / check / make / keep / improve（developers / tells / fails / gets / makes 归并到词条）— 共 12 个旧词词条，原始分数 **12/74**（旧词词条 / 课文词形 type）≈ 16%；若按课文英文总词数（106 词）计为 12/106 ≈ 11%。两种口径均 ≥ 10%（一册常规讲阶段目标），达标。

---

## 4. 输出

1. **复述**：用 2~3 句英文复述「读长句 = 嵌套调用」的比喻，并说出提问法三分（什么 / 哪个 / 何时）
2. **仿写（核心）**：以「读文档 / 写代码」为主题写 3 句，名词性 / 定语 / 状语从句各一。参考起点：
   - 名词性：I forget **what the flag does**.
   - 定语：This is the tool **that saves me hours**.
   - 状语：**When the build fails**, I read the log first.
3. **自检**：给每句的从句标注「提问 → 类型 → 引导词」，确认三类各一

---

## 5. 配套练习

- 题目：[L01 练习](practice.md)（基础层必做，强化层选做，答案在文末）
- 错题记录：

| 题号 | 错因 | 回流安排 |
|------|------|---------|
|      |      |         |

---

## 6. 本讲小结

- [ ] 能用一句话说清主句与从句的分工（入口函数 / 嵌套调用）
- [ ] 能用提问法把任意从句归入名词性 / 定语 / 状语三类
- [ ] 能在课文里指认三类从句各一例，并说出引导词
- [ ] 知道两个陷阱：why ≠ 状语；because 与 so 不同框
- [ ] 仿写三句（三类从句各一）且「提问 → 类型」标注正确
- [ ] 基础层练习正确率 ≥ 80%

---

🔗 下一讲：[L02 定语从句 I —关系代词 who / which / that](../L02-定语从句I-关系代词/lesson.md)
