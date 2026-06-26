import { describe, expect, test } from 'bun:test'
import { WeatherService, InvalidCityError } from '../src/services/weather.js'

describe('WeatherService', () => {
  const service = new WeatherService()

  describe('getWeather', () => {
    test('should return weather data for valid city', () => {
      const weather = service.getWeather('北京')
      expect(weather).toBeDefined()
      expect(weather.city).toBe('北京')
      expect(weather.temperature).toBe(25) // few-shot override
      expect(weather.condition).toBe('晴')
    })

    test('should support city aliases', () => {
      const weather = service.getWeather('beijing')
      expect(weather.city).toBe('北京')
    })

    test('should support nicknames', () => {
      const weather = service.getWeather('魔都')
      expect(weather.city).toBe('上海')
    })

    test('should throw InvalidCityError for unsupported city', () => {
      expect(() => service.getWeather('火星')).toThrow(InvalidCityError)
    })

    test('should throw InvalidCityError for empty string', () => {
      expect(() => service.getWeather('')).toThrow(InvalidCityError)
    })
  })

  describe('getWeatherBatch', () => {
    test('should return weather for multiple cities', () => {
      const results = service.getWeatherBatch(['北京', '上海', '广州'])
      expect(results).toHaveLength(3)
      expect(results[0].city).toBe('北京')
      expect(results[1].city).toBe('上海')
      expect(results[2].city).toBe('广州')
    })

    test('should throw if any city is invalid', () => {
      expect(() => service.getWeatherBatch(['北京', '火星'])).toThrow(
        InvalidCityError
      )
    })
  })

  describe('isValidCity', () => {
    test('should return true for valid cities', () => {
      expect(service.isValidCity('北京')).toBe(true)
      expect(service.isValidCity('beijing')).toBe(true)
      expect(service.isValidCity('帝都')).toBe(true)
    })

    test('should return false for invalid cities', () => {
      expect(service.isValidCity('火星')).toBe(false)
      expect(service.isValidCity('')).toBe(false)
    })
  })

  describe('mock data consistency', () => {
    test('should return consistent data on multiple calls', () => {
      const first = service.getWeather('北京')
      const second = service.getWeather('北京')
      expect(first).toEqual(second)
    })

    test('few-shot overrides should match system.ts examples', () => {
      const beijing = service.getWeather('北京')
      expect(beijing.temperature).toBe(25)
      expect(beijing.feelsLike).toBe(27)
      expect(beijing.humidity).toBe(45)
      expect(beijing.windSpeed).toBe(3)
      expect(beijing.condition).toBe('晴')

      const shanghai = service.getWeather('上海')
      expect(shanghai.temperature).toBe(22)
      expect(shanghai.feelsLike).toBe(24)
      expect(shanghai.humidity).toBe(60)
      expect(shanghai.windSpeed).toBe(5)
      expect(shanghai.condition).toBe('多云')
    })
  })
})
