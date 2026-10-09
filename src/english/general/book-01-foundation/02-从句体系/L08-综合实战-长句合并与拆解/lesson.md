# 第 8 讲：综合实战 —长句合并与拆解

> **第一册 · Unit 02 · Lesson 08** ｜ 预计用时 70 分钟
> 学完本讲你能：用合并三法把简单句升级为复合句，用拆解三步分析任意 40 词以内的长句。

---

## 1. 课文精读

**Docs Can Carry Tech Debt Too**

> Developers know that code can carry tech debt（技术债）, but few notice that a doc can carry it too. When a passage（段落） is no longer accurate, the team that trusts it repeats mistakes.
>
> Our fix is a flow: outline the topic, arrange the details, and combine short sentences when ideas connect. We separate a long sentence when its clauses（从句） hide two ideas, and adjust it until the logic is clear. We polish each passage until every fact we keep is accurate and every command runs.
>
> A colleague verifies every command before we publish, because a doc nobody can follow is still debt. When the review doubts a claim, we revise it immediately, because a doc that fails the check must not ship. Because we maintain the flow, docs stay accurate, and readers who hit delays now trust every release. We combine what belongs together, and separate what hides two ideas.

**参考译文**

> 开发者都知道代码会背上技术债，却很少有人注意到文档也会背债。当一个段落不再准确时，信任它的团队就会重复犯错。
>
> 我们的解法是一套流程：概述主题、安排细节，并在观点相连时合并短句。当一个长句的从句藏了两个观点时，我们把它拆开，再调整顺序直到逻辑清楚。我们打磨每个段落，直到留下的每个事实都准确、每条命令都能跑通。
>
> 发布之前，一位同事会验证每条命令，因为没人能照着做的文档依然是债。当评审质疑某个说法时，我们立刻修改，因为过不了检查的文档绝不能上线。因为我们维护这套流程，文档保持准确，曾经被拖延坑过的读者如今信任每一次发布。我们把属于一起的内容合并，把藏着两个观点的内容分开。

**关键句解析**

| 句子 | 拆解 |
|------|------|
| Developers know **that code can carry tech debt**, but few notice **that a doc can carry it too**. | 两个名词性从句（宾语从句）：that 只引导、不作从句成分（从句内部主谓宾齐全）；提问「知道 / 注意到什么？」→ 名词性 |
| **When a passage is no longer accurate**, the team **that trusts it** repeats mistakes. | 一句嵌套两类从句：When 引导时间状语从句（何时犯错？），that trusts it 是定语从句修饰 the team（什么样的团队？） |
| A colleague verifies every command **before we publish**, because **a doc nobody can follow** is still debt. | before / because 各领一个状语从句（何时？为何？）；nobody can follow 前省略关系代词 that，是修饰 a doc 的定语从句 |
| **When the review doubts a claim**, we revise it immediately, because **a doc that fails the check** must not ship. | when + because 双状语从句，because 从句内部再嵌 that fails the check 定语从句（修饰 a doc） |
| We combine **what belongs together**, and separate **what hides two ideas**. | 两个 what 名词性从句分别作 combine / separate 的宾语（what = the thing(s) that，L06 双重身份复习） |

---

## 2. 词汇与词组

> 本讲精讲 7 词 + 词群 5 词，共 12 词。

| 单词/词组 | 音标 | 释义 | 课文例句 | 拓展搭配 |
|-----------|------|------|----------|----------|
| combine | /kəmˈbaɪn/ | v. 合并 | We combine what belongs together | combine A with B 把 A 和 B 结合 / combine... into... 把……合并成…… |
| separate | /ˈsepəreɪt/ | v. 分开 | separate what hides two ideas | separate A from B 把 A 和 B 分开 / separate into 分成 |
| passage | /ˈpæsɪdʒ/ | n. 段落 | we polish each passage | a passage of text 一段文本 / read the passage 读段落 |
| accurate | /ˈækjərət/ | adj. 准确的 | docs stay accurate | accurate information 准确的信息 / accurate to 精确到 |
| maintain | /meɪnˈteɪn/ | v. 维护 | we maintain the flow | maintain the docs 维护文档 / maintainable adj. 可维护的 |
| flow | /floʊ/ | n. 流程 | Our fix is a flow | workflow 工作流 / data flow 数据流 / follow the flow 顺着流程走 |
| revise | /rɪˈvaɪz/ | v. 修改 | we revise it immediately | revise a draft 修改草稿 / revision n. 修订 |

