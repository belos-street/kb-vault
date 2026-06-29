import { describe, it, expect } from 'bun:test'
import { InvalidCityError, WeatherService } from './weather'

describe('WeatherService', () => {
  const service = WeatherService()

  describe('getWeather', () => {
    it('should return weather data for a supported city', () => {
      const result = service.getWeather('北京')

      expect(result.city).toBe('北京')
      expect(result.temperature).toBeDefined()
      expect(result.humidity).toBeDefined()
      expect(result.condition).toBeDefined()
      expect(result.updateTime).toBeDefined()
    })

    it('should support city aliases', () => {
      const result = service.getWeather('帝都')

      expect(result.city).toBe('北京')
    })

    it('should throw InvalidCityError for unsupported city', () => {
      expect(() => service.getWeather('不存在的城市')).toThrow(InvalidCityError)
    })

    it('should keep few-shot overrides for Beijing and Shanghai', () => {
      const beijing = service.getWeather('北京')
      const shanghai = service.getWeather('上海')

      expect(beijing.temperature).toBe(25)
      expect(beijing.condition).toBe('晴')
      expect(shanghai.temperature).toBe(22)
      expect(shanghai.condition).toBe('多云')
    })
  })

  describe('getWeatherBatch', () => {
    it('should return weather data for multiple cities', () => {
      const results = service.getWeatherBatch(['北京', '上海'])

      expect(results.map((r) => r.city)).toEqual(['北京', '上海'])
    })

    it('should throw InvalidCityError when any city is invalid', () => {
      expect(() => service.getWeatherBatch(['北京', '火星'])).toThrow(
        InvalidCityError
      )
    })
  })

  describe('isValidCity', () => {
    it('should return true for supported city', () => {
      expect(service.isValidCity('北京')).toBe(true)
    })

    it('should return true for supported alias', () => {
      expect(service.isValidCity('魔都')).toBe(true)
    })

    it('should return false for unsupported city', () => {
      expect(service.isValidCity('火星')).toBe(false)
    })
  })

  describe('findCityInQuery', () => {
    it('should extract city from a natural language query', () => {
      const result = service.findCityInQuery('今天北京天气怎么样？')

      expect(result).toBe('北京')
    })

    it('should return null when no supported city is found', () => {
      const result = service.findCityInQuery('今天天气怎么样？')

      expect(result).toBeNull()
    })
  })
})
