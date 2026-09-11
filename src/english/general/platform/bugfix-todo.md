# Bug-Fix 待办清单（v2 · 2026-09-10 已修复完毕，待复核）

> v1 生成于 2026-09-10（belos-street 八维 Review）；v2 合入二轮 review 新发现 8 项（F5 / T7-T11，均判定合理）。
> 修完勾选对应项，然后叫 AI 按「验收标准」逐项复查。
> 验证命令（每修完一组跑一次）：
>
> ```bash
> cd src/english/general/platform
> bun run check     # typecheck + lint + format
> bun run validate  # 9 讲数据对账
> bun run build
> bun test
> ```

---

## 🚨 红线（必修）

### [x] R1. progress.ts 四处 catch 静默吞错

- **状态**：二轮核查仍命中（全 src 仅有的 4 处 catch 全在此文件，均无日志）
- **位置**：`src/app/progress.ts` L30（readAll）、L38（writeAll）、L59（getSelectedId）、L71（setSelectedId）
- **问题**：localStorage 读写失败（隐私模式 / 配额满 / JSON 损坏）完全不可见；`readAll` 失败返回 `{}` 会让用户进度**无声清零**
- **修法**：每处 catch 加一行日志（日志 + 兜底，符合错误处理三选一）。事件名建议：`progress:load` / `progress:save` / `progress:read-selected` / `progress:save-selected`

```ts
} catch (err) {
  console.warn('progress:load failed', err)
  return {}
}
```

- **验收**：全库 grep 无空 catch；devtools 里破坏 `localStorage.setItem` 后操作页面，console 出现 warn 且页面不崩

---

## P2 必修

### [x] F1. 组件与 hooks 文件重命名为 kebab-case

- **重命名清单**（用 `git mv` 保历史，同步更新所有 import）：

| 现在                 | 改为                  |
| -------------------- | --------------------- |
| ReadingPlayer.tsx    | reading-player.tsx    |
| SpellingDrill.tsx    | spelling-drill.tsx    |
| WordSpelling.tsx     | word-spelling.tsx     |
| SentenceSpelling.tsx | sentence-spelling.tsx |
| DictationDrill.tsx   | dictation-drill.tsx   |
| PracticeGrader.tsx   | practice-grader.tsx   |
| CourseNav.tsx        | course-nav.tsx        |
| DiffView.tsx         | diff-view.tsx         |
| InlineText.tsx       | inline-text.tsx       |
| hooks/useSpeech.ts   | hooks/use-speech.ts   |

- **验收**：glob 无 PascalCase 的 `.tsx`；`bun run check` 绿

### [x] F2. useSpeech 语音错误可观测 + 定时器清理

- **问题**：无 `u.onerror`——语音引擎出错时 `onend` 不触发，连播**静默卡死**且 playing 状态残留；60ms `setTimeout` 未保存，unmount 不清除
- **修法**：`SpeakOptions` 加 `onerror?: () => void`；`u.onerror` 落 `console.warn('speech:error', e.error)` 并回调；timer 存 ref，新 speak 前与 unmount cleanup 时 `clearTimeout`
- **验收**：正常播放不回归；onerror 链路存在

### [x] F3. validate.ts JSON.parse 报错可定位

- **问题**：单个损坏 lesson.json 抛裸 SyntaxError，不指明文件且中断其余讲次校验
- **修法**：parse 包 try/catch，失败输出 `❌ lesson.json 解析失败：<path>` 并 continue
- **验收**：放一个坏 JSON → validate 报该文件名且 exit 1，其余讲仍逐个输出

### [x] F4. 抽象：三个 drill 队列逻辑 + QuestionCard 拆分

- **问题**：① 三 drill 的「队列 + 进度 + 首次记账 + 重做」重复超阈值；② `QuestionCard` ~180 行内联七题型分支
- **修法**：新建 `hooks/use-drill-queue.ts` 收敛队列状态机；`QuestionCard` 按题型拆子组件（pattern-choice / judge / input-answer / annotate / subjective）
- **顺序**：先做 T1（测试保护）再动
- **验收**：三 drill 行为不变（强制全对 / 首次记账 / 已通过过滤 / 只重做错项）；check + test 绿

