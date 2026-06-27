import { describe, it, expect } from "bun:test";
import { getWeatherTool } from "../src/agent/tools.js";
import { WeatherService, InvalidCityError } from "../src/services/weather.js";

describe("WeatherService", () => {
  it("should return fixed weather for supported cities", () => {
    const service = new WeatherService();
    const beijing = service.getWeather("北京");
    expect(beijing.city).toBe("北京");
    expect(beijing.temperature).toBe(25);
    expect(beijing.condition).toBe("晴");

    const shanghai = service.getWeather("上海");
    expect(shanghai.city).toBe("上海");
    expect(shanghai.temperature).toBe(22);
    expect(shanghai.condition).toBe("多云");
  });

  it("should support Chinese and English city names and aliases", () => {
    const service = new WeatherService();
    expect(service.getWeather("帝都").city).toBe("北京");
    expect(service.getWeather("beijing").city).toBe("北京");
    expect(service.getWeather("魔都").city).toBe("上海");
    expect(service.getWeather("shanghai").city).toBe("上海");
    expect(service.getWeather("冰城").city).toBe("哈尔滨");
  });

  it("should return deterministic results across instances", () => {
    const service1 = new WeatherService();
    const service2 = new WeatherService();
    expect(JSON.stringify(service1.getWeather("杭州"))).toBe(
      JSON.stringify(service2.getWeather("杭州"))
    );
  });

  it("should throw InvalidCityError for unsupported city", () => {
    const service = new WeatherService();
    expect(() => service.getWeather("火星")).toThrow(InvalidCityError);
  });

  it("should find city in query text", () => {
    const service = new WeatherService();
    expect(service.findCityInQuery("北京今天天气怎么样？")).toBe("北京");
    expect(service.findCityInQuery("帝都下雨了吗？")).toBe("北京");
    expect(service.findCityInQuery("shanghai 气温")).toBe("上海");
    expect(service.findCityInQuery("今天吃什么？")).toBeNull();
  });
});

describe("getWeatherTool", () => {
  it("should return weather JSON for valid city", async () => {
    const result = await getWeatherTool.execute({ city: "广州" });
    const parsed = JSON.parse(result);
    expect(parsed.city).toBe("广州");
    expect(typeof parsed.temperature).toBe("number");
  });

  it("should support city alias", async () => {
    const result = await getWeatherTool.execute({ city: "羊城" });
    const parsed = JSON.parse(result);
    expect(parsed.city).toBe("广州");
  });

  it("should reject empty city", async () => {
    await expect(getWeatherTool.execute({ city: "" })).rejects.toThrow("城市名不能为空");
  });

  it("should reject missing city parameter", async () => {
    await expect(getWeatherTool.execute({})).rejects.toThrow("Required");
  });

  it("should expose correct JSON Schema", () => {
    const parameters = getWeatherTool.parameters as {
      type: string;
      properties: Record<string, { type: string; minLength?: number; description?: string }>;
      required: string[];
    };

    expect(parameters).toMatchObject({
      type: "object",
      required: ["city"],
    });
    expect(parameters.properties.city).toMatchObject({
      type: "string",
      minLength: 1,
    });
  });
});
