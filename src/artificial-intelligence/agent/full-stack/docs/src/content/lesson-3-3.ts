import type { Block } from '../data/types.ts'

export const lesson33: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**评估**。3.1 跑通闭环、3.2 把切分与向量调好，但「调好了」不能靠手感。本篇把检索质量压成三条可断言，再算清 recall@k 与忠实度。速过篇，不引入评估平台；LangSmith / RAGAS 的工程化回归留给阶段十。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '评估不是打分，是回归',
    text: '评估的价值不在「今天多少分」，而在「换模型、改 chunk、调阈值之后，能不能立刻知道有没有变差」。没有评估集，所有优化都是玄学；有了评估集，才知道刚才那次改动是提升还是自我感动。'
  },
  { kind: 'h2', text: '三条可断言：命中、引用、拒答' },
  {
    kind: 'p',
    text: '先不追求指标体系完整，只写三条能自动判定的断言。它们分别覆盖检索、引用、以及「不知道」这一产品能力。三条都过，再谈忠实度与端到端正确率。'
  },
  {
    kind: 'table',
    head: ['断言', '判定方式', '失败意味着'],
    rows: [
      [
        '命中',
        '可答题的 gold chunk 出现在 top-k 内',
        '切分、Embedding 或 query 有问题'
      ],
      [
        '引用',
        '回答引用的 chunk 与 gold 一致（本篇简化为 top-1）',
        '引用回填错位，或排序把 gold 挤下去了'
      ],
      ['拒答', '不可答题的最高分低于阈值', '阈值过低，或语料里混入了无关内容']
    ]
  },
  { kind: 'demo', id: 'rag-eval' },
  {
    kind: 'p',
    text: '把 k 调大，recall 会上去，但噪声和上下文成本也上去；把阈值调高，拒答更保守，误拒开始出现。三个指标互相拉扯，评估集的作用就是让这种拉扯变成可比较的数字，而不是拍脑袋。'
  },
  { kind: 'h2', text: '算清 recall@k，手算忠实度' },
  {
    kind: 'p',
    text: 'recall@k 的分母是**可答题**，不是全部题。把不可答题混进分母，会让指标看起来「因为拒答而变差」，掩盖真正的召回问题。'
  },
  {
    kind: 'math',
    latex: String.raw`\begin{aligned}
\text{recall@}k &= \frac{\left|\{\, i\in A : \text{gold}_i \in \text{top-}k_i \,\right|}{|A|} \\
\text{citationHit} &= \frac{\left|\{\, i\in A : \text{top-}1_i = \text{gold}_i \,\right|}{|A|} \\
\text{rejectionAcc} &= \frac{\left|\{\, i\in U : \text{score}_i < \tau \,\right|}{|U|}
\end{aligned}`,
    caption:
      '`A` 是可答题集、`U` 是不可答题集、`τ` 是阈值。三个分母不同，这是最容易写错的地方；`|·|` 表示集合的题数。'
  },
  {
    kind: 'code',
    title: 'evaluate.ts：三条机判指标',
    lang: 'ts',
    code: String.raw`type EvalCase = { id: string; query: string; gold: string | null }
type Run = { caseId: string; ranked: string[]; top1Score: number }

type Report = {
  recallAtK: number
  citationHit: number
  rejectionAccuracy: number
}

function ratio(part: number, total: number): number {
  return total === 0 ? 0 : part / total
}

export function evaluate(
  cases: EvalCase[],
  runs: Run[],
  k: number,
  threshold: number
): Report {
  const answerable = cases.filter((item) => item.gold !== null)
  const unanswerable = cases.filter((item) => item.gold === null)
  const runOf = (id: string) => runs.find((run) => run.caseId === id)

  // 命中：gold 在 top-k 内
  const recalled = answerable.filter((item) => {
    const run = runOf(item.id)
    return run ? run.ranked.slice(0, k).includes(item.gold ?? '') : false
  })

  // 引用：已作答（分数过阈值）且 top-1 就是 gold
  const cited = answerable.filter((item) => {
    const run = runOf(item.id)
    return run ? run.top1Score >= threshold && run.ranked[0] === item.gold : false
  })

  // 拒答：不可答题的最高分低于阈值
  const rejected = unanswerable.filter((item) => {
    const run = runOf(item.id)
    return run ? run.top1Score < threshold : false
  })

  return {
    recallAtK: ratio(recalled.length, answerable.length),
    citationHit: ratio(cited.length, answerable.length),
    rejectionAccuracy: ratio(rejected.length, unanswerable.length)
  }
}

if (import.meta.main) {
  const evalSet = (await Bun.file('eval-set.json').json()) as {
    docVersion: string
    cases: EvalCase[]
  }
  const runs = (await Bun.file('runs.json').json()) as Run[]
  const k = Number(process.env.K ?? 3)
  const threshold = Number(process.env.THRESHOLD ?? 0.6)
  const report = evaluate(evalSet.cases, runs, k, threshold)

  console.log('docVersion:', evalSet.docVersion)
  console.log('recall@' + k + ':', report.recallAtK.toFixed(2))
  console.log('citationHit:', report.citationHit.toFixed(2))
  console.log('rejectionAccuracy:', report.rejectionAccuracy.toFixed(2))
}`,
    caption:
      '`bun run evaluate.ts` 读取同目录的 `eval-set.json` 与 `runs.json`，打印三个数；`K` / `THRESHOLD` 用环境变量覆盖。口径统一：分母分别是可答题、可答题、不可答题。'
  },
  {
    kind: 'table',
    head: ['指标', '公式', '标注成本'],
    rows: [
      ['recall@k', '黄金块在 top-k 的题数 / 可答题数', '只需标 gold chunk'],
      [
        '引用命中率',
        '已作答且 top-1 = gold 的题数 / 可答题数',
        '只需标 gold chunk'
      ],
      ['拒答正确率', '正确拒答的题数 / 不可答题数', '需要构造不可答题'],
      ['忠实度', '有依据的 claims / 总 claims', '人工或 LLM judge'],
      [
        '端到端正确率',
        '答案要点覆盖的题数 / 可答题数',
        '需要 gold answer，最贵'
      ]
    ]
  },
  {
    kind: 'p',
    text: '忠实度没有免费的机判公式，但有可执行的手算流程：把回答拆成独立 claims，逐条回到 top-k 里找依据，最后用「有依据条数 / 总条数」计分。它衡量的是「回答有没有超出检索结果」，不衡量「检索结果本身对不对」。'
  },
  {
    kind: 'math',
    latex: String.raw`\text{fidelity} = \frac{\text{supported claims}}{\text{total claims}} = \frac{2}{3} \approx 0.67`,
    caption:
      '`0.67` 是手算结果，不是脚本输出：claims 要靠人工或 LLM judge 逐条找依据。先算清标注成本，再决定要不要把这条指标纳入回归。'
  },
  {
    kind: 'table',
    head: ['步骤', '做法', '示例'],
    rows: [
      [
        '拆 claims',
        '一句一条，去掉语气词',
        '「款项 3-5 个工作日原路退回」是一条 claim'
      ],
      ['找依据', '在 top-k 原文里找支持句', 'c1 明确写了 3-5 个工作日'],
      ['计分', '有依据条数 / 总条数', '3 条中 2 条有依据 → 0.67']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '忠实度 ≠ 正确性',
    text: '回答可能完全忠实于检索结果，但检索结果本身是错的（文档过期、gold 标错）。忠实度测「有没有依据」，正确性测「依据对不对」。两者都要，别用一个指标代替另一个。'
  },
  { kind: 'h2', text: '评估集怎么建：20 条起步' },
  {
    kind: 'list',
    items: [
      '**真实问题**：从客服记录、站内搜索日志里捞 10 条，保留原始口语表达。',
      '**文档反推**：每篇文档按标题造 1 条，答案必须能在该文档内找到。',
      '**边界问题**：改写、错别字、跨文档各 1-2 条，用来测鲁棒性。',
      '**不可答题**：3-5 条文档里确实没有答案的问题，用来测拒答。',
      '**标注 gold chunk**：只标 chunk id，不标全文；同时记录文档版本。'
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: '评估集与文档版本绑定',
    text: '文档更新后 gold chunk 可能失效，评估集要跟着改版本号。否则指标会「无缘无故变差」，团队开始互相怀疑，最后没人再信这套评估。'
  },
  {
    kind: 'code',
    title: 'eval-set.json：评估集结构（片段示例）',
    lang: 'json',
    code: String.raw`{
  "docVersion": "kb-2026-11-25",
  "cases": [
    { "id": "q1", "query": "退款多久到账？", "gold": "c1" },
    { "id": "q2", "query": "发票抬头有什么要求？", "gold": "c2" },
    { "id": "q3", "query": "密码错几次会锁定？", "gold": "c3" },
    { "id": "q4", "query": "成员有哪几种角色？", "gold": "c4" },
    { "id": "q5", "query": "备份保留多久？", "gold": "c5" },
    { "id": "q6", "query": "支持微信支付吗？", "gold": null },
    { "id": "q7", "query": "会员积分怎么兑换？", "gold": null },
    { "id": "q8", "query": "可以开纸质发票吗？", "gold": null }
  ]
}`,
    caption:
      '`docVersion` 与文档版本绑定；这里 8 条是片段示例，完整评估集 20 条起步、至少 3 条 null。`gold` 只标 chunk id，不标全文。'
  },
  {
    kind: 'code',
    title: 'runs.json：检索结果，评估只消费它',
    lang: 'json',
    code: String.raw`[
  { "caseId": "q1", "ranked": ["c1", "c2", "c5"], "top1Score": 0.86 },
  { "caseId": "q2", "ranked": ["c2", "c1", "c5"], "top1Score": 0.84 },
  { "caseId": "q3", "ranked": ["c3", "c1", "c2"], "top1Score": 0.79 },
  { "caseId": "q4", "ranked": ["c5", "c4", "c3"], "top1Score": 0.77 },
  { "caseId": "q5", "ranked": ["c5", "c1", "c3"], "top1Score": 0.82 },
  { "caseId": "q6", "ranked": ["c2", "c1", "c5"], "top1Score": 0.44 },
  { "caseId": "q7", "ranked": ["c3", "c4", "c1"], "top1Score": 0.39 },
  { "caseId": "q8", "ranked": ["c2", "c1", "c5"], "top1Score": 0.47 }
]`,
    caption:
      '`runs.json` 由检索脚本产出，评估只消费它、不重复实现检索。`ranked` 是完整排序，取前 k 即 top-k；q4 的 top-1 被 c5 抢走，正好用来验证「recall 高但引用错」。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '引用口径的简化',
    text: '真实回答的引用是「模型输出里带的 chunk id」，本篇用「top-1 是否等于 gold」做近似：检索都指错了，引用不可能对。接上生成后，把判定换成「回答里引用的 id 是否包含 gold」，分母口径不变。'
  },
  {
    kind: 'p',
    text: '评估集建好后，把它固化成三个文件：`eval-set.json`（题与 gold）、`runs.json`（检索产物）、`evaluate.ts`（指标与 CLI）。改一次 chunk 大小或阈值就重跑一次，三个数就是最小回归测试；阶段十的评估平台只是把这个动作工程化，不是换一套逻辑。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '20 条评估集就位（可先用 8 条片段跑通），其中至少 3 条不可答题',
      '`bun run evaluate.ts` 能输出 recall@k、引用命中率、拒答正确率三个数',
      '改一次 chunk 大小或阈值后重跑，至少一个指标变化且能解释原因',
      '任取一条回答，能拆出 claims 并手算出忠实度',
      '能说清三个指标的分母分别是什么'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `evaluate.ts`（含 CLI）、`eval-set.json` / `runs.json` 结构、一张指标口径表。阶段三到此收口：项目 03 把检索、切分与评估拼成文档问答 CLI（源码待补，落点见下）；向量库与生产检索栈从阶段六开始，`Retriever` 接口保持不变。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '项目 03 落点',
    text: '项目 03 = 3.1 的 `retrieve.ts` + 3.2 的 `split.ts` + 3.3 的 `evaluate.ts` 拼成 `ask.ts` CLI：索引本地 Markdown → 检索 → 带引用回答 → 跑评估。源码统一落在 agent-fullstack-handcraft（项目 03，仓库待补）；本阶段只保证三个片段可独立验证（retrieve / evaluate 自带入口，split 配 3 行入口），不把「项目已完成」写进验收。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '生产化路线图：3.x 的手写件去哪了',
    text: '3.x 的手写件不是生产实现，而是接口的参考实现。下一步按这张映射走：`cosine + 数组` → 6.1 的 pgvector / Qdrant / Milvus（距离算子 + ANN 索引）；`splitDoc` → 6.6 的 LangChain 切分器与 token 计量；`evaluate.ts` → 6.3 / 6.4 的混合召回与重排回归；内存索引 → 6.6 的解析流水线与幂等入库。先读 6.1，再按需跳到 6.6。'
  },
  {
    kind: 'exercise',
    title: '3.3 练习：把检索变成可回归的评估',
    items: [
      {
        id: 's3-3-e1',
        level: '基础',
        question:
          '从 3.1 的 5 条示例语料里选 3 条写可答题，再补 2 条不可答题，共 5 条评估题并标注 gold chunk。',
        hint: '不可答题要「看起来相关但文档里真的没有答案」，不要用「今天天气」这种明显无关的问题。',
        answer:
          '可答题分别指向 c1 / c2 / c3；不可答题例如「支持微信支付吗」「积分怎么兑换」，gold 为 null。',
        solution:
          '不可答题是关键：它们测的是拒答能力。gold 记 null，最高分应低于阈值；如果这类题总是被硬答，先调阈值再查语料。'
      },
      {
        id: 's3-3-e2',
        level: '改造',
        question:
          '把阈值从 0.35 改到 0.5、0.65，记录三个指标各怎么变，并写一句取舍。',
        hint: '每次只改阈值，k 与评估集不动。',
        answer:
          '阈值升高：可答题被误拒，引用命中率下降，拒答正确率上升；阈值降低则相反。取舍是「宁可误拒，还是宁可误答」。',
        solution:
          '记录每次的三个数，画出趋势；如果误拒集中在某类短 query，说明阈值不该全局统一，应按 query 类型分档（3.1 练习 e2）。'
      },
      {
        id: 's3-3-e3',
        level: '排障',
        question:
          'recall@3 很高，但引用命中率很低。列出两种可能原因和对应修复。',
        hint: 'gold 在 top-k 里，但没被引用——问题在排序还是引用回填？',
        answer:
          'top-1 不是 gold（排序差，需要 rerank 或调 k）；引用回填错位（拼接与 id 映射错）。',
        solution:
          '先看 top-1 与 gold 的分数差：差得远是排序问题，上 rerank；差得近但引用错，检查引用是否按 id 回填而不是按数组下标。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        'RAG 怎么评估？',
        '三条机判（命中 / 引用 / 拒答）+ 两项人工（忠实度 / 正确率）；从 20 条评估集起步，固化成脚本。'
      ],
      [
        'recall@k 怎么算？',
        '分母是可答题，分子是 gold chunk 落在 top-k 内的题数；不可答题不进分母。'
      ],
      [
        '忠实度怎么衡量？',
        '把回答拆成 claims，逐条在检索结果里找依据，有依据条数 / 总条数；或 LLM judge 加人工抽检。'
      ],
      [
        '为什么不用 BLEU / ROUGE？',
        '生成式回答措辞自由，n-gram 重叠与「是否有依据」不相关；RAG 看命中、引用与忠实度。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：评估集能不能用来调参？',
    text: '不能既当训练集又当测试集。调 chunk、阈值、模型时用「开发集」，最终结论用没参与调参的「测试集」；全用同一套，指标只会告诉你「拟合得不错」。评估集至少要留 30% 不参与调参。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'RAGAS 文档',
        href: 'https://docs.ragas.io/',
        note: '忠实度、答案相关性等指标的工程实现'
      },
      {
        label: 'LangSmith Evaluation',
        href: 'https://docs.langchain.com/langsmith/evaluate-llm-application',
        note: '评估集、实验与回归（阶段十展开）'
      },
      {
        label: 'rag-algorithms：检索评估',
        href: 'https://belos-street.github.io/kb-vault/artificial-intelligence/agent/rag-algorithms/README.html',
        note: 'recall、precision 与排序指标的算法细节'
      }
    ]
  }
]
