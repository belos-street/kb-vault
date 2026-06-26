/**
 * ReAct 循环核心实现
 *
 * ReAct = Reasoning（推理） + Acting（行动）
 * 核心思想：LLM 先思考（Thought），再决定是否调用工具（Action），
 * 获取工具返回结果（Observation），最终基于观察生成回答（Response）。
 *
 * 流程：
 *   用户消息 → LLM 思考 → [需要工具？] → 调用工具 → 获取结果 → 继续思考/生成回答
 *                ↑________________________________↓（最多循环 5 次）
 */
import OpenAI from 'openai'
import type { Message, ReActStep } from './types.js'
import { config } from '../config.js'
import { buildMessages } from '../prompts/system.js'
import { tools, getToolByName } from './tools.js'

/** OpenAI 客户端实例，复用连接以减少延迟 */
const client = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL
})

/**
 * 将内部 Tool[] 转换为 OpenAI function calling 格式
 *
 * OpenAI API 要求工具定义包含 type: "function"，并将 JSON Schema
 * 放在 function.parameters 中。
 */
function toOpenAITools() {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters as Record<string, unknown>
    }
  }))
}

/**
 * 将内部 Message[] 转换为 OpenAI Chat Completions API 格式
 *
 * 关键差异处理：
 * - assistant 消息：需要传递 tool_calls 数组
 * - tool 消息：需要传递 tool_call_id 以关联调用
 *
 * @param msgs - 内部消息数组
 * @returns OpenAI API 兼容的消息数组
 */
function toOpenAIMessages(
  msgs: Message[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return msgs.map((msg) => {
    const base = {
      role: msg.role,
      content: msg.content
    } as OpenAI.Chat.ChatCompletionMessageParam
    // assistant 消息可能包含 tool_calls 请求
    if (msg.role === 'assistant' && msg.tool_calls) {
      ;(base as OpenAI.Chat.ChatCompletionAssistantMessageParam).tool_calls =
        msg.tool_calls
    }
    // tool 消息必须携带 tool_call_id 以关联调用
    if (msg.role === 'tool') {
      const toolMsg = base as OpenAI.Chat.ChatCompletionToolMessageParam
      toolMsg.tool_call_id = msg.tool_call_id!
    }
    return base
  })
}

/**
 * 执行 ReAct 循环，处理用户查询
 *
 * 完整流程：
 * 1. 构建消息（system prompt + 历史 + 用户消息）
 * 2. 调用 LLM，获取思考结果
 * 3. 如果 LLM 请求工具调用：
 *    a. 解析参数，执行工具
 *    b. 记录 thought/action/observation 到 steps
 *    c. 将工具结果追加到消息历史
 *    d. 继续循环（最多 5 轮）
 * 4. 如果 LLM 直接回复：记录为 finalResponse，结束循环
 *
 * @param userMessage - 用户输入的查询内容
 * @param history - 历史对话记录（可选，用于多轮对话）
 * @returns 最终回复和 ReAct 步骤记录
 */
export async function runAgent(
  userMessage: string,
  history: Message[] = []
): Promise<{ response: string; steps: ReActStep[] }> {
  const steps: ReActStep[] = []
  // 构建包含 system prompt 的完整消息列表
  const messages = buildMessages(userMessage, history)
  // 预转换工具格式，避免每次循环重复转换
  const openaiTools = toOpenAITools()

  let finalResponse = ''
  let remainingTurns = 5 // 防止无限循环的最大轮次

  // ReAct 主循环：思考 → 行动 → 观察 → 重复
  while (remainingTurns > 0) {
    remainingTurns--

    // 调用 LLM，支持工具选择
    const completion = await client.chat.completions.create({
      model: config.DEFAULT_MODEL,
      messages: toOpenAIMessages(messages),
      tools: openaiTools,
      tool_choice: 'auto' // 让 LLM 自主决定是否调用工具
    })

    const choice = completion.choices[0]
    const assistantMsg = choice.message

    // LLM 决定调用工具
    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      const thought = assistantMsg.content || '' // LLM 的推理过程

      const toolMessages: Message[] = []

      // 执行所有工具调用（支持并行调用多个工具）
      for (const tc of assistantMsg.tool_calls) {
        const tool = getToolByName(tc.function.name)
        let observation: string
        try {
          // 解析 JSON 参数字符串，执行工具
          const args = JSON.parse(tc.function.arguments)
          const result = await tool!.execute(args)
          observation = result
        } catch (error: unknown) {
          // 工具执行失败时，将错误信息作为观察结果返回给 LLM
          observation = `错误：${error instanceof Error ? error.message : String(error)}`
        }

        // 记录 ReAct 步骤：思考 → 行动 → 观察
        steps.push({
          thought,
          action: {
            id: tc.id,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments
            }
          },
          observation
        })

        // 构建工具返回消息，关联 tool_call_id
        toolMessages.push({
          role: 'tool',
          content: observation,
          name: tc.function.name,
          tool_call_id: tc.id
        })
      }

      // 将 assistant 的工具调用请求加入消息历史
      messages.push({
        role: 'assistant',
        content: assistantMsg.content || '',
        tool_calls: assistantMsg.tool_calls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
      })

      // 将工具执行结果加入消息历史
      messages.push(...toolMessages)
    } else {
      // LLM 直接回复，不需要工具调用，循环结束
      finalResponse = assistantMsg.content || ''
      steps.push({
        thought: '',
        response: finalResponse
      })
      break
    }
  }

  // 防御性处理：如果循环耗尽仍未生成回复
  if (!finalResponse) {
    finalResponse = '抱歉，我无法处理您的请求，请稍后重试。'
  }

  return { response: finalResponse, steps }
}
