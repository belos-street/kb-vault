/**
 * 只读业务数据加载。
 *
 * 作用
 * - 启动时把三个 JSON 读进内存，之后所有工具都操作这份内存副本。
 * - 需要落盘时写 data/runtime/，不要改 data/seed/。
 */
import type { Order, PolicyFaq, SeedData, Ticket } from './types'

export async function loadSeed(): Promise<SeedData> {
  const read = async <T>(relativePath: string): Promise<T> => {
    const file = Bun.file(new URL(relativePath, import.meta.url))
    return (await file.json()) as T
  }

  return {
    orders: await read<Order[]>('../../data/seed/orders.json'),
    tickets: await read<Ticket[]>('../../data/seed/tickets.json'),
    faqs: await read<PolicyFaq[]>('../../data/seed/policy-faq.json')
  }
}
