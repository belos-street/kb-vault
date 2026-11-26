import { describe, expect, test } from 'bun:test'
import {
  lessonSchema,
  questionSchema,
  type Lesson
} from '../src/schema/lesson.ts'
import { normalizeText } from '../src/app/utils/text.ts'
import {
  checkChoiceAlignment,
  checkPracticeAlignment,
  extractReadingBlock,
  findMissingSentences,
  findMissingVocab,
  parseMdChoices,
  parsePracticeGroups
} from '../src/scripts/reconcile.ts'

const fixtureLesson: Lesson = {
  id: 'L01',
  unit: '01-句子工程',
  book: 'book-01-foundation',
  title: '第 1 讲：句子成分与五大句型',
  reading: {
    title: 'My Digital Butler',
    sentences: [
      {
        en: 'Automation is a developer superpower.',
        zh: '自动化是开发者的超能力。'
      },
      { en: 'I automate it.', zh: '我把它自动化。' }
    ],
    translation: '自动化是开发者的超能力。我把它自动化。',
    keyPoints: [{ sentence: 'I automate it.', analysis: 'S+V+O' }]
  },
  vocab: {
    core: [
      {
        word: 'script',
        phonetic: '/skrɪpt/',
        meaning: 'n. 脚本',
        example: 'A small script checks the weather.',
        extraExample: 'The deploy script runs at midnight.',
        extraExampleZh: '部署脚本午夜运行。',
        collocations: 'write a script'
      }
    ],
    wordGroups: [
      {
        word: 'check',
        sentence: 'A small script checks the weather.',
        collocations: 'check the logs'
      }
    ]
  },
  notes: [
    {
      heading: '五大句型',
      blocks: [{ type: 'p', text: '所有英语句子都是五种句型的扩展。' }]
    }
  ],
  output: [
    {
      kind: 'retell',
      prompt: '用 1 句英文概括课文大意。',
      reference: '线索：automation → superpower',
      sample: 'Automation is a developer superpower, so I automate it.'
    }
  ],
  practice: [
    {
      id: 1,
      title: '判断句型',
      layer: 'basic',
      questions: [
        {
          kind: 'pattern-choice',
          id: '1-1',
          stem: 'The server crashed last night.',
          options: ['① 主谓', '② 主谓宾'],
          answer: 0,
          explanation: '① 主谓'
        },
        {
          kind: 'pattern-choice',
          id: '1-2',
          stem: 'I pushed the branch.',
          options: ['① 主谓', '② 主谓宾'],
          answer: 1,
          explanation: '② 主谓宾'
        }
      ]
    },
    {
      id: 2,
      title: '造句',
      layer: 'advanced',
      questions: [
        {
          kind: 'subjective',
          id: '2-1',
          stem: '五大句型各写一句。',
          explanation: '',
          checklist: [
            { label: '要点覆盖', text: '五句各一' },
            { label: '自检要点', text: '加 be 法' },
            { label: '达标线', text: '主干正确' }
          ]
        }
      ]
    }
  ]
}

describe('normalizeText', () => {
  test('小写、去标点、压缩空白', () => {
    expect(normalizeText('Hello,  World! It is fine.')).toBe(
      'hello world it is fine'
    )
  })
})

describe('extractReadingBlock', () => {
  const md = [
    '# 第 1 讲',
    '## 1. 课文精读',
    '**My Digital Butler**',
    '',
    '> Automation is a developer superpower.',
    '> I automate it.',
    '',
    '## 2. 词汇与词组',
    '| word |'
  ].join('\n')

  test('只取 blockquote 正文', () => {
    const block = extractReadingBlock(md)
    expect(block).not.toContain('##')
    expect(block).toContain('Automation is a developer superpower.')
    expect(block).not.toContain('| word |')
  })
})

