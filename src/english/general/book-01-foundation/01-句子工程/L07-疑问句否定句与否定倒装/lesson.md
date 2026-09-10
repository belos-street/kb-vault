# 第 7 讲：疑问句、否定句与否定倒装

> **第一册 · Unit 01 · Lesson 07** ｜ 预计用时 60 分钟
> 学完本讲你能：会构造一般 / 特殊疑问句与否定句；能识别 Never have I... 类否定倒装并还原语序。

---

## 1. 课文精读

**Ask the Senior Dev**

> New joiners always ask me the same questions. "How do you debug a bug you cannot reproduce?" Open the logs first; check the timeline, and never guess before you read. "What should you never do on a Friday afternoon?" Deploy. Never have I seen a calm Friday release — the universe loves to test us on weekends. "Does the senior developer know everything?" No. Nobody knows everything; we just know where to look. Rarely does the first fix work, so keep three ideas in your pocket and run them one by one. And never skip code review: your future self will thank you.

**参考译文**

> 新同事总是问我同样的问题。"你怎么调试一个无法复现的 bug？"先打开日志；核对时间线，读完之前永远不要瞎猜。"周五下午永远不该做什么？"部署。我从没见过一次平静的周五发布——宇宙就爱在周末考验我们。"资深开发者无所不知吗？"不。没人无所不知；我们只是知道去哪找答案。第一个修复很少能一次成功，所以口袋里备三个思路，挨个试。还有：永远别跳过代码评审——未来的你会感谢现在的你。

**关键句解析**

| 句子 | 拆解 |
|------|------|
| **How do you debug** a bug? | 特殊疑问 = 疑问词 + 一般疑问语序（do + 主语 + 动词原形） |
| **Never have I seen** a calm Friday release. | 否定倒装：Never + 助动词 have + 主语 I + 过去分词；还原 = I have never seen... |
| **Nobody knows** everything. | nobody 否定主语 → 谓语用**肯定式**单数（L06 呼应） |
| **Rarely does** the first fix **work**. | rarely 否定副词前置 → 倒装 does + 主语 + work；还原 = The first fix rarely works. |

---

## 2. 词汇与词组

> 本讲精讲 6 词 + 词群 4 词，共 10 词。

| 单词/词组 | 音标 | 释义 | 课文例句 | 拓展搭配 |
|-----------|------|------|----------|----------|
| reproduce | /ˌriːprəˈduːs/ | v. 复现；重现 | a bug you cannot reproduce | reproduce the issue 复现问题 |
| senior | /ˈsiːniər/ | adj. 资深的 | the senior developer | senior engineer 高级工程师 |
| universe | /ˈjuːnɪvɜːrs/ | n. 宇宙 | the universe loves to test us | the universe of X（领域） |
| pocket | /ˈpɑːkɪt/ | n. 口袋 | keep three ideas in your pocket | in one's back pocket 备用 |
| skip | /skɪp/ | v. 跳过 | never skip code review | skip a step |
| calm | /kɑːm/ | adj. 平静的 | a calm Friday release | stay calm 保持冷静 |

### 2.1 高频拓展词群

| 词 | 课文句 | 高频搭配 |
|----|--------|---------|
| debug | How do you **debug** a bug? | debug a program；debugger 调试器 |
| guess | never **guess** before you read | make a guess；a wild guess 瞎猜 |
| review | never skip code **review** | code review；peer review 互审 |
| thank | your future self will **thank** you | thank sb for sth |

---

## 3. 语法点拆解

### 3.1 疑问句三型

| 类型 | 构造 | 课文 |
|------|------|------|
| 一般疑问 | Do/Does/Did + 主语 + 动词原形? | **Does** the senior developer **know** everything? |
| 特殊疑问 | 疑问词 + 一般疑问语序 | **How do** you **debug** it? |
| 主语疑问 | 疑问词直接做主语，**不加 do** | **Who** broke the build?（不是 Who did break） |

> ❌ How you fixed it? → ✅ How did you fix it?（疑问词后面必须是完整疑问语序，且过去式还原为原形交给 did）

### 3.2 否定句

| 手段 | 位置 | 例 |
|------|------|-----|
| not | 助动词 / be 之后 | We do **not** guess. |
| never | 实义动词前 / be 后 | We **never** guess. / She is **never** late. |
| nobody / nothing | 作主语 → 谓语**肯定式**单数 | **Nobody knows** everything. |

### 3.3 否定倒装（否定副词前置 → 倒装）

- 触发词：Never / Rarely / Seldom / Hardly / Not only（句首时）
- 公式：**否定词 + 助动词 + 主语 + 动词**

| 倒装（强调） | 还原（平装） |
|--------------|--------------|
| Never **have I seen** a calm Friday release. | I have never seen a calm Friday release. |
| Rarely **does the first fix work**. | The first fix rarely works. |
| Not only **did we lose** data, but we also lost trust. | We not only lost data, but... |

💡 倒装是强调手段：把否定词提到句首，"立场"先声夺人。写作中一篇文章最多用一次，多了像喊口号。

---

## 4. 输出

1. **复述**：用 3 句复述本文给新人的建议，其中 1 句用否定倒装
2. **仿写（核心）**：给新人写 4 条建议 — 1 条一般疑问问答、1 条特殊疑问问答、1 条 never 祈使、1 条 Never have I 感慨。参考起点：
   - 一般疑问问答：Does the linter pass? Then you may commit.
   - 特殊疑问问答：Why do we freeze the codebase? Because Friday deploys hurt.
   - never 祈使：Never push to main directly.
   - 倒装：Never have I regretted writing tests.
3. **自检**：把你的倒装句还原成平装 — 语序还原得回去才算写对。

---

## 5. 配套练习

- 题目：[L07 练习](practice.md)（基础层必做，强化层选做，答案在文末）
- 错题记录：

| 题号 | 错因 | 回流安排 |
|------|------|---------|
|      |      |         |

---

## 6. 本讲小结

- [ ] 一般 / 特殊疑问句构造零失误（did + 原形）
- [ ] 主语疑问句不加 do
- [ ] nobody 主语 → 肯定式单数谓语
- [ ] 会把否定倒装还原成平装并互相转换
- [ ] 基础层练习正确率 ≥ 80%

---

🔗 下一讲：[L08 综合实战：技术短文句析](../L08-综合实战-技术短文句析/lesson.md)
