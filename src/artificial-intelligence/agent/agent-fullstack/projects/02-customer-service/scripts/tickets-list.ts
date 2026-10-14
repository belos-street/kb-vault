/**
 * 工单队列查看（bun run tickets:list）：坐席侧视角列出全部工单
 *
 * 对应 README §功能清单「工单落库：bun run tickets:list 查看待处理队列」。
 * 只读展示，不改数据；进程退出前收 pg 连接池（Spike A 纪律）。
 */
import { closePool, listTickets } from '@/services/db.ts'

const tickets = await listTickets()

if (tickets.length === 0) {
  console.log('（暂无工单——create_ticket 工具审批通过后会落库）')
} else {
  console.log(`共 ${tickets.length} 张工单：\n`)
  for (const t of tickets) {
    const id = `TK-${String(t.id).padStart(4, '0')}`
    console.log(`${id}  [${t.status}] ${t.type}  用户 ${t.user_id}`)
    console.log(`        ${t.summary}`)
    console.log(`        创建于 ${t.created_at.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`)
  }
}

await closePool()
