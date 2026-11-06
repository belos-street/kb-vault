/**
 * 业务工具：四个工具的协议定义 + 参数 schema + 执行入口。
 *
 * 作用
 * - createBusinessTools 在组装阶段接收 seed 与 userId，工具通过闭包持有业务依赖。
 * - 因此 agent/tool.ts 的 run 只接收 args，agent 层完全不认识订单和工单。
 *
 * 约定
 * - 工具名唯一，注册表靠它查表，循环里不硬编码工具名。
 * - 只读工具 idempotent = true；写操作 idempotent = false，且需要审批。
 * - 参数 schema 用 Zod 写一份，同时生成给模型看的 JSON Schema 和运行时校验。
 * - 失败返回 { ok: false, reason } 或抛错，由循环层转成 observation。
 */
import { z } from 'zod'
import type { ToolDefinition } from '../agent/tool'
import type { SeedData } from './types'

export const QueryOrderArgs = z.object({
  order_id: z.string().min(1).describe('订单号，例如 SO-2026-0812')
})

export const SearchPolicyArgs = z.object({
  query: z.string().min(1).describe('政策关键词，例如 退款政策')
})

export const ProcessRefundArgs = z.object({
  order_id: z.string().min(1).describe('订单号'),
  reason: z.string().min(1).describe('退款原因')
})

export const CreateTicketArgs = z.object({
  type: z.enum(['refund', 'logistics', 'complaint', 'other']),
  summary: z.string().min(1).describe('工单摘要')
})

/** Zod schema → 请求体里的 parameters；去掉部分服务端不接受的 $schema。 */
function toParameters(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>
  delete json.$schema
  return json
}

/**
 * 构造四个业务工具。
 *
 * 为什么用工厂函数而不是模块级常量
 * - seed 和 userId 是运行时依赖，必须在组装阶段注入。
 * - 工具闭包持有它们，agent 层就不需要理解业务上下文。
 */
export function createBusinessTools(
  seed: SeedData,
  userId: string
): Record<string, ToolDefinition> {
  // 骨架阶段先占位；实现 run 时直接使用 seed 与 userId
  void seed
  void userId

  return {
    query_order: {
      name: 'query_order',
      description:
        '查询当前用户的一笔订单快照。订单不存在或不属于当前用户时返回失败原因。',
      parameters: toParameters(QueryOrderArgs),
      idempotent: true,
      requiresApproval: false,
      async run() {
        throw new Error(
          'TODO 第 1 步：解析参数 → canAccessOrder → 返回订单快照'
        )
      }
    },
    search_policy: {
      name: 'search_policy',
      description:
        '检索售后政策知识库，例如退款、物流、发票、会员规则。仅限政策类问题。',
      parameters: toParameters(SearchPolicyArgs),
      idempotent: true,
      requiresApproval: false,
      async run() {
        throw new Error(
          'TODO 第 1 步：调用 searchFaq，未命中返回"知识库未覆盖"'
        )
      }
    },
    process_refund: {
      name: 'process_refund',
      description: '为当前用户的一笔订单发起退款。执行前必须经过人工审批。',
      parameters: toParameters(ProcessRefundArgs),
      idempotent: false,
      requiresApproval: true,
      async run() {
        throw new Error(
          'TODO 第 1 步：checkRefundable → applyRefund → 返回新状态'
        )
      }
    },
    create_ticket: {
      name: 'create_ticket',
      description: '创建一张人工工单。执行前必须经过人工审批。',
      parameters: toParameters(CreateTicketArgs),
      idempotent: false,
      requiresApproval: true,
      async run() {
        throw new Error('TODO 第 1 步：调用 appendTicket → 返回工单号')
      }
    }
  }
}
