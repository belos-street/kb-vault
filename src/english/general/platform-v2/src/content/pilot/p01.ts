import {
  chunks,
  defineLesson,
  drill,
  exercise,
  grammar,
  output,
  passage,
  vocab
} from '../../data/builders.ts'

export const p01 = defineLesson({
  id: 'p01',
  title: 'The Corner Bakery',
  topic: 'daily-life',
  minutes: 30,
  targetPatterns: ['五大句型', 'there be', '一般现在'],
  canDo: ['能拆出简单句的主干', '能用 there be 描述一个地方'],
  blocks: [
    passage({
      title: 'The Corner Bakery',
      sentences: [
        {
          en: 'The bakery on the corner opens before the sun.',
          zh: '街角的面包店在太阳升起前开门。'
        },
        {
          en: 'At five in the morning, the street is still dark and quiet.',
          zh: '清晨五点，街上还黑着，也很安静。'
        },
        {
          en: 'Maria turns on the lights, ties her apron, and puts the first tray of bread into the oven.',
          zh: '玛丽亚打开灯，系上围裙，把第一盘面包放进烤箱。'
        },
        {
          en: 'The smell fills the small shop and drifts into the street.',
          zh: '香味充满小店，又飘到街上。'
        },
        {
          en: 'By six, the first customers arrive.',
          zh: '到六点，第一批顾客来了。'
        },
        {
          en: 'A nurse buys two rolls before her shift.',
          zh: '一位护士上班前买两个小面包。'
        },
        {
          en: 'A student orders a coffee and a cinnamon bun.',
          zh: '一个学生点了一杯咖啡和一个肉桂卷。'
        },
        {
          en: 'Maria knows most of them by name.',
          zh: '玛丽亚大多能叫出他们的名字。'
        },
        {
          en: 'She asks about their children, their exams, their long nights.',
          zh: '她问起他们的孩子、考试和熬过的长夜。'
        },
        {
          en: 'The shop is small, but it holds a lot of stories.',
          zh: '店很小，却装着很多故事。'
        },
        {
          en: 'There is a wooden table by the window.',
          zh: '窗边有一张木桌。'
        },
        {
          en: 'Regulars call it the thinking table.',
          zh: '常客们把它叫作“思考桌”。'
        },
        {
          en: 'They sit there with their laptops, notebooks, and half-finished conversations.',
          zh: '他们带着笔记本电脑、笔记本和聊到一半的话题坐在那里。'
        },
        {
          en: 'Maria never hurries them.',
          zh: '玛丽亚从不催他们。'
        },
        {
          en: 'She refills their cups and lets the morning slow down.',
          zh: '她给他们续杯，让早晨慢下来。'
        },
        {
          en: 'At nine, the rush ends.',
          zh: '九点，早高峰结束。'
        },
        {
          en: 'Maria wipes the counter, counts the empty trays, and writes a short list for tomorrow.',
          zh: '玛丽亚擦柜台，数空托盘，为明天写一张短清单。'
        },
        {
          en: 'Then she pours herself a cup of tea.',
          zh: '然后她给自己倒一杯茶。'
        },
        {
          en: 'The bakery is quiet again, and the street outside is fully awake.',
          zh: '面包店又安静下来，外面的街道已经完全醒了。'
        }
      ],
      translation:
        '街角的面包店在太阳升起前开门。清晨五点，街上还黑着，也很安静。玛丽亚打开灯，系上围裙，把第一盘面包放进烤箱。香味充满小店，又飘到街上。到六点，第一批顾客来了。一位护士上班前买两个小面包。一个学生点了一杯咖啡和一个肉桂卷。玛丽亚大多能叫出他们的名字。她问起他们的孩子、考试和熬过的长夜。店很小，却装着很多故事。窗边有一张木桌。常客们把它叫作“思考桌”。他们带着笔记本电脑、笔记本和聊到一半的话题坐在那里。玛丽亚从不催他们。她给他们续杯，让早晨慢下来。九点，早高峰结束。玛丽亚擦柜台，数空托盘，为明天写一张短清单。然后她给自己倒一杯茶。面包店又安静下来，外面的街道已经完全醒了。'
    }),
    vocab([
      {
        word: 'bakery',
        phonetic: '/ˈbeɪkəri/',
        meaning: 'n. 面包店',
        example: 'The bakery on the corner opens before the sun.',
        collocation: 'a corner bakery'
      },
      {
        word: 'apron',
        phonetic: '/ˈeɪprən/',
        meaning: 'n. 围裙',
        example:
          'Maria turns on the lights, ties her apron, and puts the first tray of bread into the oven.',
        collocation: 'put on an apron'
      },
      {
        word: 'tray',
        phonetic: '/treɪ/',
        meaning: 'n. 托盘',
        example:
          'Maria turns on the lights, ties her apron, and puts the first tray of bread into the oven.',
        collocation: 'a tray of bread'
      },
      {
        word: 'oven',
        phonetic: '/ˈʌvn/',
        meaning: 'n. 烤箱',
        example:
          'Maria turns on the lights, ties her apron, and puts the first tray of bread into the oven.',
        collocation: 'preheat the oven'
      },
      {
        word: 'cinnamon',
        phonetic: '/ˈsɪnəmən/',
        meaning: 'n. 肉桂',
        example: 'A student orders a coffee and a cinnamon bun.',
        collocation: 'a cinnamon roll'
      },
      {
        word: 'regular',
        phonetic: '/ˈreɡjələr/',
        meaning: 'n. 常客；adj. 规律的',
        example: 'Regulars call it the thinking table.',
        collocation: 'a regular customer'
      },
      {
        word: 'counter',
        phonetic: '/ˈkaʊntər/',
        meaning: 'n. 柜台',
        example:
          'Maria wipes the counter, counts the empty trays, and writes a short list for tomorrow.',
        collocation: 'at the counter'
      },
      {
        word: 'rush',
        phonetic: '/rʌʃ/',
        meaning: 'n. 高峰；匆忙',
        example: 'At nine, the rush ends.',
        collocation: 'the morning rush'
      },
      {
        word: 'refill',
        phonetic: '/ˌriːˈfɪl/',
        meaning: 'v. 续杯；重新装满',
        example: 'She refills their cups and lets the morning slow down.',
        collocation: 'refill a cup'
      }
    ]),
    chunks([
      {
        text: 'opens before the sun',
        frame: 'before + 名词 / 从句',
        note: '用具体时间点做对比，比 in the morning 更有画面。'
      },
      {
        text: 'by six',
        frame: 'by + 时间点',
        note: '表示“不迟于”，常和到达类动词连用。'
      },
      {
        text: 'knows most of them by name',
        frame: 'know sb by name',
        note: '不是“知道名字”，而是“叫得出名字 / 认得”。'
      },
      {
        text: 'There is a wooden table by the window',
        frame: 'There be + 名词 + 地点',
        note: '先交代“有”，再说在哪；不要写成 The shop has a table by the window 来硬套中文。'
      },
      {
        text: 'lets the morning slow down',
        frame: 'let + 宾语 + 动词原形',
        note: 'let 后不加 to；slow down 是“慢下来”。'
      },
      {
        text: 'pours herself a cup of tea',
        frame: 'pour sb sth',
        note: '双宾结构：pour her a cup = pour a cup for her。'
      }
    ]),
    output({
      kind: 'writing',
      prompt:
        '用 5 句话写你常去的一家店或一个地方：什么时候开门、谁在那里、你在那里做什么、它为什么特别。',
      sample:
        'The noodle shop opens at eleven.\nThere is a small table by the door.\nThe owner calls me by my nickname.\nI always order the same bowl.\nIt is a quiet place in a loud street.',
      checklist: [
        '每句都能指出主语和谓语',
        '至少一句用 there be',
        '至少一句用双宾或宾补',
        '用一次 by + 时间点'
      ]
    }),
    drill([
      {
        id: 'p01-d1',
        mode: 'spelling',
        prompt: 'bakery',
        hint: '面包店',
        answer: 'bakery'
      },
      {
        id: 'p01-d2',
        mode: 'spelling',
        prompt: 'apron',
        hint: '围裙',
        answer: 'apron'
      },
      {
        id: 'p01-d3',
        mode: 'spelling',
        prompt: 'cinnamon',
        hint: '肉桂',
        answer: 'cinnamon'
      },
      {
        id: 'p01-d4',
        mode: 'spelling',
        prompt: 'counter',
        hint: '柜台',
        answer: 'counter'
      },
      {
        id: 'p01-d5',
        mode: 'dictation',
        prompt: 'The bakery on the corner opens before the sun.',
        hint: '街角的面包店在太阳升起前开门。',
        answer: 'The bakery on the corner opens before the sun.'
      },
      {
        id: 'p01-d6',
        mode: 'dictation',
        prompt: 'Maria never hurries them.',
        hint: '玛丽亚从不催他们。',
        answer: 'Maria never hurries them.'
      },
      {
        id: 'p01-d7',
        mode: 'dictation',
        prompt: 'She pours herself a cup of tea.',
        hint: '她给自己倒一杯茶。',
        answer: 'She pours herself a cup of tea.'
      },
      {
        id: 'p01-d8',
        mode: 'recall',
        prompt: '街角的面包店在太阳升起前开门。',
        hint: 'The bakery on the corner ...',
        answer: 'The bakery on the corner opens before the sun.'
      },
      {
        id: 'p01-d9',
        mode: 'recall',
        prompt: '玛丽亚从不催他们。',
        hint: 'Maria never ...',
        answer: 'Maria never hurries them.'
      },
      {
        id: 'p01-d10',
        mode: 'recall',
        prompt: '她给自己倒一杯茶。',
        hint: 'She pours ...',
        answer: 'She pours herself a cup of tea.'
      }
    ]),
    grammar({
      id: 'five-patterns-there-be',
      title: '五大句型与 there be',
      rule: '先找谓语动词，再往前找主语，往后看宾语或补语；表示“某地有某物”时用 There be，不用 have。',
      anchors: [
        'The bakery on the corner opens before the sun.',
        'There is a wooden table by the window.'
      ],
      contrast:
        '中文“店里有张桌子”常被直译成 The shop has a table；英语更常说 There is a table in the shop。have 强调拥有关系，there be 强调存在。',
      commonErrors: [
        'There have a table...（错：there be 的 be 不能换成 have）',
        '把 There is 后面的名词当主语，导致主谓不一致'
      ]
    }),
    exercise('基础层', [
      {
        id: 'p01-e1',
        kind: 'choice',
        level: '基础',
        question:
          'The bakery on the corner opens before the sun. 这句话的主语是？',
        options: [
          'The bakery',
          'The bakery on the corner',
          'the sun',
          'before the sun'
        ],
        answer: 'The bakery on the corner',
        solution:
          'on the corner 是介词短语作后置定语，和 The bakery 一起构成主语；opens 是谓语。'
      },
      {
        id: 'p01-e2',
        kind: 'choice',
        level: '基础',
        question: 'She pours herself a cup of tea. 属于哪种句型？',
        options: ['主谓', '主谓宾', '主谓双宾', '主谓宾补'],
        answer: '主谓双宾',
        solution:
          'herself 是间接宾语，a cup of tea 是直接宾语；可改写为 pours a cup of tea for herself。'
      },
      {
        id: 'p01-e3',
        kind: 'fill',
        level: '基础',
        question: 'There ___ a wooden table by the window.',
        answer: 'is',
        solution:
          'There be 的就近原则：后面的核心名词 a wooden table 是单数，用 is。'
      },
      {
        id: 'p01-e4',
        kind: 'correction',
        level: '基础',
        question: '改错：There have a wooden table by the window.',
        answer: 'There is a wooden table by the window.',
        solution:
          'there be 结构只能用 be 动词，不能用 have；这里表示“存在”，不是“拥有”。'
      },
      {
        id: 'p01-e5',
        kind: 'annotate',
        level: '强化',
        question: '划分成分：Maria never hurries them.',
        answer: 'Maria（主语）+ never（状语）+ hurries（谓语）+ them（宾语）',
        solution: 'never 是频度副词，作状语；hurries 是谓语；them 是宾语。'
      }
    ])
  ]
})