### 2.1 高频拓展词群（为 L09《高频词群实战 II·观点句词群》铺垫）

| 词 | 课文句 | 高频搭配 |
|----|--------|---------|
| outline（n./v. 大纲；概述） | **outline** the topic | outline a plan 概述计划 / in outline 扼要地 / an outline of ……的提纲 |
| arrange（v. 安排） | **arrange** the details | arrange for sb to do 安排某人做 / arrange in order 整理 / make arrangements 做安排 |
| adjust（v. 调整） | **adjust** it until the logic is clear | adjust to 适应 / adjust the order 调整顺序 / make an adjustment 做调整 |
| polish（v. 打磨） | we **polish** each passage | polish up 润色 / polish the wording 打磨措辞 / polished adj. 精致的 |
| verify（v. 验证） | A colleague **verifies** every command | verify a claim 验证说法 / verify with 向……核实 / verification n. 验证 |

> 这 5 个词将并入 L09《高频词群实战 II·观点句词群》的搭配网（为该讲铺垫），本讲先混个脸熟。

---

## 3. 语法点拆解

### 3.1 合并三法：把简单句「焊」成复合句

合并是拆解的逆运算：两个简单句之间本就有逻辑关系，用一个从句把关系说清楚，句子就升级为复合句。先定术语，再谈方法：

| 术语 | 一句话定义 | 课文例句 |
|------|-----------|---------|
| **简单句**（simple sentence） | 只有一套主谓、不含任何从句的句子 | Our fix is a flow. |
| **复合句**（complex sentence） | 主句 + 至少一个从句的句子 | **When a passage is no longer accurate**, the team **that trusts it** repeats mistakes. |
| **合并**（merge） | 把多个简单句压成一个复合句，句间逻辑交给从句承载 | We combine **what belongs together**. |

合并三法 —— 选哪法，看两个简单句之间是什么关系：

| 合并法 | 触发信号 | 操作 | 合并示例 |
|--------|---------|------|---------|
| ① 重复名词 → 定语从句 | 两句共用同一个名词 | 保留一处名词，另一处换成关系代词（who / which / that），连同其句子挂到名词后 | The team trusts it. ＋ The team repeats mistakes. → the team **that trusts it** repeats mistakes. |
| ② 先后 / 因果 → 状语从句 | 两个动作有先后、条件或因果 | 用 when / before / after / because 等把其中一句降级为状语从句 | We publish. ＋ A colleague verifies every command. → A colleague verifies every command **before we publish**. |
| ③ 陈述作宾 / 主 → 名词性从句 | 一句是另一句「说 / 知道 / 证实」的内容 | 用 that / what / why 把整个句子塞进宾语位或主语位 | We combine something. ＋ Something belongs together. → We combine **what belongs together**. |

> 💡 **陷阱一：合并后只留一个连接词**。because 与 so、although 与 but 不同框（L01 复习）：❌ Because the tests failed, **so** the deploy stopped. → ✅ Because the tests failed, the deploy stopped.

> 💡 **陷阱二：进宾语位的名词性从句一律陈述语序**（L05 复习）：❌ the runbook explains **why did the service crash** → ✅ the runbook explains **why the service crashed**.

### 3.2 拆解三步：划谓语 → 找连接词 → 判从句类型与成分

拿到 40 词以内的长句，按三步拆（合并的逆运算）：

1. **划谓语**：数出句中所有谓语动词 —— 有几个谓语，就有几套「主谓」等着被分配（包括从句内部的谓语）
2. **找连接词**：圈出 that / which / who / when / because / what / until…，每个连接词领起一个从句；警惕省略关系代词的定语从句（every fact **we keep**）
3. **判从句类型与成分**：用 L01 提问法遮住从句提问 —— 什么 / 谁 → 名词性；什么样的 → 定语；何时 / 为何 / 如何 → 状语 —— 再说出它整体充当什么成分（主语 / 宾语 / 定语 / 状语）

拆解示范（两组长句实跑一遍）：