### [x] F5. 课程导航 ✓ 语义错误（二轮新增）

- **问题**：`CourseNav` 的 done 判定只看「已答的题」是否全对——答 1/17 题且正确也标 ✓，与 F5「练习判分全对」语义不符
- **修法**：对照该讲题组**全集**判定：`answered 数 = 总题数 && 全部 correct`
- **验收**：答 1/17 全对不亮 ✓；答满 17 题且全对才亮 ✓

---

## P3 可选

### [x] T1. 补 text / select / lcs 单测（建议在 F4 前做）

- `tests/text.test.ts`：stem 边界（checks→check、running→run、tasks→task、**automated→automate（T2 缺陷实证）**、having→have）、usesAnyWord、normalizeText、initialHint
- `tests/select.test.ts`：selectCoreSentences 关键句 + 含精讲词句筛选
- `tests/lcs.test.ts`（二轮新增 N8）：全等 / 缺词 / 多词 / 交错错位四类用例

### [x] T2. stem 修缺陷：-e 结尾动词的 -ed/-ing 还原

- **问题**：`stem('automated')` → `automat` ≠ `automate`；`stem('having')` → `hav` ≠ `have`（text.ts 已实证）——核心句筛选漏判隐患
- **修法**：`usesAnyWord` 双形式匹配：`words.has(stem(t)) || words.has(stem(t) + 'e')`
- **验收**：T1 单测覆盖上述用例；全量 validate/test 绿

### [x] T3. 布尔 state 加 is 前缀

`checked→isSubmitted`、`passed→isPassed`、`revealed→isRevealed`、`hint→isHintShown`、`loop→isLooping`、`playing→isPlaying`、`showZh→isZhVisible`、`navOpen→isNavOpen`、`surrendered→isAnswerRevealed`

### [x] T4. 常量 UPPER_SNAKE_CASE

`TABS → TAB_ITEMS`（App.tsx）、`MODES → MODE_ITEMS`（SpellingDrill.tsx）

### [ ] T5. progressStore 依赖注入（可保持现状）

### [ ] T6. lesson.json 懒加载（数据到三册再做）

### [x] T7. initialHint 注释与实现打架（二轮新增）

- **问题**：注释声明「保留大小写」，实现走 tokenize → normalizeText 全小写，提示的 `t___` 误导用户以为原词小写
- **修法**：改实现为原句按空白 split（保留大小写与标点，仅非首字母字符替换 `_`）
- **验收**：`initialHint('Friday, 5 p.m.')` → `F_____, 5 p.m.`

### [x] T8. normalizeText 双实现合一（二轮新增）

- **问题**：app 与 scripts 各一份完全相同实现，改判分口径会漏改对账脚本（口径漂移）
- **修法**：reconcile.ts 删除本地定义，`import { normalizeText } from '../../app/utils/text.ts'`（纯函数无环境依赖）
- **验收**：全库仅一处 normalizeText 定义；validate 输出不变

### [x] T9. Verdict 类型双定义合一（二轮新增）

- **修法**：PracticeGrader 删除本地 `type Verdict`，`import type { Verdict } from '../progress.ts'`
- **验收**：全库仅一处定义

### [x] T10. matchesAny 空归一化假通过（二轮新增）

- **问题**：normalizeText 剔除非 ASCII，一旦出现中文答案，任意纯中文输入归一化后 `'' === ''` 直接判对
- **修法**：matchesAny 开头 `if (n === '') return false`
- **验收**：空输入 / 纯标点输入判错

### [x] T11. requirements.md F4 与 F6 矛盾（二轮新增）

- **问题**：F4 写「判分仅当次会话不持久化」与 F6「练习判定跨会话保留」矛盾（实现按 F6）；F4 承诺的「会话结束汇总 + 错题清单」页面未实现
- **修法**：F4 末句改为「实时正确率计数（持久化见 F6）」；汇总页记入裁剪决策

---

## 完成后

1. 全部勾选 + `check / validate / build / test` 四绿
2. 叫 AI review：逐项对照「验收标准」复查 + 抽查 diff
