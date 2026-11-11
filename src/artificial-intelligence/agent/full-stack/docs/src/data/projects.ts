export interface Project {
  id: string
  name: string
  kind: 'growth' | 'standalone'
  chain?: string
  stages: string[]
  description: string
  artifact: string
  startLessonId: string
  /** 该项目真正承载的篇数（不含选型 / 引子等支撑篇） */
  landingCount: number
}

export const projects: Project[] = [
  {
    id: 'p01',
    name: '项目 01 天气 Agent',
    kind: 'standalone',
    stages: ['阶段一'],
    description: 'Hono + SSE + 单工具，四篇代码合成一个可运行服务；练习项目，源码暂未随 docs 交付。',
    artifact: '练习项目 · 源码不交付',
    startLessonId: 's1-1',
    landingCount: 4
  },
  {
    id: 'p02',
    name: '项目 02 客服系统',
    kind: 'growth',
    chain: '客服链',
    stages: ['阶段二', '阶段四', '阶段十一'],
    description: 'v1 多轮 + 工具 → v2 图化 + 审批 → v3 安全加固。',
    artifact: '客服系统 v3',
    startLessonId: 's2-1',
    landingCount: 10
  },
  {
    id: 'p03',
    name: '项目 03 文档问答 CLI',
    kind: 'growth',
    chain: '知识库链',
    stages: ['阶段三'],
    description: '50 行内存检索 → 带引用回答，零中间件。',
    artifact: '文档问答 CLI',
    startLessonId: 's3-1',
    landingCount: 3
  },
  {
    id: 'p04',
    name: '项目 04 数据分析助手',
    kind: 'standalone',
    stages: ['阶段五'],
    description: 'SQL Agent + 可视化 Agent + 主管收口。',
    artifact: '多 Agent 数据分析',
    startLessonId: 's5-1',
    landingCount: 3
  },
  {
    id: 'p05',
    name: '项目 05 企业知识库',
    kind: 'growth',
    chain: '知识库链',
    stages: ['阶段六', '阶段七'],
    description: 'v1 生产检索栈 → v2 Agentic 检索 + MCP 网关。',
    artifact: '企业知识库 v2',
    startLessonId: 's6-1',
    landingCount: 8
  },
  {
    id: 'p06',
    name: '项目 06 实时协作写作助手',
    kind: 'standalone',
    stages: ['阶段八'],
    description: '流式前端 + Agent UI，把过程展示出来。',
    artifact: '写作助手',
    startLessonId: 's8-1',
    landingCount: 3
  },
  {
    id: 'p07',
    name: '项目 07 自动化工作流平台',
    kind: 'standalone',
    stages: ['阶段九'],
    description: '容器 + 队列 + 调度 + 补偿。',
    artifact: '工作流平台',
    startLessonId: 's9-1',
    landingCount: 4
  },
  {
    id: 'p08',
    name: '项目 08 监控与评估平台',
    kind: 'standalone',
    stages: ['阶段十'],
    description: 'Trace + 指标 + 评估 + 成本看板。',
    artifact: '监控评估平台',
    startLessonId: 's10-1',
    landingCount: 5
  }
]