| 课文长句 | 划谓语 | 找连接词 | 判从句类型与成分 |
|---------|--------|---------|----------------|
| When a passage is no longer accurate, the team that trusts it repeats mistakes. | is / trusts / repeats（3 个） | when / that | when 从句 = 状语（时间）；that 从句 = 定语（修饰 the team）；主句 = the team repeats mistakes |
| A colleague verifies every command before we publish, because a doc nobody can follow is still debt. | verifies / publish / can follow / is（4 个） | before / because /（nobody can follow 前省略 that） | before 从句 = 状语（时间）；because 从句 = 状语（原因）；nobody can follow = 定语（修饰 a doc） |

### 3.3 三大从句综合对照（对照 U02-L01 提问法收口）

| 从句类型 | 整体充当 | 常见引导词 | 遮住后提问 | 课文例句 |
|---------|---------|-----------|-----------|---------|
| 名词性从句 | 名词（主语 / 宾语 / 表语） | that / what / why / whether / if | 什么？谁？ | We combine **what belongs together**. |
| 定语从句 | 形容词（修饰前面的名词） | who / which / that / where / when / why / 省略 | 什么样的？哪个？ | the team **that trusts it** |
| 状语从句 | 副词（修饰整句或谓语） | when / before / because / although / until / if… | 何时？为何？如何？ | **When a passage is no longer accurate**, the team repeats mistakes. |

提问法三步（L01 收口，就是拆解第三步的判型工具）：

1. **定问题**：遮住从句，看主句缺什么、在问什么
2. **对答案**：什么 / 谁 → 名词性；什么样的 / 哪个 → 定语；何时 / 为何 / 如何 → 状语
3. **验一遍**：把从句换成一个词组、或整体移到句尾，句子还通、句意不变，类型就定了

> 💡 **提问法不看引导词长相**：why 既可领名词性从句也可领状语从句。The expert explained **why the queue was stuck** 答「解释了什么？」→ 名词性（L01 陷阱一复习）；只有答「为何？」修饰整句时才是状语从句。

### 3.4 课文复现自查

本讲课文英文共 149 词、词形 type 90 个，自然复现已入账旧词 22 个词条：developer、notice、trust、repeat、fix、detail、connect、logic、fact、keep、run、colleague、follow、review、doubt、claim、immediately、fail、check、ship、delay、release（developers / trusts / repeats / details / runs / fails / delays 归并到词条）。原始分数 **22/90**（旧词词条 / 课文词形 type）≈ 24%；若按课文英文总词数（149 词）计为 22/149 ≈ 15%。两种口径均 ≥ 10%（一册常规讲阶段目标），达标。

---

## 4. 输出

1. **复述**：用 2~3 句英文复述短文主线（问题 → 流程 → 验收 → 结果）
2. **合并练习（核心）**：用合并三法把下面 6 个简单句合成 4~5 句的短段（每法至少一次），主题：你的文档 / 代码维护流程。参考起点示例句群：
   - ① 重复名词 → 定语从句：The docs carry real value. / We review the docs every week.
   - ② 先后 → 状语从句：The tests fail. / The pipeline stops the deploy.
   - ③ 陈述作宾 → 名词性从句：The dashboard shows it. / The release is safe.
3. **自检**：用拆解三步给自己的合并句逐句标注「谓语 → 连接词 → 从句类型与成分」

---

## 5. 配套练习

- 题目：[L08 练习](practice.md)（基础层必做，强化层选做，答案在文末）
- 错题记录：

| 题号 | 错因 | 回流安排 |
|------|------|---------|
|      |      |         |

---

## 6. 本讲小结

- [ ] 能用合并三法把简单句升级为复合句（① 重复名词 → 定语 / ② 先后因果 → 状语 / ③ 陈述作宾 → 名词性，三法各举一例）
- [ ] 能用拆解三步分析 40 词以内的长句（划谓语 → 找连接词 → 判从句类型与成分）
- [ ] 能用 L01 提问法把任意从句归入名词性 / 定语 / 状语三类，并说出它整体充当什么成分
- [ ] 知道三个高频陷阱：because 与 so 不同框、名词性从句一律陈述语序、why 不等于状语
- [ ] 技术短文 10 个从句成分分析达标（练习 1）
- [ ] 基础层练习正确率 ≥ 80%

---

🔗 下一讲：[L09 高频词群实战 II —观点句词群](../L09-高频词群实战-观点句词群/lesson.md)
