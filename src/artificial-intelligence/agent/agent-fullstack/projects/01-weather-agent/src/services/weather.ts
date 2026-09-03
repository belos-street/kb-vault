import { CITY_ALIASES, SUPPORTED_CITIES, CONDITIONS } from './const'
import type { WeatherData } from './type'

/**
 * 基于 Mulberry32 的确定性伪随机数（相同 seed 返回相同结果）
 */
const seededRandomBetween = (
  seed: number,
  min: number,
  max: number
): number => {
  let t = (seed + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const frac = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return Math.floor(frac * (max - min + 1)) + min
}

// 无效城市名错误
export class InvalidCityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCityError'
  }
}

/**
 * 从查询文本中提取第一个支持的城市名
 * - 优先匹配更长的别名，避免短别名被优先命中
 * - 模块级导出：faq.ts 等模块复用同一份城市检测逻辑
 */
export const findCityInQuery = (query: string): string | null => {
  const lower = query.toLowerCase()
  const entries = Object.entries(CITY_ALIASES).sort(
    ([a], [b]) => b.length - a.length
  )
  for (const [alias, canonical] of entries) {
    if (lower.includes(alias)) {
      return canonical
    }
  }
  return null
}

/**
 * 天气服务
 */
export function WeatherService() {
  const mockDatabase: Map<string, WeatherData> = new Map() // 模拟数据库，存储城市名到天气数据的映射

  /**
   * 规范化城市名
   */
  const normalizeCity = (city: string): string | null => {
    const trimmed = city.trim().toLowerCase()
    const canonical = CITY_ALIASES[trimmed]
    return canonical ?? null
  }

  /**
   * 基于城市名生成确定性种子
   */
  const hashCity = (city: string): number => {
    let hash = 0
    for (let i = 0; i < city.length; i++) {
      hash = (hash << 5) - hash + city.charCodeAt(i)
      hash |= 0
    }
    return hash >>> 0
  }

  /**
   * 根据城市名获取天气
   * @param city 城市名（支持中文/英文/别名）
   */
  const getWeather = (city: string): WeatherData => {
    const normalized = normalizeCity(city)
    if (!normalized) {
      throw new InvalidCityError(
        `暂不支持查询城市「${city}」，支持的城市：${SUPPORTED_CITIES.join('、')}`
      )
    }

    // seedMockData 保证所有 SUPPORTED_CITIES 都有数据
    return mockDatabase.get(normalized)!
  }

  /**
   * 批量获取天气
   * @param cities 城市名列表（支持中文/英文/别名）
   */
  const getWeatherBatch = (cities: string[]): WeatherData[] => {
    return cities.map((city) => getWeather(city))
  }

  /**
   * 生成固定 Mock 天气数据
   * - 使用城市名哈希作为种子，保证每次启动结果一致
   * - 北京/上海与 system.ts 中的 Few-shot 示例保持一致
   */
  const seedMockData = (): void => {
    const fewShotOverrides: Record<string, Partial<WeatherData>> = {
      北京: {
        temperature: 25,
        feelsLike: 27,
        humidity: 45,
        windSpeed: 3,
        condition: '晴'
      },
      上海: {
        temperature: 22,
        feelsLike: 24,
        humidity: 60,
        windSpeed: 5,
        condition: '多云'
      }
    }

    for (const city of SUPPORTED_CITIES) {
      const seed = hashCity(city)
      const temperature = seededRandomBetween(seed, -5, 35)
      const conditionIndex = seededRandomBetween(
        seed + 4,
        0,
        CONDITIONS.length - 1
      )
      const base: WeatherData = {
        city,
        temperature,
        feelsLike: temperature + seededRandomBetween(seed + 1, -3, 3),
        humidity: seededRandomBetween(seed + 2, 30, 90),
        windSpeed: seededRandomBetween(seed + 3, 0, 20),
        condition: CONDITIONS[conditionIndex] ?? '晴',
        updateTime: '2024-01-15T10:30:00Z'
      }
      mockDatabase.set(city, {
        ...base,
        ...(fewShotOverrides[city] ?? {})
      })
    }
  }

  /**
   * 判断城市是否支持查询
   */
  const isValidCity = (city: string): boolean => {
    return normalizeCity(city) !== null
  }

  seedMockData()

  return {
    getWeather,
    getWeatherBatch,
    isValidCity,
    findCityInQuery
  }
}
