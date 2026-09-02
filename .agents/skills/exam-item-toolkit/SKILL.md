---
name: "exam-item-toolkit"
title: 考试题库工具箱（命题 + 审题）
description: 为考试类科目（考研数学、408、考研英语、考研政治等）设计分层、可核验、答案分离的练习题库，并对题目做正确性与规范性审查。用户说"出一套练习题/每章题库/模拟卷"、"review 题库/检查题目答案"、"出 408 选择题/英语阅读题"时触发。
metadata:
  tags: [exam, question-design, question-review, multi-subject]
---

# 考试题库工具箱

为考试类科目提供「命题 → 审题」完整闭环：先按考点-难度矩阵设计**零重复、可核验、答案分离**的题库，再按六维标准逐题审查。核心手段按科目实例化（数学 / 408 / 英语 / 政治），见 [subject-adaptation.md](reference/subject-adaptation.md)。

## 什么时候用

- "给 XX 科目出一套练习题 / 每章题库 / 综合模拟卷"
- "review 一下这套题库 / 检查题目答案对不对"
- "出 408 选择题" / "出英语阅读题" / "出一套政治模拟卷" / "给题目分层 / 标注难度"

## 速查表

| 使用场景 | 读哪个 reference |
|----------|------------------|
| 设计题库（考点矩阵 → 逐题设计 → 核验 → 输出规范 → 回归验证） | [question-design.md](reference/question-design.md) |
| 标注难度层级（B/S/T 三档）、题面格式、限时与配比参考 | [difficulty-tiers.md](reference/difficulty-tiers.md) |
| 审查题库（逐题换路径核验 → 六维评定 → P0/P1/P2 报告 → 修改闭环） | [question-review.md](reference/question-review.md) |
| **跨科目使用 / 新科目接入**（核验手段、格式检查、特殊坑按科目实例化） | [subject-adaptation.md](reference/subject-adaptation.md) |

## 两条铁律（命题与审题共用，按科目实例化）

1. **设计即核验**：写出题目的同时，必须用 **≥2 条相互独立的依据链** 得出并确认答案，禁止"先写题、后补答案"。数学 = 换解法复算 + 特值回代；408 = 定义反推 / 构造反例 / 代值重算；英语 = 原文定位复核；政治 = 大纲原文对照。详见 [subject-adaptation.md](reference/subject-adaptation.md)。
2. **审查即核验**：审题不复用题目自带的解题思路，换一条依据链重做；每条 P0 判定标注验证状态（已核验 / 存疑），凭"看起来不对"下的结论不得写入报告。主观题（英语写作/翻译、政治分析题）不适用逐题复算，只审 rubric 要点覆盖。

## 流程概览

```mermaid
flowchart LR
    A["读大纲 + 建查重基线"] --> B["考点-难度矩阵"]
    B --> C["逐题设计<br/>零重复 / 对照 / 陷阱"]
    C --> D["设计即核验<br/>（≥2 条依据链）"]
    D --> E["题库交付<br/>（题目与答案分离）"]
    E --> F["审查：逐题换路径核验"]
    F --> G["六维评定 + P0/P1/P2 报告"]
    G --> H["修改闭环 + 回归验证"]
    H -.->|"修改后重审"| F
```

## 质量红线

- 题目数 = 答案数，B/S/T 编号一一对应（错位记 P0）
- 答案算错、解析步骤错误、超纲内容标进考纲，均为 P0
- 命题与已有教学文档练习**零重复**（数字、结构、问法三维度）
- 交付前回归验证：编号对齐、查重、结构配对（格式类检查项按科目替换，见 [subject-adaptation.md](reference/subject-adaptation.md)）
