# 第 2 讲：动词形态与时态坐标系

> **第一册 · Unit 01 · Lesson 02** ｜ 预计用时 60 分钟
> 学完本讲你能：建立「时间 × 体」二维坐标系，看懂时态地图的 9 个常用格（完成进行体留待后续），掌握 do / did / doing / done 四种形态的变换逻辑。

---

## 1. 课文精读

**The Butler Gets Busier**

> My digital butler is busier now. Every morning, the script builds the code, runs the tests, and sends me a summary. Yesterday it failed twice. A typo broke the build; I fixed it and restarted the pipeline. Later, a test failed again, and the log showed a missing dependency. While I was reading the log, a teammate asked, "Have you deployed the release?" Not yet — my calendar says Friday. Automation keeps checking every commit, so broken builds never reach production. Developers call this routine a superpower: the pipeline repeats the same task all day, checks everything, and never gets tired. I just automate, drink coffee, and watch the green ticks.

**参考译文**

> 我的数字管家现在更忙了。每天早上，脚本构建代码、跑测试、给我发一份摘要。昨天它失败了两次。一个拼写错误弄挂了构建；我修好它，重启了流水线。后来一个测试又失败了，日志显示缺了一个依赖。我正在读日志的时候，一位同事问："发布部署了吗？"还没有——我的日历写着周五。自动化持续检查每一次提交，所以坏掉的构建永远到不了生产环境。开发者管这套日常叫超能力：流水线整天重复同一个任务，检查一切，永不疲倦。我只管自动化、喝咖啡、看绿色对勾。

**关键句解析**

| 句子 | 拆解 |
|------|------|
| Every morning, the script **builds** the code, **runs** the tests, and **sends** me a summary. | 三个动词并列、共享主语 the script；一般现在时表日常习惯（L03 展开） |
| Yesterday it **failed** twice. A typo **broke** the build; I **fixed** it and **restarted** the pipeline. | yesterday 是时间锚点 → 一般过去时；四个过去式并列叙事 |
| **While I was reading** the log, a teammate asked, "**Have you deployed** the release?" | 过去进行作背景 + 现在完成问影响 — 各占坐标系一格（L03 / L04 展开） |

---

## 2. 词汇与词组

> 本讲精讲 6 词 + 词群 6 词，共 12 词。词群全部是动词 — 正好用来示范四种形态。

| 单词/词组 | 音标 | 释义 | 课文例句 | 拓展搭配 |
|-----------|------|------|----------|----------|
| pipeline | /ˈpaɪplaɪn/ | n. 流水线 | I fixed it and restarted the pipeline. | CI/CD pipeline |
| dependency | /dɪˈpendənsi/ | n. 依赖（库） | the log showed a missing dependency | add a dependency 添加依赖 |
| commit | /kəˈmɪt/ | n. 提交 / v. 提交 | Automation keeps checking every commit. | commit message；commit a mistake 犯错 |
| deploy | /dɪˈplɔɪ/ | v. 部署 | Have you deployed the release? | deploy to production |
| release | /rɪˈliːs/ | n. 发布 / v. 发布 | Have you deployed the release? | release notes 发布说明 |
| fix | /fɪks/ | v. 修复 | I fixed it and restarted the pipeline. | fix a bug；a quick fix |

### 2.1 高频拓展词群（动词的四种形态素材）

| 词 | 课文句 | 高频搭配 |
|----|--------|---------|
| build | the script **builds** the code | build a feature；a build（构建产物，名动同形） |
| run | **runs** the tests | run a test；in the long run 长远看 |
| fail | it **failed** twice | fail a test；fail to do sth |
| restart | I **restarted** the pipeline | restart the server |
| break | a typo **broke** the build | break the build；break a habit |
| log | the **log** showed a missing dependency | check the logs；log in / log out |

---

## 3. 语法点拆解

### 3.1 动词的四种形态

| 词 | 原形 | 过去式 | 进行（-ing） | 完成（过去分词） |
|----|------|--------|-------------|-----------------|
| build | build | **built** | building | **built** |
| run | run | **ran** | runn**ing**（双写） | **run** |
| fail | fail | failed | failing | failed |
| restart | restart | restarted | restarting | restarted |
| break | break | **broke** | breaking | **broken** |
| log | log | **logged**（双写） | logging | **logged** |

> 三单（builds / runs）不是第五种形态，只是原形在一般现在时的变位。**不规则动词（built / ran / broke / broken）只能单独记** — 好在它们全是高频词。

### 3.2 时态坐标系：时间 × 体

| | 一般 | 进行 | 完成 |
|---|------|------|------|
| **现在** | builds（习惯） | is building（此刻） | has built（影响至今） |
| **过去** | built（L02 课文主线） | was building（背景） | had built（过去的过去，L04） |
| **将来** | will build（L05） | will be building（少用） | will have built（少用） |

课文句子定位：`builds` → 现在 × 一般；`failed / broke` → 过去 × 一般；`was reading` → 过去 × 进行；`Have you deployed` → 现在 × 完成。

### 3.3 三步定位法

1. **找时间标志词**：yesterday / every morning / now / since...
2. **定时间轴**：过去、现在还是将来？
3. **选体**：一次性的（一般）？正在进行的（进行）？和现在挂钩的（完成）？

💡 同一个动词，坐标一动，形态就动 — 先定位，再变形，不要凭感觉。

---

## 4. 输出

1. **复述**：用 3 句英文复述课文（管家更忙 → 昨天挂两次 → 发布定在周五）
2. **仿写（核心）**：用 build / run / fail / fix 的不同形态各写一句你的真实工作流。参考起点：
   - 一般：I run tests before every commit.
   - 过去：Yesterday the build failed again.
   - 进行：I am fixing a flaky test.
   - 完成：I have fixed three bugs today.
3. **自检**：把你的 4 句标到 3.2 的坐标系上，说出每句的「时间 × 体」。

---

## 5. 配套练习

- 题目：[L02 练习](practice.md)（基础层必做，强化层选做，答案在文末）
- 错题记录：

| 题号 | 错因 | 回流安排 |
|------|------|---------|
|      |      |         |

---

## 6. 本讲小结

- [ ] 能默写 build / run / break 的四种形态（含不规则）
- [ ] 能画出「时间 × 体」坐标系并说出 9 个常用格
- [ ] 会用三步定位法把句子放进坐标系
- [ ] 仿写 4 句覆盖 4 个不同坐标
- [ ] 基础层练习正确率 ≥ 80%

---

🔗 下一讲：[L03 一般与进行时态](../L03-一般与进行时态/lesson.md)
