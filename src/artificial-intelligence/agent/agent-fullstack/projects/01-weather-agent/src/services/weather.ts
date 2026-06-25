import type { WeatherData } from "../agent/types.js";

// 天气状况枚举
const CONDITIONS = [
  "晴",
  "多云",
  "阴",
  "小雨",
  "中雨",
  "大雨",
  "雷阵雨",
  "小雪",
  "中雪",
  "雾",
  "霾",
];

// 城市别名映射表（支持中文名、英文名、常见别名）
const CITY_ALIASES: Record<string, string> = {
  // 北京
  北京: "北京",
  beijing: "北京",
  peking: "北京",
  帝都: "北京",
  京城: "北京",
  // 上海
  上海: "上海",
  shanghai: "上海",
  魔都: "上海",
  // 广州
  广州: "广州",
  guangzhou: "广州",
  羊城: "广州",
  花城: "广州",
  // 深圳
  深圳: "深圳",
  shenzhen: "深圳",
  鹏城: "深圳",
  // 杭州
  杭州: "杭州",
  hangzhou: "杭州",
  // 成都
  成都: "成都",
  chengdu: "成都",
  蓉城: "成都",
  // 西安
  西安: "西安",
  xian: "西安",
  长安: "西安",
  // 武汉
  武汉: "武汉",
  wuhan: "武汉",
  江城: "武汉",
  // 南京
  南京: "南京",
  nanjing: "南京",
  金陵: "南京",
};

const SUPPORTED_CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "西安", "武汉", "南京"];

export class WeatherService {
  private mockDatabase: Map<string, WeatherData> = new Map();

  constructor() {
    this.seedMockData();
  }

  /**
   * 根据城市名获取天气
   * @param city 城市名（支持中文/英文/别名）
   */
  getWeather(city: string): WeatherData {
    const normalized = this.normalizeCity(city);
    if (!normalized) {
      throw new InvalidCityError(`暂不支持查询城市「${city}」，支持的城市：${SUPPORTED_CITIES.join("、")}`);
    }

    const data = this.mockDatabase.get(normalized);
    if (!data) {
      throw new InvalidCityError(`未找到城市「${normalized}」的天气数据`);
    }

    return data;
  }

  /**
   * 批量获取多个城市的天气
   */
  getWeatherBatch(cities: string[]): WeatherData[] {
    return cities.map((city) => this.getWeather(city));
  }

  /**
   * 判断城市是否支持查询
   */
  isValidCity(city: string): boolean {
    return this.normalizeCity(city) !== null;
  }

  /**
   * 规范化城市名
   */
  private normalizeCity(city: string): string | null {
    const trimmed = city.trim().toLowerCase();
    const canonical = CITY_ALIASES[trimmed];
    return canonical ?? null;
  }

  /**
   * 生成模拟天气数据
   */
  private seedMockData(): void {
    for (const city of SUPPORTED_CITIES) {
      const temperature = this.randomBetween(-5, 35);
      this.mockDatabase.set(city, {
        city,
        temperature,
        feelsLike: temperature + this.randomBetween(-3, 3),
        humidity: this.randomBetween(30, 90),
        windSpeed: this.randomBetween(0, 20),
        condition: CONDITIONS[this.randomBetween(0, CONDITIONS.length - 1)],
        updateTime: new Date().toISOString(),
      });
    }
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export class InvalidCityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCityError";
  }
}
