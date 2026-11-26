# L02 练习：动词形态与时态坐标系

> 配套 [第 2 讲](lesson.md)。基础层必做，强化层选做。答案在文末，做完再看。

---

## 基础层

**1. 补全形态表**：写出下列动词的过去式与过去分词。

| 原形 | 过去式 | 过去分词 |
|------|--------|---------|
| build | | |
| run | | |
| break | | |
| log | | |

**2. 选形态填空**（括号内为动词与坐标提示）：

1. She ___ (deploy, 现在 × 一般) to production every Friday.
2. The pipeline ___ (run, 现在 × 进行) now; do not restart it.
3. Yesterday the build ___ (break, 过去 × 一般) again.
4. I ___ (fix, 现在 × 完成) the bug already.
5. While I ___ (read, 过去 × 进行) the log, the alarm rang.

**3. 判断形态**：写出划线动词的形态名（原形 / 三单 / 过去式 / 进行 / 完成分词）。

1. The script **checks** every commit.
2. A typo **broke** the build.
3. I was **reading** the log.
4. She has **deployed** the release.

**4. 改错**：

1. He run the tests every morning.
2. The build breaked twice yesterday.
3. She have deployed the release.

**5. 课文理解与语法**：先读课文，再作答；每题只有一个正确选项。

1. 根据课文，昨天流水线发生了什么？
   A. 顺利通过了所有测试
   B. 被同事手动停掉了
   C. 发布了新版本
   D. 失败了两次
2. 课文里，作者计划什么时候部署这次发布（the release）？
   A. 周五
   B. 今天
   C. 下个月
   D. 上周就部署完了
3. 课文中坏掉的构建为什么永远到不了生产环境？
   A. 因为每天只跑一次测试
   B. 因为同事会手动复核
   C. 因为自动化持续检查每一次提交
   D. 因为流水线只在周五运行
4. 课文说「三单」（builds / runs）在整个动词形态体系里是什么？
   A. 第五种形态
   B. 原形在一般现在时的变位，不是第五种形态
   C. 过去分词的一种
   D. 动词原形
5. 现在完成时由「have / has + ___」构成，横线处应填哪种形态？
   A. 过去分词
   B. 动词原形
   C. 过去式
   D. 现在分词（-ing）
6. 课文给出的「三步定位法」，正确顺序是？
   A. 选体 → 定时间轴 → 找时间标志词
   B. 定时间轴 → 找时间标志词 → 选体
   C. 找时间标志词 → 选体 → 定时间轴
   D. 找时间标志词 → 定时间轴 → 选体

---

## 强化层

**6. 造句**：用 build 的四种形态（原形 / 过去式 / 进行 / 过去分词）各写一句，主题是你的项目。

**7. 坐标定位**：说出下列句子的「时间 × 体」坐标。

1. My butler sends me a summary every morning.
2. I was fixing the bug when the alarm rang.
3. She has already restarted the pipeline.

---

## 答案


**1.** build → built / built；run → ran / run；break → broke / broken；log → logged / logged

**2.**
1. deploys — every Friday 习惯 → 现在一般，三单加 -s（还原：she deploys = she does deploy every Friday）
2. is running — now + 正在进行 → 现在进行（排除 runs：runs 表习惯，与 now 矛盾）
3. broke — yesterday + break 不规则：break → broke → broken（breaked 不存在）
4. have fixed — already + 对现在的影响 → 现在完成；fix 是规则动词：fix → fixed → fixed
5. was reading — While + 过去进行作背景；主句 the alarm rang 用一般过去（背景 vs 插入事件）

**3.**
1. 三单（checks = check + s，一般现在第三人称）
2. 过去式（broke 是 break 的不规则过去式）
3. 现在分词（reading 是 was reading 进行结构中的 -ing 形态）
4. 过去分词（deployed 在 have 后构成完成式）

**4.**
1. He **runs** the tests every morning. — every morning 习惯 → 三单加 -s
2. The build **broke** twice yesterday. — break 的过去式是不规则 broke
3. She **has** deployed the release. — 主语 she 三单，助动词用 has（have → has）

**5.**
1. D — 第 3 句：Yesterday it failed twice.
2. A — 第 7 句：Not yet — my calendar says Friday.
3. C — 第 8 句：Automation keeps checking every commit, so broken builds never reach production.
4. B — 语法 3.1 注：三单（builds / runs）不是第五种形态，只是原形在一般现在时的变位。
5. A — 语法 3.2：现在 × 完成 = has built，由 have / has + 过去分词构成。
6. D — 语法 3.3 三步定位法：找时间标志词 → 定时间轴 → 选体。

**6.**（主观题 — 参考要点）
- 要点覆盖：四句分别用 build 的原形、过去式（built）、进行（building）、过去分词（built，配合 have/has 或 be 动词）
- 自检要点：过去分词 built 必须出现在 have/has 或 be 之后，不能单独作谓语；进行句必须有 be

**7.**
1. 现在 × 一般（every morning 习惯，三单 sends）
2. 过去 × 进行（was fixing = 过去的某段时间内正在做）
3. 现在 × 完成（has already restarted，already 是完成时标志，影响延续到现在）
