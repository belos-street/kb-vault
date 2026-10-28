/**
 * 业务库只读访问层（供 MCP Server 调用）
 *
 * 两条防线：连接级 readonly + PRAGMA query_only；
 * 语句前缀检查只是「尽快给出可读错误」，不是安全边界（WITH ... DELETE 可绕过）。
 */
import { Database } from 'bun:sqlite'
import { config } from '@/config.ts'

let handle: Database | null = null

export function getReadonlyDb(): Database {
  if (handle) return handle
  handle = new Database(config.ANALYTICS_DB_PATH, { readonly: true })
  handle.exec('PRAGMA query_only = ON')
  return handle
}

export interface SalesQueryResult {
  rows: Record<string, unknown>[]
  rowCount: number
  truncated: boolean
}

export function querySales(sql: string): SalesQueryResult {
  const rows = getReadonlyDb().prepare(sql).all() as Record<string, unknown>[]
  const maxRows = config.SQL_MAX_ROWS
  return {
    rows: rows.slice(0, maxRows),
    rowCount: rows.length,
    truncated: rows.length > maxRows
  }
}

/** 单条 SELECT / WITH；分号只允许出现在末尾（多语句直接拒绝） */
export function isReadOnlySql(sql: string): boolean {
  const trimmed = sql.trim().replace(/;+$/, '')
  return /^(select|with)\b/i.test(trimmed) && !trimmed.includes(';')
}
