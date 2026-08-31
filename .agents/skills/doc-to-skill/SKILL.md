---
name: "doc-to-skill"
title: 教学文档 → Skill 集合转换器
description: 把一套教学文档蒸馏成独立、可搬走的 Skill 集合：在对应教学目录下生成与 `doc/`、`src/` 并列的 `skill/`（`SKILL.md` + `reference/*.md`），产物与教程解耦、不绑受众、可复制到任意项目独立使用。用户说"把这套教程转成 skill"、"给这个教程生成 skill 集合"时触发。
metadata:
  tags: [conversion, skill-factory, distillation, tutorial]
---

# 教学文档 → Skill 集合转换器

把「给人学的一整套教学文档」蒸馏成「给人 + 给 LLM 可直接复用的 Skill 集合」。目标是**生成一套脱库可用**的 skill——复制到别的项目也能独立运作，而不是照搬教程正文。

## 什么时候用

- 用户指着某个教学区（含 `readme.md` + `doc/`，可再有 `src/`），说：把这套转成 skill、帮我生成它的 skill 集合。
- 教学区示例：`src/front/visual/d3/`、`src/artificial-intelligence/handcrafted/`。

## 输入

| 要素 | 说明 |
|------|------|
| 目标教学区 | 一个目录，含 `readme.md`（大纲/模块规划）+ `doc/NN-模块/篇.md`（篇章正文） |
| 可选 | `src/` 配套代码、README §6.2 之类设计约定 |

## 输出：目录形态

在**教学区（一级）**内新建 `skill/`（二级），与 `doc/`、`src/` 并列。**扁平结构**：一个集合入口 + 一个 `reference/`，能力直接作为独立主题文件，不层层包文件夹：

```
front/visual/d3/            # 一级：教学区
  doc/                      # 教程正文
  src/                      # 配套代码
  skill/
    SKILL.md                # 集合入口：定位 + "使用场景 → 读哪个 reference" 速查表
    reference/
      update-pattern.md     # 一个自洽能力 = 一个主题文件
      transitions.md
      ...
```

- 不做 `skill/<能力>/SKILL.md` 这种每能力一层子目录。
- 每个能力是一个 `reference/<topic>.md`，自包含地讲清"什么场景、怎么做、坑、决策、一句话结论"。

## 核心规则

1. **粒度自由**：不规定"一篇一个"或"一模块一个"。按教程大纲的**自洽能力块**拆——一个能力可跨篇，一篇也可拆出多个能力。多少由内容定，宁可合并、不要碎片。
2. **独立解耦**：产物自包含，脱离 `doc/` 也能用。历史/教学铺垫一律不进 skill，只留可执行的知识与方法。
3. **不绑受众**：产物是通用能力，可被任何人复用。**禁止**出现教学区专属语境，如"与 JS/TS 心智映射""面向已有 XX 经验者""本文档你将学到"。类比术语（如 `go.mod ≈ package.json`）可保留作点缀，但不做专门的受众对照章节。
4. **零仓库路径**：产物 frontmatter 与正文**都不写**教学区相对路径（`metadata.source` 也别写），保证搬到任意项目不失效。
5. **人机兼读**：用中文、适量 emoji；含 "什么时候用、怎么做、常见坑、判断点、速查"。不写"本模块本周学完"这类过程话术。
6. **不照抄**：萃取本质（核心机制、决策点、踩坑点、面试关键结论），不搬运教程的逐行讲解与长代码块。

## 工作流

1. **读大纲定边界**：读 `readme.md`，按其模块划分 + 作者画像（受众/掌握度）确定能力边界与能力数量。
2. **拆能力块**：按"一个能力 = 一个可独立交付的能力"拆分。每个能力给一个短英文名（如 `d3-update-pattern`）作 `reference/` 文件名。
3. **读篇章蒸馏**：对每个能力覆盖的篇，读正文，抽出：核心概念与机制、关键 API/公式、常见踩坑、机动决策点（用哪个方案/参数）、与同类方案的取舍对照、一句话结论。
4. **写产物**（见 reference）：
   - 集合入口 `skill/SKILL.md`：frontmatter（`name`/`title`/`description`/`tags`）+ 一句话定位 + "使用场景 → 读哪个 reference" 速查表。**不写**源路径。
   - 每个能力 `reference/<topic>.md`：命名遵循仓库命名规范（见 `belos-street/reference/naming-conventions.md`），结构遵循 `reference/skill-writing-template.md` 内模板。
5. **校验**：按 `reference/skill-quality-review.md` 八维评审细则逐项核查产物。验证每个能力脱离教学区也能自洽（不引用 `doc/` 路径）；入口速查表无死链；Mermaid 图语法正确。对关键结论/API 用官方文档（WebFetch/WebSearch）交叉核验，改完写错即改，并回填进各能力的"参考：官方文档"小节。命中红线项必须先修完再交付。

## 质量验收

- [ ] `skill/` 与 `doc`/`src` 并列，位于一级教学区内
- [ ] 扁平结构：`SKILL.md` + 单个 `reference/`，无逐能力子目录包裹
- [ ] 粒度合理：无碎片化能力，无"全部教程硬塞一个 skill"
- [ ] 每个能力自包含、可独立搬走，零 `doc/` 相对引用、零源路径
- [ ] 不绑受众：无"与 XX 心智映射/面向 XX 群体"等教学区专属语境
- [ ] 人机兼读：有触发场景、有可执行步骤、有坑点速查
- [ ] 与原文解耦但忠实于实质：不误解作者的关键结论
- [ ] 关键结论/API 已用官方文档核验，并在各能力留"参考：官方文档"链接
- [ ] 风格对齐仓库：中文、适量 emoji、Mermaid 图、`reference/` 分主题

## 参考

- 蒸馏原则与讲解：[reference/distillation-principles.md](reference/distillation-principles.md)
- 生成 skill 的写作模板：[reference/skill-writing-template.md](reference/skill-writing-template.md)
- skill 产物质量评审细则：[reference/skill-quality-review.md](reference/skill-quality-review.md)