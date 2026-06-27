/**
 * 短期记忆管理
 * - 维护多轮对话消息历史
 * - 上下文省略补全（如"那上海呢？"）
 * - 容量上限，自动清理旧消息
 */
import type { Message, ToolCall } from "../agent/types.js";

export interface ShortTermMemoryOptions {
  /** 最大保留消息数，默认 20 */
  maxMessages?: number;
}

export class ShortTermMemory {
  private messages: Message[] = [];
  private lastQueryCity?: string;
  private maxMessages: number;

  constructor(options: ShortTermMemoryOptions = {}) {
    this.maxMessages = options.maxMessages ?? 20;
  }

  /**
   * 添加用户消息
   */
  addUserMessage(content: string): void {
    this.messages.push({ role: "user", content });
    this.trim();
  }

  /**
   * 添加助手消息
   */
  addAssistantMessage(content: string, toolCalls?: ToolCall[]): void {
    this.messages.push({ role: "assistant", content, tool_calls: toolCalls });
    this.trim();
  }

  /**
   * 添加工具调用结果
   */
  addToolResult(toolCallId: string, name: string, content: string): void {
    this.messages.push({
      role: "tool",
      content,
      name,
      tool_call_id: toolCallId,
    });
    this.trim();
  }

  /**
   * 获取当前记忆副本
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * 清空记忆
   */
  clear(): void {
    this.messages = [];
    this.lastQueryCity = undefined;
  }

  /**
   * 设置/更新最近一次查询的城市
   */
  setLastQueryCity(city: string): void {
    this.lastQueryCity = city;
  }

  /**
   * 获取最近一次查询的城市
   */
  getLastQueryCity(): string | undefined {
    return this.lastQueryCity;
  }

  /**
   * 根据上下文补全省略的城市名
   * @param query 用户原始输入
   * @param cityFinder 从查询中提取城市的函数，返回规范化城市名或 null
   * @returns 补全后的查询
   */
  completeQuery(query: string, cityFinder: (q: string) => string | null): string {
    const city = cityFinder(query);
    if (city) {
      this.lastQueryCity = city;
      return query;
    }

    if (this.lastQueryCity) {
      return `（上下文：用户上一轮查询的城市是${this.lastQueryCity}）${query}`;
    }

    return query;
  }

  /**
   * 裁剪旧消息，保持容量上限
   */
  private trim(): void {
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }
}
