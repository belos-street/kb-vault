/**
 * 契约层：只描述「数据和接口长什么样」，不写逻辑。
 * 字段名直接对应 OpenAI Chat Completions 的线格式，
 * 改字段名等于改协议，必须和服务端保持一致。
 */

/**
 * 一个可被模型调用的工具。
 * 描述和 parameters 是给模型看的；run 是给你自己执行的。
 */
export interface Tool {
  /** 工具名：模型靠它指代工具，注册表也靠它查表，必须唯一 */
  name: string
  /** 能力说明：模型据此决定「要不要调这个工具」 */
  description: string
  /**
   * 给模型看的 JSON Schema，描述 run 的参数。
   * 它只随请求下发，不参与本地调用；模型不保证遵守，
   * 所以 run 里仍然要自己兜底。
   */
  parameters: Record<string, unknown>
  /** 真正执行动作的本地函数；抛出的异常由循环层转成 observation */
  run(args: Record<string, unknown>): Promise<unknown>
}

/**
 * 模型返回的一次工具调用请求（不是执行结果）。
 * 它是 assistant 消息的一部分，不是独立的一条消息。
 */
export interface ToolCall {
  /** 本次调用的唯一 id；回填 tool 消息时必须原样带回，用于配对 */
  id: string
  /** 固定为 'function'，为将来可能的其他工具类型留位置 */
  type: 'function'
  function: {
    /** 要调用的工具名，对应 Tool.name */
    name: string
    /** 参数的 JSON 文本（不是对象）；JSON.parse 后才能传给 run */
    arguments: string
  }
}

/**
 * 发给模型的一条消息。
 * 整个对话就是一个 ChatMessage[]，它是 Agent 的工作记忆。
 */
export type ChatMessage =
  | {
      /** 系统提示：定义 Agent 的角色、边界和输出要求 */
      role: 'system'
      content: string
    }
  | {
      /** 用户这一轮的任务 */
      role: 'user'
      content: string
    }
  | {
      /**
       * 模型这一轮的回复。
       * 决定调工具时 content 通常为 null，正文只存在于 tool_calls。
       */
      role: 'assistant'
      content: string | null
      /** 模型要求执行的 0～N 个工具调用 */
      tool_calls?: ToolCall[]
    }
  | {
      /** 工具执行结果，回填给模型，让它生成下一轮回复 */
      role: 'tool'
      /** 对应 ToolCall.id；不是工具名，这是最容易写错的地方 */
      tool_call_id: string
      /** observation 字符串：string 原样，其他类型 JSON.stringify */
      content: string
    }

/**
 * invokeModel 从响应里抽出来的 message。
 * 它是「模型原始输出」，还没被转换成 ChatMessage。
 */
export interface ChatCompletionMessage {
  /** 正文；模型决定调工具时通常为 null */
  content: string | null
  /** 模型要求执行的工具调用；没有时是 undefined */
  tool_calls?: ToolCall[]
}

/** 一次模型调用所需的连接配置，由 config.ts 从环境变量组装 */
export interface ModelConfig {
  /** Bearer Token，只从环境变量读，不写进代码 */
  apiKey: string
  /** OpenAI 兼容端点，如 https://api.deepseek.com，不含具体路径 */
  baseUrl: string
  /** 模型名，如 deepseek-v4-flash */
  model: string
}

/**
 * 执行轨迹的一步，只用于展示 / 断言 / 调试，
 * 不参与发给模型的 messages。
 */
export type AgentStep =
  | {
      type: 'tool'
      /** 工具名 */
      name: string
      /** 解析后的参数（JSON.parse 的结果），解析失败时是空对象 */
      args: Record<string, unknown>
      /** 回填给模型的字符串；失败时是错误文本 */
      observation: string
      /** 失败原因；成功时没有该字段 */
      error?: string
    }
  | {
      type: 'final'
      /** 模型的最终回答 */
      content: string
    }

export interface RunAgentOptions {
  /**
   * 最多调用模型几次（不是工具调用次数），默认 5。
   * 小于 1 时在发请求之前就抛 RangeError。
   */
  maxSteps?: number
}

/** runAgent 的返回值 */
export interface AgentResult {
  /** 最终回答，也就是最后一条 assistant 的 content */
  answer: string
  /** 执行轨迹：每次工具调用一步，最后一条 final 一步 */
  steps: AgentStep[]
  /**
   * 完整对话历史（system、user、assistant、tool 全在内）。
   * 用于续跑和排查「模型到底收到了什么」，不要拿它当 steps 用。
   */
  messages: ChatMessage[]
}
