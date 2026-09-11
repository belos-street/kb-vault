import { describe, expect, test } from 'bun:test'
import { lessonSchema, type Lesson } from '../src/schema/lesson.ts'
import { normalizeText } from '../src/app/utils/text.ts'
import {
  checkPracticeAlignment,
  extractReadingBlock,
  findMissingSentences,
  findMissingVocab,
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
