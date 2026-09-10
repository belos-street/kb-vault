# Bug-Fix 待办清单（基于 belos-street 八维 Review）

> 生成于 2026-09-10。修完勾选对应项，然后叫 AI 按「验收标准」逐项复查。
> 验证命令（每修完一组跑一次）：
>
> ```bash
> cd src/english/general/platform
> bun run check     # typecheck + lint + format
> bun run validate  # 9 讲数据对账
> bun run build
> ```

---

## 🚨 红线（必修）

### [ ] R1. progress.ts 四处 catch 静默吞错

- **位置**：`src/app/progress.ts` L30（readAll）、L38（writeAll）、L59（getSelectedId）、L71（setSelectedId）
- **问题**：localStorage 读写失败（隐私模式 / 配额满 / JSON 损坏）完全不可见；`readAll` 失败返回 `{}` 会让用户进度**无声清零**
- **修法**：每处 catch 加一行日志（日志 + 兜底，符合错误处理三选一）：

```ts
} catch (err) {
  console.warn('progress:load failed', err)
  return {}
}
```

事件名建议：`progress:load` / `progress:save` / `progress:read-selected` / `progress:save-selected`
- **验收**：全库 grep 无空 catch；devtools 里执行 `localStorage.setItem = () => { throw new Error() }` 后操作页面，console 出现 warn 且页面不崩

---

## P2 必修

### [ ] F1. 组件与 hooks 文件重命名为 kebab-case

- **规范**：naming-conventions「React Components 同样使用 kebab-case」
- **重命名清单**（用 `git mv` 保历史）：

| 现在 | 改为 |
|------|------|
| ReadingPlayer.tsx | reading-player.tsx |
| SpellingDrill.tsx | spelling-drill.tsx |
| WordSpelling.tsx | word-spelling.tsx |
| SentenceSpelling.tsx | sentence-spelling.tsx |
| DictationDrill.tsx | dictation-drill.tsx |
| PracticeGrader.tsx | practice-grader.tsx |
| CourseNav.tsx | course-nav.tsx |
| DiffView.tsx | diff-view.tsx |
| InlineText.tsx | inline-text.tsx |
| hooks/useSpeech.ts | hooks/use-speech.ts |

- **注意**：同步更新所有 import（App / SpellingDrill / 三个 drill 互引 / data.ts 不涉及）；IDE 里开着这些文件的话先 reload，避免旧缓冲覆盖
- **验收**：glob 无 PascalCase 的 `.tsx`；`bun run check` 绿

### [ ] F2. useSpeech 语音错误可观测 + 定时器清理

- **位置**：`src/app/hooks/use-speech.ts` L49-L51
- **问题**：无 `u.onerror`——语音引擎出错时 `onend` 不触发，连播**静默卡死**且 playing 状态残留 true；`speak` 内 60ms `setTimeout` 未保存，unmount 不清除
- **修法**：
  1. `SpeakOptions` 增加 `onerror?: () => void`；`u.onerror = (e) => { console.warn('speech:error', e.error); opts?.onerror?.() }`
  2. ReadingPlayer 传入 onerror：`playingRef.current = false; setPlaying(false)`
  3. timer 存 ref（`speakTimerRef`），新 speak 前与 unmount cleanup 时 `clearTimeout`
- **验收**：正常播放不回归；代码 review 确认 onerror 链路存在

### [ ] F3. validate.ts JSON.parse 报错可定位

- **位置**：`src/scripts/validate.ts` L43
- **问题**：单个损坏的 lesson.json 抛裸 SyntaxError，不指明哪个文件，且中断其余讲次校验
- **修法**：parse 包 try/catch，失败时输出 `lesson.json 解析失败：<path>` 并 continue 校验下一讲

```ts
let raw: unknown
try {
  raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
} catch (err) {
  return { ok: false, skipped: false, message: `${id} ❌ lesson.json 解析失败：${String(err)}` }
}
```

- **验收**：往任一讲目录放一个坏 JSON → validate 报该文件名且 exit 1，其余讲仍逐个输出

### [ ] F4. 抽象：三个 drill 的重复队列逻辑 + QuestionCard 拆分

- **问题**：① Word/Dictation/Sentence 三个 drill 的「队列 + 进度 + 首次记账 + 重做」逻辑重复超阈值（同段 >4 行 ×3 次，规范强制抽象）；② `PracticeGrader.tsx` 的 `QuestionCard` 单组件 ~180 行内联七题型分支
- **修法建议**：
  1. 新建 `src/app/hooks/use-drill-queue.ts`：

```ts
useDrillQueue<T>(opts: {
  lessonId: string
  mode: string
  items: T[]
  keyOf: (item: T) => string
  onFirstResult?: (item: T, correct: boolean) => void
}) => { queue, pos, current, passed, total, results, phase, submit(isCorrect), next(), restart(items) }
```

  2. `QuestionCard` 按题型拆子组件（可放同文件）：pattern-choice / judge / input-answer（correction+fill+translation 共用）/ annotate / subjective
- **顺序建议**：先做 P3-T1（补 text.ts 测试）再动，重构有测试保护
- **验收**：三个 drill 行为不变（强制全对推进 / 首次记账 / 已通过过滤 / 只重做错项）；`bun run check` + `bun test` 绿

---

## P3 可选

### [ ] T1. 补 text.ts / select.ts 单测（建议在 F4 前做）

- `tests/text.test.ts`：stem 边界（checks→check、running→run、tasks→task、**automated→automate（当前有缺陷，见 T2）**、having→have）、usesAnyWord、normalizeText、initialHint
- `tests/select.test.ts`：selectCoreSentences 关键句 + 含精讲词句筛选

### [ ] T2. stem 修缺陷：-e 结尾动词的 -ed/-ing 还原

- **问题**：`stem('automated')` → `automat` ≠ `automate`；`stem('having')` → `hav` ≠ `have`——-ate/-e 结尾动词去 ed/ing 后丢失 e，导致核心句筛选漏判（当前数据恰好被其他词兜住，未实际出错）
- **修法**：`usesAnyWord` 改为双形式匹配：`words.has(stem(t)) || words.has(`${stem(t)}e`)`（text.ts 内聚，不动 stem 本体）
- **验收**：T1 的单测覆盖 automated→automate、having→have；全量 validate/test 绿

### [ ] T3. 布尔 state 加 is 前缀

映射建议（语义优先，不必机械）：`checked→isSubmitted`、`passed→isPassed`、`revealed→isRevealed`、`hint→isHintShown`、`loop→isLooping`、`playing→isPlaying`、`showZh→isZhVisible`、`navOpen→isNavOpen`、`surrendered→isAnswerRevealed`

### [ ] T4. 常量 UPPER_SNAKE_CASE

`TABS → TAB_ITEMS`（App.tsx）、`MODES → MODE_ITEMS`（SpellingDrill.tsx）

### [ ] T5. progressStore 依赖注入（可保持现状）

5 处直接 import 模块单例，测试无法 mock；改为组件 props / hook 参数注入。当前规模可接受「保持现状」

### [ ] T6. lesson.json 懒加载（数据到三册再做）

eager glob 全量进 bundle（gzip 127KB）；改 `() => import(...)` 惰性取 + Suspense

---

## 完成后

1. 全部勾选 + `check / validate / build / test` 四绿
2. 叫 AI review：逐项对照「验收标准」复查 + 抽查 diff