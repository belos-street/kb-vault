import { describe, expect, test } from 'bun:test'
import type { Lesson } from '../src/schema/lesson.ts'
import { selectCoreSentences } from '../src/app/utils/select.ts'

const fixture: Lesson = {
  id: 'L01',
  unit: '01-句子工程',
  book: 'book-01-foundation',
  title: '第 1 讲',
  reading: {
    title: 'My Digital Butler',
    sentences: [
      { en: 'A small script checks the weather.', zh: null },
      { en: 'I love coffee.', zh: null },
      { en: 'I call it my digital butler.', zh: null }
    ],
    translation: '…',
    keyPoints: [{ sentence: 'I call it my digital butler.', analysis: '④' }]
  },
  vocab: {
    core: [
      {
        word: 'script',
        phonetic: '',
        meaning: '',
        example: '',
        collocations: ''
      },
      {
        word: 'butler',
        phonetic: '',
        meaning: '',
        example: '',
        collocations: ''
      }
    ],
    wordGroups: [{ word: 'check', sentence: '', collocations: '' }]
  },
  notes: [{ heading: 'n', blocks: [{ type: 'p', text: 'b' }] }],
  output: [{ kind: 'retell', prompt: 'p', sample: 's' }],
  practice: [
    {
      id: 1,
      title: 't',
      layer: 'basic',
      questions: [
        {
          kind: 'judge',
          id: '1-1',
          stem: 's',
          isCorrect: true,
          correction: null,
          explanation: ''
        }
      ]
    }
  ]
}

describe('selectCoreSentences', () => {
  test('关键句入选（keyPoints 覆盖）', () => {
    const out = selectCoreSentences(fixture)
    expect(out.map((s) => s.en)).toContain('I call it my digital butler.')
  })
  test('含精讲词/词群词的句子入选（含 -e 动词双形式兜底）', () => {
    const out = selectCoreSentences(fixture)
    expect(out.map((s) => s.en)).toContain('A small script checks the weather.')
  })
  test('不含核心词的句子被排除', () => {
    const out = selectCoreSentences(fixture)
    expect(out.map((s) => s.en)).not.toContain('I love coffee.')
  })
})