describe('findMissingSentences', () => {
  test('句子都在课文中 → 无缺失', () => {
    const block = '> Automation is a developer superpower. > I automate it.'
    expect(findMissingSentences(fixtureLesson, block)).toEqual([])
  })
  test('缺句 → 报缺失句', () => {
    expect(
      findMissingSentences(
        fixtureLesson,
        'Automation is a developer superpower.'
      )
    ).toEqual(['I automate it.'])
  })
})

describe('findMissingVocab', () => {
  const md =
    '| script | /skrɪpt/ | n. 脚本 | example | collocations |\n| other | x |'
  test('词在词汇表 → 无缺失', () => {
    expect(findMissingVocab(fixtureLesson, md)).toEqual([])
  })
  test('缺词 → 报缺失词', () => {
    expect(findMissingVocab(fixtureLesson, '| other | x |')).toEqual(['script'])
  })
})

describe('parsePracticeGroups', () => {
  const md = [
    '## 基础层',
    '**1. 判断句型**：选出句型。',
    '1. The server crashed last night.',
    '2. I pushed the branch.',
    '**2. 翻译**（指定句型）：',
    '1. 自动化节省时间。',
    '**3. 造句**：五大句型各写一句。',
    '---',
    '## 答案',
    '**1.**',
    '1. ① 主谓'
  ].join('\n')

  test('题组与子题计数（答案区不计，括号夹注头可识别）', () => {
    expect(parsePracticeGroups(md)).toEqual([
      { id: 1, subCount: 2 },
      { id: 2, subCount: 1 },
      { id: 3, subCount: 0 }
    ])
  })
})

describe('checkPracticeAlignment', () => {
  const groups = [
    { id: 1, subCount: 2 },
    { id: 2, subCount: 0 }
  ]

  test('完全对齐 → 无错误（单一主观题组允许 md 无子题）', () => {
    expect(checkPracticeAlignment(groups, fixtureLesson)).toEqual([])
  })
  test('子题数不一致报错', () => {
    const errors = checkPracticeAlignment(
      [
        { id: 1, subCount: 3 },
        { id: 2, subCount: 0 }
      ],
      fixtureLesson
    )
    expect(errors).toEqual([
      '题组 1 子题数不一致：practice.md 3 vs lesson.json 2'
    ])
  })
  test('md 多出题组报错', () => {
    const errors = checkPracticeAlignment(
      [
        { id: 1, subCount: 2 },
        { id: 2, subCount: 0 },
        { id: 3, subCount: 1 }
      ],
      fixtureLesson
    )
    expect(errors).toEqual(['practice.md 题组 3 在 lesson.json 中不存在'])
  })
})

describe('choice 题型', () => {
  const base = {
    kind: 'choice',
    id: '7-1',
    stem: '根据课文，script 每天早上做什么？',
    options: ['唤醒作者', '查看天气并读日历', '写新脚本', '关闭电脑'],
    answer: 1,
    explanation: '课文第 2 句：checks the weather, reads my calendar...'
  }

  test('合法单选题通过 schema', () => {
    expect(questionSchema.safeParse(base).success).toBe(true)
  })
  test('选项超过 4 项报错', () => {
    const bad = { ...base, options: ['a', 'b', 'c', 'd', 'e'] }
    expect(questionSchema.safeParse(bad).success).toBe(false)
  })
  test('选项少于 2 项报错', () => {
    expect(questionSchema.safeParse({ ...base, options: ['a'] }).success).toBe(
      false
    )
  })
})

describe('lessonSchema', () => {
  test('合法 fixture 通过', () => {
    expect(lessonSchema.safeParse(fixtureLesson).success).toBe(true)
  })
  test('缺 practice 报错', () => {
    const bad = { ...fixtureLesson, practice: [] }
    expect(lessonSchema.safeParse(bad).success).toBe(false)
  })
  test('非法 id 格式报错', () => {
    const bad = { ...fixtureLesson, id: 'lesson-1' }
    expect(lessonSchema.safeParse(bad).success).toBe(false)
  })
})

