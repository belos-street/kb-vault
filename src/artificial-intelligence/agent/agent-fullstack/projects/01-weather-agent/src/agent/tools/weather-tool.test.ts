import { describe, it, expect } from 'bun:test'
import { getWeatherTool } from './weather-tool'

describe('getWeatherTool', () => {
  it('should return JSON string for a valid city', async () => {
    const result = await getWeatherTool.execute({ city: '北京' })

    expect(typeof result).toBe('string')
    const parsed = JSON.parse(result)
    expect(parsed.city).toBe('北京')
    expect(parsed.temperature).toBeDefined()
    expect(parsed.condition).toBeDefined()
  })

  it('should support city aliases', async () => {
    const result = await getWeatherTool.execute({ city: '帝都' })
    const parsed = JSON.parse(result)

    expect(parsed.city).toBe('北京')
  })

  it('should throw error when city is empty', async () => {
    expect(() => getWeatherTool.execute({ city: '' })).toThrow('参数校验失败')
  })

  it('should throw error when city is missing', async () => {
    expect(() => getWeatherTool.execute({})).toThrow('参数校验失败')
  })

  it('should expose a valid JSON schema for the parameters', () => {
    const schema = getWeatherTool.parameters

    expect(schema.type).toBe('object')
    expect(schema.properties).toHaveProperty('city')
    expect(schema.required).toContain('city')
  })
})
