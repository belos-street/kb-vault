// 短期记忆 Checkpointer：SqliteSaver 持久化对话历史
// 数据库路径取环境变量 CHECKPOINTER_PATH，默认 ./data/checkpoints.db
//
// ⚠️ Bun 与 better-sqlite3 存在 ABI 不兼容（NODE_MODULE_VERSION 不符），
// SqliteSaver.fromConnString() 内部 new Database()（better-sqlite3）会直接报错。
// 方案：用 Bun 内置 bun:sqlite 包一层 better-sqlite3 兼容适配器，
// 再通过 new SqliteSaver(db) 构造（与 todo 1.5 提示的「传入 Database 实例」一致）。
// SqliteSaver 用到的完整 API 面：pragma / exec / prepare(get/all/run) / transaction
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Database, type SQLQueryBindings } from 'bun:sqlite'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'

// bun:sqlite → better-sqlite3 兼容适配层
interface SqliteLike {
  pragma(source: string, ...args: unknown[]): void
  exec(sql: string): void
  prepare(sql: string): {
    get(...params: unknown[]): unknown
    all(...params: unknown[]): unknown[]
    run(...params: unknown[]): unknown
  }
  transaction<Fn extends (...args: any[]) => any>(fn: Fn): {
    (...args: Parameters<Fn>): ReturnType<Fn>
  }
}

function adaptBunDatabase(db: Database): SqliteLike {
  return {
    // better-sqlite3 的 db.pragma(name)；bun:sqlite 无此方法，且 PRAGMA 有返回值，
    // 需用 query().get() 消费结果（SqliteSaver 只关心副作用，不读返回值）
    pragma(source: string, ..._args: unknown[]): void {
      db.query(`PRAGMA ${source}`).get()
    },
    // 建表用 run()（bun:sqlite 的 exec 已标记 deprecated）
    exec(sql: string): void {
      db.run(sql)
    },
    prepare(sql: string) {
      const stmt = db.prepare(sql)
      return {
        // better-sqlite3 无行时返回 undefined，bun:sqlite 返回 null
        get: (...params: unknown[]) =>
          stmt.get(...(params as SQLQueryBindings[])) ?? undefined,
        all: (...params: unknown[]) =>
          stmt.all(...(params as SQLQueryBindings[])),
        run: (...params: unknown[]) =>
          stmt.run(...(params as SQLQueryBindings[]))
      }
    },
    transaction<Fn extends (...args: any[]) => any>(fn: Fn): {
      (...args: Parameters<Fn>): ReturnType<Fn>
    } {
      const tx = db.transaction(fn)
      return (...args: Parameters<Fn>): ReturnType<Fn> => tx(...args)
    }
  }
}

/**
 * 创建 Checkpointer 实例。
 * @param dbPath 数据库路径；传 ':memory:' 得到进程内临时库（测试用，同实例内多次调用共享）。
 * 不传时取环境变量 CHECKPOINTER_PATH，默认 ./data/checkpoints.db。
 * SqliteSaver 的 setup() 会在首次读写时惰性建表，无需手动调用。
 */
export function createCheckpointer(
  dbPath = process.env.CHECKPOINTER_PATH ?? './data/checkpoints.db'
) {
  // ':memory:' 是 bun:sqlite 的特殊路径，不能被 resolve() 转成绝对路径
  const resolved = dbPath === ':memory:' ? dbPath : resolve(dbPath)
  if (resolved !== ':memory:') mkdirSync(dirname(resolved), { recursive: true })
  // adaptBunDatabase 收窄到 SqliteLike 契约；library 边界的 duck-type 差异仍需一次断言
  return new SqliteSaver(
    adaptBunDatabase(new Database(resolved)) as ConstructorParameters<
      typeof SqliteSaver
    >[0]
  )
}

/** 对话历史 Checkpointer：同 thread_id 自动恢复上下文 */
export const checkpointer = createCheckpointer()
