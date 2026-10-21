# lesson.md 格式契约（模板即解析契约）

> 本文件是每课 `lesson.md` 的**书写与解析规范**：T2 schema、T3 解析器、crafter 生成、人工审校都以本文为准。
> 样例：[U01L03](book-01/U01-句子骨架/U01L03/lesson.md)（首篇样例课，格式以此为准）。
> 单源管线：`lesson.md` 唯一手写源 → `build-data` 解析 → `lesson.json` 产物（不手写）→ `validate` 校验。

---

## 1. 文件布局

```text
lessons/book-01/Uxx-单元名/UxxLnn/lesson.md
```

- 单元目录 = syllabus.json 的单元 id + 标题（如 `U01-句子骨架`）
- 课目录 = 课号（如 `U01L03`），与 lesson.md 首行课号一致（validate 断言）
- 课号格式 `U\d{2}L\d{2}`；讲义引用一律 `G\d{2}`（G01–G29 = grammar 讲义原 L01–L29）

## 2. 七件套结构（固定标题，解析按 `## N.` 切分）

```markdown
# UxxLnn：〈课标题〉
> 学完本课你能：〈一句话 outcome，与 syllabus.json 的 outcome 一致〉

## 1. 本课目标
## 2. 课文
## 3. 词汇表
## 4. 语法点精讲
## 5. 练习
### 5.1 理解（选择）
### 5.2 操练（替换）
### 5.3 产出（自判）
## 6. 小测
## 7. 深读
## 8. 参考答案与解析
```

节 → lesson.json 字段映射（§5.2 requirements）：

| 节 | 字段 |
|----|------|
| 标题行 / 引语 | `id` / `title` / `goal` |
| §2 | `reading.sentences[]` |
| §3 | `vocab[]` |
| §4 | `notes`（≥1，必含） |
| §5 | `practice[]`（produce 项 ≥ 1，每项 `sample` ≥ 1——「output」口径落位于此） |
| §6 | `quiz[]`（`kind ∈ choice / fill`，全机判，4~6 题） |
| §7 | `deepDive: { refs, hint }` |
| §8 | 各题参考答案与解析（不进 json 顶层，按题号挂到 `answer` / `explanation`） |
| （构建期） | `dataVersion`（题号集合 + 题干/答案指纹） |

## 3. 各节格式细则

### 3.2 课文：逐句中英对照

- **每句一行**：英文句在前（`- ` 列表项），紧随**缩进两空格**的中文译文行
- **自然段**：空行分段（平台按段分组渲染）
- **高亮句**：英文句末加 `{★ 注解}` —— 高亮 3~5 处（本课语法点所在句），注解 = 「为什么这么写」
- 英文句内可用行内代码标记短语；时态等未学要素不作教学要求（语料自然混用即可）

```markdown
- Every morning the rabbit wakes up early.{★ 主 + 动：wakes up 不及物，到动词句子就完整}
  每天清晨，兔子早早醒来。
- The water flows quietly.
  河水静静地流淌。
```

### 3.3 词汇表：7 列表格（8~12 行）

| word | 音标 | 词性 | 释义 | 课文例句 | 课外例句 | 常用搭配 |

- `word` 不含词形变化（短语词组如 wake up 整体收）；**课文例句列必须引课文原句**（validate 全称断言 `examples[0] ∈ reading 句`，平台据此点读——不自造例句，语料自然复用）
- **课外例句列**：一句课外句，切合日常口语（第一人称 / 生活场景优先），validate 断言 `examples[1] ∉ reading 句`（防止复制课文句充数）
- **常用搭配列**：2~3 项，每项格式 `短语 = 例句`（可选中文释义：`短语（中文释义） = 例句`），项间全角分号 `；` 分隔——例句为日常口语句，展示该搭配的真实用法。释义为短语本身的中文义（区别于例句翻译），可逐步补：

```markdown
| wake up | /weɪk ʌp/ | 短语动词 | 醒来 | Every morning the rabbit wakes up early. | I wake up at seven every day. | wake up early（早起） = Wake up early and go running.；wake up late = Don't wake up late on Mondays. |
```

### 3.4 精讲：薄讲（规则 + 2~3 例句）

- 中文规则段落 + 例句（行内代码）；**1 个点一页讲完**，不展开体系（体系归讲义）
- 例句含 ✅ / ❌ 对照时写在同一段

### 3.5 练习三段：题号分域（P 域 B/S 系）