const choiceLesson: Lesson = {
  ...fixtureLesson,
  practice: [
    {
      id: 2,
      title: '课文理解与语法',
      layer: 'basic',
      questions: [
        {
          kind: 'choice',
          id: '2-1',
          stem: 'script 每天做什么？',
          options: ['查看天气', '写新脚本', '关闭电脑'],
          answer: 0,
          explanation: '第 2 句'
        },
        {
          kind: 'choice',
          id: '2-2',
          stem: '下列哪句正确？',
          options: [
            'He claimed that did the cache break.',
            'He claimed that the cache broke.',
            'He claimed that the cache under load broke.'
          ],
          answer: 1,
          explanation: '陈述语序'
        }
      ]
    }
  ]
}

const choiceMd = [
  '## 基础层',
  '',
  '**2. 课文理解与语法**：先读课文，再作答；每题只有一个正确选项。',
  '',
  '1. script 每天做什么？',
  '   A. 查看天气',
  '   B. 写新脚本',
  '   C. 关闭电脑',
  '2. 下列哪句正确？',
  '   A. He claimed that did the cache break.',
  '   B. He claimed that the cache broke.',
  '   C. He claimed that the cache under load broke.',
  '',
  '---',
  '',
  '## 答案',
  '',
  '**2.**',
  '1. A — 第 2 句：checks the weather.',
  '2. B — 宾语从句用陈述语序。'
].join('\n')

describe('parseMdChoices', () => {
  test('解析指定题组的题干、选项顺序与答案字母', () => {
    const parsed = parseMdChoices(choiceMd, 2)
    expect(parsed).toEqual([
      {
        no: 1,
        stem: 'script 每天做什么？',
        options: ['查看天气', '写新脚本', '关闭电脑'],
        answer: 'A'
      },
      {
        no: 2,
        stem: '下列哪句正确？',
        options: [
          'He claimed that did the cache break.',
          'He claimed that the cache broke.',
          'He claimed that the cache under load broke.'
        ],
        answer: 'B'
      }
    ])
  })
})

describe('checkChoiceAlignment', () => {
  test('md↔json 完全一致 → 无错误', () => {
    expect(checkChoiceAlignment(choiceMd, choiceLesson)).toEqual([])
  })
  test('选项顺序漂移报错', () => {
    const swapped: Lesson = {
      ...choiceLesson,
      practice: [
        {
          ...choiceLesson.practice[0]!,
          questions: [
            {
              kind: 'choice',
              id: '2-1',
              stem: 'script 每天做什么？',
              options: ['写新脚本', '查看天气', '关闭电脑'],
              answer: 0,
              explanation: '第 2 句'
            },
            choiceLesson.practice[0]!.questions[1]!
          ]
        }
      ]
    }
    expect(checkChoiceAlignment(choiceMd, swapped)).toEqual([
      '题 2-1 选项 1 文本或顺序不一致：practice.md「查看天气」vs lesson.json「写新脚本」'
    ])
  })
  test('答案字母漂移报错', () => {
    const wrongAnswer: Lesson = {
      ...choiceLesson,
      practice: [
        {
          ...choiceLesson.practice[0]!,
          questions: [
            choiceLesson.practice[0]!.questions[0]!,
            {
              kind: 'choice',
              id: '2-2',
              stem: '下列哪句正确？',
              options: [
                'He claimed that did the cache break.',
                'He claimed that the cache broke.',
                'He claimed that the cache under load broke.'
              ],
              answer: 0,
              explanation: '陈述语序'
            }
          ]
        }
      ]
    }
    expect(checkChoiceAlignment(choiceMd, wrongAnswer)).toEqual([
      '题 2-2 答案字母不一致：practice.md B vs lesson.json A（answer=0）'
    ])
  })
  test('md 答案区缺字母报错', () => {
    const noAnswer = choiceMd.replace(
      '1. A — 第 2 句：checks the weather.\n',
      ''
    )
    expect(checkChoiceAlignment(noAnswer, choiceLesson)).toEqual([
      '题 2-1 practice.md 答案区缺少该题字母'
    ])
  })
})
