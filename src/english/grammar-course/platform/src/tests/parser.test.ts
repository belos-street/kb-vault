import { describe, expect, test } from 'bun:test'
import {
  parseAnswerSection,
  parseLesson,
  splitAccepts
} from '../scripts/parser.ts'

const SAMPLE = `# U99L99：测试课

> 学完本课你能：**造出测试句**。

---

## 1. 本课目标

今天只学一个点：**测试点**。

---

## 2. 课文

- The rabbit runs.{★ 主 + 动}
  兔子跑。
- The wolf sleeps.
  狼睡觉。

- The sun rises.
  太阳升起。

---

## 3. 词汇表

| word | 音标 | 词性 | 释义 | 课文例句 | 课外例句 | 常用搭配 |
|------|------|------|------|---------|---------|---------|
| run | /rʌn/ | v. | 跑 | The rabbit runs. | I run to school every day.（我每天走路去上学。） | run fast（快跑） = I can run fast.；run away = Don't run away. |
| sleep | /sliːp/ | v. | 睡 | The wolf sleeps. | I sleep eight hours a night. | sleep well = Sleep well tonight.；go to sleep = Go to sleep now. |
| rise | /raɪz/ | v. | 升起 | The sun rises. | I rise at six every morning. | rise up = Birds rise up high.；rise early = I rise early on Sundays. |
| live | /lɪv/ | v. | 居住 | The rabbit lives. | We live near the park. | live in = They live in Beijing.；live alone = I live alone. |
| jump | /dʒʌmp/ | v. | 跳 | The rabbit jumps. | The kids jump on the bed. | jump high = Cats jump high.；jump in = Jump in the car. |
| flow | /fləʊ/ | v. | 流 | The river flows. | Time flows so fast. | flow quietly = Streams flow quietly.；flow down = Tears flow down. |
| sing | /sɪŋ/ | v. | 唱 | Birds sing. | She sings in the shower. | sing well = You sing well.；sing along = Let's sing along. |
| walk | /wɔːk/ | v. | 走 | The wolf walks. | I walk to work. | walk away = He walks away slowly.；walk home = We walk home together. |

---

## 4. 语法点精讲

**规则**：不及物动词什么都不要。

- ✅ \`The rabbit runs.\`
- ❌ \`The rabbit runs the carrot.\`

---

## 5. 练习

### 5.1 理解（选择）

**B1（选择）**：哪句对？
- A. 对的
- B. 错的
- C. 半对
- D. 半错

### 5.2 操练（替换）

**P1（操练）**：The rabbit runs. → The wolf ______.（提示：sleep）

**P2（操练）**：The rabbit ______ and ______.（提示：runs, jumps）

### 5.3 产出（自判）

**S1（产出）**：用 run 造句。

---

## 6. 小测

**Q1（选择）**：句型是？
- A. 1 型
- B. 2 型
- C. 3 型
- D. 4 型

**Q2（填空）**：「主 + 动」的动词是 ______ 动词。

---

## 7. 深读

- G03：动词分类 §2.2 —— 想深挖推导链时

---

## 8. 参考答案与解析

- **B1**：**A**。解释一。
- **P1**：**sleeps**。解释二。
- **P2**：**runs；jumps**。解释三。
- **S1**：参考：**The rabbit runs fast. / The wolf runs away.**（句型对即可）。
- **Q1**：**A**。解释四。
- **Q2**：**不及物**。解释五。
`

