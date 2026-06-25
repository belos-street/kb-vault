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
  // 天津
  天津: "天津",
  tianjin: "天津",
  津: "天津",
  // 重庆
  重庆: "重庆",
  chongqing: "重庆",
  渝: "重庆",
  // 苏州
  苏州: "苏州",
  suzhou: "苏州",
  姑苏: "苏州",
  // 青岛
  青岛: "青岛",
  qingdao: "青岛",
  岛城: "青岛",
  // 厦门
  厦门: "厦门",
  xiamen: "厦门",
  鹭岛: "厦门",
  // 宁波
  宁波: "宁波",
  ningbo: "宁波",
  // 无锡
  无锡: "无锡",
  wuxi: "无锡",
  // 长沙
  长沙: "长沙",
  changsha: "长沙",
  星城: "长沙",
  // 郑州
  郑州: "郑州",
  zhengzhou: "郑州",
  绿城: "郑州",
  // 沈阳
  沈阳: "沈阳",
  shenyang: "沈阳",
  盛京: "沈阳",
  // 大连
  大连: "大连",
  dalian: "大连",
  滨城: "大连",
  // 济南
  济南: "济南",
  jinan: "济南",
  泉城: "济南",
  // 哈尔滨
  哈尔滨: "哈尔滨",
  harbin: "哈尔滨",
  冰城: "哈尔滨",
  // 长春
  长春: "长春",
  changchun: "长春",
  // 石家庄
  石家庄: "石家庄",
  shijiazhuang: "石家庄",
  // 合肥
  合肥: "合肥",
  hefei: "合肥",
  庐州: "合肥",
  // 南昌
  南昌: "南昌",
  nanchang: "南昌",
  洪城: "南昌",
  // 昆明
  昆明: "昆明",
  kunming: "昆明",
  春城: "昆明",
  // 贵阳
  贵阳: "贵阳",
  guiyang: "贵阳",
  林城: "贵阳",
  // 南宁
  南宁: "南宁",
  nanning: "南宁",
  邕城: "南宁",
  // 福州
  福州: "福州",
  fuzhou: "福州",
  榕城: "福州",
  // 海口
  海口: "海口",
  haikou: "海口",
  // 太原
  太原: "太原",
  taiyuan: "太原",
  龙城: "太原",
};

const SUPPORTED_CITIES = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "西安", "武汉", "南京",
  "天津", "重庆", "苏州", "青岛", "厦门", "宁波", "无锡", "长沙", "郑州",
  "沈阳", "大连", "济南", "哈尔滨", "长春", "石家庄", "合肥", "南昌",
  "昆明", "贵阳", "南宁", "福州", "海口", "太原",
];

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
