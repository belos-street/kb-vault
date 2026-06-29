import { describe, it, expect } from 'bun:test'
import { retrieveFaq } from './faq'

describe('retrieveFaq', () => {
  describe('weather queries', () => {
    it('should skip FAQ when query contains a city name (Chinese)', () => {
      const result = retrieveFaq('北京今天天气怎么样？')
      expect(result).toBeNull()
    })

    it('should skip FAQ when query contains a city alias', () => {
      const result = retrieveFaq('帝都今天天气')
      expect(result).toBeNull()
    })

    it('should skip FAQ when query contains an English city name', () => {
      const result = retrieveFaq('beijing weather')
      expect(result).toBeNull()
    })

    it('should skip FAQ when query contains a single-character city alias', () => {
      // "津" is an alias for 天津
      const result = retrieveFaq('津今天有雨吗')
      expect(result).toBeNull()
    })
  })

  describe('FAQ matching', () => {
    it('should return typhoon safety FAQ for typhoon-related query', () => {
      const result = retrieveFaq('台风天出门需要注意什么？')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('typhoon-safety')
      expect(result!.question).toContain('台风')
    })

    it('should return UV protection FAQ for UV-related query', () => {
      const result = retrieveFaq('紫外线强怎么防护？')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('uv-protection')
    })

    it('should return rain driving FAQ for heavy rain driving query', () => {
      const result = retrieveFaq('暴雨天开车要注意什么？')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('rain-driving')
    })

    it('should return high-temp FAQ for heat stroke prevention query', () => {
      const result = retrieveFaq('高温天气如何防暑')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('high-temp')
    })

    it('should return air quality FAQ for haze-related query', () => {
      const result = retrieveFaq('雾霾天出门需要戴口罩吗')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('air-quality')
    })

    it('should return thunderstorm FAQ for thunderstorm query', () => {
      const result = retrieveFaq('雷雨天气可以打手机吗')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('thunderstorm')
    })
  })

  describe('edge cases', () => {
    it('should return null for empty query', () => {
      expect(retrieveFaq('')).toBeNull()
    })

    it('should return null for unrelated queries', () => {
      expect(retrieveFaq('今天心情不好')).toBeNull()
    })

    it('should return null for greeting', () => {
      expect(retrieveFaq('你好')).toBeNull()
    })

    it('should return null when match score is below threshold', () => {
      // Only weak overlap with any FAQ
      const result = retrieveFaq('开车')
      expect(result).toBeNull()
    })

    it('should return the best match for partial overlap', () => {
      const result = retrieveFaq('高温防暑')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('high-temp')
    })
  })
})