describe('parseLesson（七件套端到端）', () => {
  const { lesson, errors, warnings } = parseLesson(SAMPLE)

  test('标题 / objective 剥 ** / goal', () => {
    expect(errors).toEqual([])
    expect(lesson.id).toBe('U99L99')
    expect(lesson.title).toBe('测试课')
    expect(lesson.objective).toBe('今天只学一个点：测试点。')
    expect(lesson.goal).toBe('造出测试句。')
  })

  test('课文：段落分组 + 高亮句带 note', () => {
    expect(lesson.reading.paragraphs.length).toBe(2)
    const s = lesson.reading.paragraphs[0]!.sentences
    expect(s[0]).toEqual({
      en: 'The rabbit runs.',
      zh: '兔子跑。',
      highlight: true,
      note: '主 + 动'
    })
    expect(s[1]!.highlight).toBe(false)
    // 样例仅 1 处高亮（约定 3~5）→ 应有告警
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.message).toContain('高亮句 1 处')
  })

  test('词汇表 7 列：双例句（en+zh）+ 搭配附例', () => {
    expect(lesson.vocab.length).toBe(8)
    expect(lesson.vocab[0]).toEqual({
      word: 'run',
      phonetic: '/rʌn/',
      pos: 'v.',
      meaning: '跑',
      // 课文句 zh 从 reading 反查复用；口语句 zh 从句末括注解析
      examples: [
        { en: 'The rabbit runs.', zh: '兔子跑。' },
        { en: 'I run to school every day.', zh: '我每天走路去上学。' }
      ],
      // 释义可选：带「（中文释义）」进 gloss，不带则无该字段
      collocations: [
        { phrase: 'run fast', gloss: '快跑', example: 'I can run fast.' },
        { phrase: 'run away', example: "Don't run away." }
      ]
    })
    // 口语句无句末括注 → 无 zh（可逐步补）
    expect(lesson.vocab[1]!.examples[1]).toEqual({
      en: 'I sleep eight hours a night.'
    })
  })

  test('T22 校验：课外例句为课文原句 → 硬失败；搭配缺附例 → 硬失败', () => {
    // 课外例句列复制课文句 → 报错
    const dup = SAMPLE.replace('I run to school every day.', 'The rabbit runs.')
    const r1 = parseLesson(dup)
    expect(
      r1.errors.some((e) => e.message.includes('课外例句是课文原句'))
    ).toBe(true)
    // 搭配列仍是旧裸短语格式（无「短语 = 例句」）→ 报错
    const oldStyle = SAMPLE.replace(
      "run fast（快跑） = I can run fast.；run away = Don't run away.",
      'run fast'
    )
    const r2 = parseLesson(oldStyle)
    expect(
      r2.errors.some((e) => e.message.includes('搭配缺「短语 = 例句」格式'))
    ).toBe(true)
  })

  test('搭配释义：「短语（中文释义） = 例句」解析出 gloss，纯「短语 = 例句」无 gloss', () => {
    const items = lesson.vocab[0]!.collocations
    expect(items[0]!.gloss).toBe('快跑')
    expect(items[0]!.phrase).toBe('run fast')
    expect('gloss' in items[1]!).toBe(false)
  })

  test('notes：规则 + 列表例句', () => {
    expect(lesson.notes.length).toBe(1)
    expect(lesson.notes[0]!.rule).toContain('不及物动词什么都不要')
    expect(lesson.notes[0]!.examples.length).toBe(2)
  })

  test('practice 三型：choice / drill（多槽）/ produce（sample）', () => {
    const kinds = lesson.practice.map((p) => p.kind)
    expect(kinds).toEqual(['choice', 'drill', 'drill', 'produce'])
    const b1 = lesson.practice[0]!
    if (b1.kind === 'choice') {
      expect(b1.options.length).toBe(4)
      expect(b1.answer).toBe('A')
    }
    const p2 = lesson.practice[2]!
    if (p2.kind === 'drill') {
      expect(p2.template).toBe('The rabbit ______ and ______.')
      expect(p2.hints).toEqual(['runs', 'jumps'])
      expect(p2.slots).toEqual([['runs'], ['jumps']])
    }
    const s1 = lesson.practice[3]!
    if (s1.kind === 'produce') {
      expect(s1.sample).toEqual([
        'The rabbit runs fast.',
        'The wolf runs away.'
      ])
      expect(s1.criteria).toBe('句型对即可')
    }
  })

  test('quiz：choice + fill（「不填」合法空）', () => {
    expect(lesson.quiz.length).toBe(2)
    const q2 = lesson.quiz[1]!
    if (q2.kind === 'fill') {
      expect(q2.blanks).toEqual([['不及物']])
    }
  })

  test('deepDive：ref / title / hint 三分', () => {
    expect(lesson.deepDive.refs).toEqual([
      { ref: 'G03', title: '动词分类 §2.2', hint: '想深挖推导链时' }
    ])
  })

  test('P0 回归：题干 / 解析不吞节间分隔线（fixture 带 ---，按真实格式）', () => {
    for (const q of [...lesson.practice, ...lesson.quiz]) {
      const texts =
        q.kind === 'choice'
          ? [q.stem, q.explanation]
          : q.kind === 'drill'
            ? [q.template, q.explanation]
            : q.kind === 'fill'
              ? [q.stem, q.explanation]
              : [q.prompt, q.criteria]
      for (const t of texts) {
        expect(t, `${q.id} 含 --- 残留`).not.toContain('---')
        expect(t.trim(), `${q.id} 首尾残留空行`).toBe(
          t.trim().replace(/\n+$/, '')
        )
      }
    }
    // 每节最后一题（S1 / Q2）尤其要干净
    const s1 = lesson.practice.find((p) => p.id === 'S1')
    if (s1?.kind === 'produce') {
      expect(s1.prompt.trim()).toBe('用 run 造句。')
    }
    const q2 = lesson.quiz.find((q) => q.id === 'Q2')
    if (q2?.kind === 'fill') {
      expect(q2.stem.trim()).toBe('「主 + 动」的动词是 ______ 动词。')
    }
  })
})

describe('parseAnswerSection', () => {
  test('首加粗 = 参考答案，全文 = 解析', () => {
    const map = parseAnswerSection('- **B1**：**A**。解释一。')
    expect(map.get('B1')).toEqual({
      id: 'B1',
      answer: 'A',
      explanation: '**A**。解释一。',
      found: true
    })
  })
  test('无加粗 → found=false（降级）', () => {
    const map = parseAnswerSection('- **S1**：直接文字答案。')
    expect(map.get('S1')?.found).toBe(false)
  })
})

describe('splitAccepts', () => {
  test('分号多答案 + 「（或 …）」变体 + 「不填」空串', () => {
    expect(splitAccepts('rises')).toEqual(['rises'])
    expect(
      splitAccepts('leave you a carrot（或 leave a carrot for you）')
    ).toEqual(['leave you a carrot', 'leave a carrot for you'])
    expect(splitAccepts('不填')).toEqual([''])
    expect(splitAccepts('the（或 a）')).toEqual(['the', 'a'])
  })
})

describe('硬失败：结构缺失 → errors', () => {
  test('缺标题行 / 缺节 / 答案缺失', () => {
    const { errors } = parseLesson('正文没有标题结构')
    expect(errors.length).toBeGreaterThan(0)
  })
})
