/**
 * 只读 SQL 前缀检查（真正的安全边界是 readonly + query_only，这里只测可读错误）
 */
import { describe, expect, it } from 'bun:test'
import { isReadOnlySql } from '@/services/db.ts'

describe('isReadOnlySql', () => {
  it('接受单条 SELECT / WITH', () => {
    expect(isReadOnlySql('SELECT 1')).toBe(true)
    expect(isReadOnlySql('SELECT 1;')).toBe(true)
    expect(isReadOnlySql('WITH x AS (SELECT 1) SELECT * FROM x')).toBe(true)
  })

  it('拒绝多语句与非查询语句', () => {
    expect(isReadOnlySql('SELECT 1; SELECT 2')).toBe(false)
    expect(isReadOnlySql('DELETE FROM orders')).toBe(false)
  })

  it('保守拒绝字符串内的分号', () => {
    expect(isReadOnlySql("SELECT ';' AS s")).toBe(false)
  })

  it('已知边界：WITH...DELETE 能绕过前缀检查（readonly 才是防线）', () => {
    expect(isReadOnlySql('WITH x AS (SELECT 1) DELETE FROM orders')).toBe(true)
  })
})
