/**
 * ReAct 循环核心实现
 * Think → Act → Observe → Response
 *
 * 集成：
 * - 短期记忆（上下文省略补全、历史管理）
 * - RAG FAQ 检索（无城市名的天气常识问题）
 */
import OpenAI from "openai";
import { config } from "../config.js";
import { ShortTermMemory } from "../memory/short-term.js";
import { buildMessages } from "../prompts/system.js";
import { retrieveFAQ, type FAQResult } from "../rag/retriever.js";
import { WeatherService } from "../services/weather.js";
import { tools, getToolByName } from "./tools.js";
import type { Message, ReActStep, ToolCall } from "./types.js";

// 初始化 OpenAI 客户端（兼容 OpenAI 兼容 API）
export const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL,
});

const weatherService = new WeatherService();

// 将内部 Tool 定义转换为 OpenAI 工具格式
const openAiTools = tools.map((tool) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}));

export interface RunReActOptions {
  query: string;
  memory?: ShortTermMemory;
  /** 是否启用 RAG 检索，默认 true */
  useRag?: boolean;
  /** RAG 相似度阈值，默认 0.7 */
  ragThreshold?: number;
}

export interface RunReActResult {
  step: ReActStep;
  messages: Message[];
  usedRag: boolean;
  ragResults: FAQResult[];
}

/**
 * 执行一次 ReAct 循环
 * @param options.query 用户当前输入
 * @param options.memory 短期记忆实例
 * @param options.useRag 是否启用 FAQ 向量检索
 * @param options.ragThreshold RAG 结果相似度阈值
 * @returns 包含 ReAct 步骤和完整消息列表的结果
 */
export async function runReAct(options: RunReActOptions): Promise<RunReActResult> {
  const { query, memory, useRag = true, ragThreshold = 0.7 } = options;

  // 1. 上下文省略补全
  const completedQuery = memory
    ? memory.completeQuery(query, (q) => weatherService.findCityInQuery(q))
    : query;

  // 2. 获取历史消息（不含当前用户消息）
  const history = memory ? memory.getMessages() : [];

  // 3. RAG 检索：当查询中没有城市名时，尝试检索天气 FAQ
  let ragContext: string | undefined;
  let ragResults: FAQResult[] = [];
  if (useRag && !weatherService.findCityInQuery(completedQuery)) {
    ragResults = await retrieveFAQ(completedQuery, 3);
    const relevantFaqs = ragResults.filter((faq) => faq.score >= ragThreshold);
    if (relevantFaqs.length > 0) {
      ragContext =
        "以下是与用户问题相关的天气常识，可作为参考：\n\n" +
        relevantFaqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n");
    }
  }

  // 4. Think：构建消息并请求 LLM 决定是否需要调用工具
  const messages = buildMessages(completedQuery, history, ragContext);

  let assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessage;
  try {
    const completion = await openai.chat.completions.create({
      model: config.DEFAULT_MODEL,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      tools: openAiTools,
    });
    assistantMessage = completion.choices[0].message;
    messages.push(assistantMessage as Message);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`LLM 调用失败：${message}`);
  }

  const thought = assistantMessage.content || "";
  const actions: ToolCall[] = assistantMessage.tool_calls || [];

  // 5. Act：执行工具调用
  // 6. Observe：收集观察结果
  const observations: string[] = [];
  for (const toolCall of actions) {
    const tool = getToolByName(toolCall.function.name);
    let observation: string;

    if (!tool) {
      observation = `未找到工具「${toolCall.function.name}」`;
    } else {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        observation = await tool.execute(args);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        observation = `工具调用失败：${message}`;
      }
    }

    observations.push(observation);
    messages.push({
      role: "tool",
      content: observation,
      name: toolCall.function.name,
      tool_call_id: toolCall.id,
    });
  }

  // 7. Response：基于观察结果生成最终回复
  let response = thought;
  if (actions.length > 0) {
    try {
      const completion = await openai.chat.completions.create({
        model: config.DEFAULT_MODEL,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      });
      const finalMessage = completion.choices[0].message;
      response = finalMessage.content || "";
      messages.push(finalMessage as Message);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`生成最终回复失败：${message}`);
    }
  }

  const step: ReActStep = {
    thought,
    actions,
    observations,
    response,
  };

  // 8. 更新短期记忆
  if (memory) {
    memory.addUserMessage(query);
    if (actions.length === 0) {
      memory.addAssistantMessage(response);
    } else {
      memory.addAssistantMessage(thought, actions);
      for (let i = 0; i < actions.length; i++) {
        memory.addToolResult(actions[i].id, actions[i].function.name, observations[i]);
      }
      memory.addAssistantMessage(response);
    }
  }

  return { step, messages, usedRag: !!ragContext, ragResults };
}