| 段 | 题型 | 题号格式 | 判分 |
|----|------|---------|------|
| 5.1 理解 | 选择 | `**B1（选择）**：`（B = 基础，S = 强化） | 机判 |
| 5.2 操练 | 替换 drill | `**P1（操练）**：`（P 系，层级并入题号后括注可省） | 机判 |
| 5.3 产出 | 造句 / 仿写 | `**S1（产出）**：` | 自判 |

> 题号讲内唯一：P 域（B/S/P/S 系）与 Q 域（小测）不冲突；同段内题号连续。
> 归并口径：`**B1**`、`**P1**`、`**S1**`、`**Q1**` 前缀均进 `id` 字段。

**选择题**（4 选项，选项行 `- A. …`）：

```markdown
**B1（选择）**：课文中「The water flows quietly.」的 flows 是什么用法？
- A. 及物动词，后接宾语
- B. 不及物动词，不需要宾语
- C. 系动词，后接表语
- D. 助动词，帮助构成时态
```

**操练（drill）**：模板句 + `______` 替换槽 + （提示：词）；多槽按序对应（提示可为词或词类/语境词，**永不写答案本身**）：

```markdown
**P1（操练）**：The rabbit runs. → The wolf ______.（提示：sleep）
**P2（操练）**：The wolf ______ away, and the rabbit ______ behind a tree.（提示：walk, hide）
```

**产出**：写清要求 + 数量；参考答案在 §8（= sample 落位）：

```markdown
**S1（产出）**：用 run / jump / sleep 各造一个「主 + 动」句（可加修饰语）。
```

### 3.6 小测：Q 域，全机判（choice / fill）

```markdown
**Q1（选择）**：哪句是「主 + 动」且正确？
- A. The rabbit sleeps the carrot.
- B. The sun rises.
- C. The wolf hungry.

**Q4（填空）**：「The rabbit sleeps.」的句型公式是「主 + ______」。
```

- 4~6 题；间隔复习题从 U01L05 起混入 2 题（复现豁免：U01L01–L04 全考本课点）
- 填空空位 `______`；答案为「不填」时 §8 写 `**不填**`（合法空）

### 3.7 深读：refs + hint

```markdown
- G03：动词分类 §2.2 从动词分类推出五大句型 —— 想深挖「动词定句型」的完整推导链时
```

格式：`- Gnn：〈讲义标题〉§〈小节〉 —— hint`。解析：refs 抓 `G\d{2}`，hint = `—— ` 后文本。跳转目标 = VitePress 讲义静态页锚点（非 grammar-play）。

### 3.8 答案区（文末分离，解析器按 `**题号**：` 切分）

```markdown
## 8. 参考答案与解析

- **B1**：**B**。flows「流动」是不及物动词，河水「流」不需要对象……
- **P1**：**sleeps**。模板句型「主 + 动」……
- **S1**：参考：**The rabbit runs fast. / The wolf jumps high. / The rabbit sleeps under the tree.**（句型对即可）。
- **Q4**：**动**。「主 + 动」是第 1 型句型公式……
```

- 每题一条：`- **题号**：**参考答案**。解析`
- 参考答案 = 题号后第一个加粗片段（多空用 `；` 分空、变体用「（或 …）」——grammar-play 提取口径同源）；其余为解析文本
- 产出自判题的参考 = **sample**（加粗样例句）；「合理即可」等口径写在解析里

## 4. 硬性约束（validate 断言清单）

- md 格式，**禁 HTML**（含 `<details>` 等折叠标签）
- 标题行 `# UxxLnn：` 与目录名一致；outcome 与 syllabus.json **逐字一致**（validate 脚本断言，容句末标点漂移）
- 课文：句数 > 0；**高亮句 3~5 处 = 约定（越界仅告警不红）**
- 词汇表：8~12 行、7 列齐全；课文例句列必须引课文原句；课外例句列不得为课文原句；常用搭配 2~3 项且每项附例句
- 精讲 `notes` ≥ 1 且**列表例句 ≥ 2 条**（缺失 = 构建红，不塞占位文本）；练习 produce 项 ≥ 1 且 §8 有对应 sample；quiz 4~6 题且全机判
- 题号讲内唯一；§8 答案条目与题号一一对应（缺答案 = 解析失败 → 构建红）；fill 空位数与答案段数对齐（缺答案 ≠ 「不填」空）
- refs 全部 `G\d{2}` 且存在于 G01–G29
- 花括号 `{5, 10}` 等、裸尖括号等 VitePress 敏感语法按仓库规范包反引号
