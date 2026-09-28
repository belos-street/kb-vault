import { redis } from './redis'

/**
 * cache-aside 辅助（FR-7）：JSON 序列化 + TTL。
 * 失效用已知键直接 DEL，无需 SCAN（排查才用 SCAN，严禁 KEYS——会阻塞生产实例）
 */
export const cacheGetJSON = async <T>(key: string): Promise<T | null> => {
  const raw = await redis.get(key)
  return raw ? (JSON.parse(raw) as T) : null
}

export const cacheSetJSON = (key: string, value: unknown, ttlSec: number) =>
  redis.set(key, JSON.stringify(value), 'EX', ttlSec)

export const cacheDel = (...keys: string[]) => redis.del(...keys)
