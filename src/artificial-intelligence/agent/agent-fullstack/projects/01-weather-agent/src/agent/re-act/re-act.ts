/**
 * ReAct 循环核心实现
 * Think → Act → Observe → Response
 *
 * 集成：
 * - 短期记忆（上下文省略补全、历史管理）
 * - RAG FAQ 检索（无城市名的天气常识问题）
 */

import OpenAI from 'openai'
import { config } from '../../config'
import { buildMessages } from '../../prompts/system'
import type { Message } from '../../prompts/type'
import { getToolByName, toOpenAiTools } from '../tools/weather-tool'
import { retrieveFaq } from '../rag/faq'
import type { StepEvent } from '../type'

// 初始化 OpenAI 客户端（兼容 OpenAI 兼容 API）
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL
})

/**
 * 运行 ReAct 循环：Think → Act → Observe → Response
 *
 * 1. 调用 LLM，LLM 决定是否调用工具
 * 2. 若需调用工具，执行工具并返回结果给 LLM
 * 3. LLM 根据结果生成最终回复
 *
 * @param onStep - 可选的回调，每阶段触发，供 CLI 展示进度
 */
export async function runAgent(
  userMessage: string,
  history: Message[],
  onStep?: (step: StepEvent) => void
): Promise<string> {
  // Step 0: Retrieve — FAQ 关键词检索
  const faq = retrieveFaq(userMessage)
  const ragContext = faq
    ? `参考知识：\n问：${faq.question}\n答：${faq.answer}`
    : undefined
  if (faq) {
    onStep?.({ type: 'retrieve', result: faq.question })
  }

  const messages = buildMessages(userMessage, history, ragContext)
  const openaiTools = toOpenAiTools()

  // Step 1: Think — 调用 LLM
  onStep?.({ type: 'think' })
  const response = await openai.chat.completions.create({
    model: config.DEFAULT_MODEL,
    messages: messages as any,
    tools: openaiTools.length > 0 ? openaiTools : undefined,
    tool_choice: 'auto'
  })

  const choice = response.choices[0]
  if (!choice) {
    return '助手暂时无法响应，请稍后再试。'
  }

  // 不需要调用工具，直接返回
  if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
    return choice.message.content ?? ''
  }

  // Step 2: Act — 执行工具
  const assistantMessage = {
    role: 'assistant' as const,
    content: choice.message.content ?? '',
    tool_calls: choice.message.tool_calls
  }

  const toolResults: Message[] = []
  for (const tc of choice.message.tool_calls) {
    const toolCall = tc as {
      id: string
      function: { name: string; arguments: string }
    }
    onStep?.({
      type: 'act',
      tool: toolCall.function.name,
      args: toolCall.function.arguments
    })

    const tool = getToolByName(toolCall.function.name)
    if (!tool) {
      const msg = `未知工具：${toolCall.function.name}`
      toolResults.push({
        role: 'tool',
        content: msg,
        tool_call_id: toolCall.id,
        name: toolCall.function.name
      })
      onStep?.({ type: 'observe', tool: toolCall.function.name, result: msg })
      continue
    }

    try {
      const args = JSON.parse(toolCall.function.arguments)
      const result = await tool.execute(args)
      toolResults.push({
        role: 'tool',
        content: result,
        tool_call_id: toolCall.id,
        name: toolCall.function.name
      })
      onStep?.({ type: 'observe', tool: toolCall.function.name, result })
    } catch (e) {
      const msg = `工具执行失败：${(e as Error).message}`
      toolResults.push({
        role: 'tool',
        content: msg,
        tool_call_id: toolCall.id,
        name: toolCall.function.name
      })
      onStep?.({ type: 'observe', tool: toolCall.function.name, result: msg })
    }
  }

  // Step 3: Observe — 把工具结果回传 LLM，让它生成最终回复
  onStep?.({ type: 'response' })
  const finalMessages = [...messages, assistantMessage, ...toolResults] as any

  const finalResponse = await openai.chat.completions.create({
    model: config.DEFAULT_MODEL,
    messages: finalMessages,
    tools: openaiTools.length > 0 ? openaiTools : undefined,
    tool_choice: 'auto'
  })

  const finalChoice = finalResponse.choices[0]
  return finalChoice?.message.content ?? ''
}
