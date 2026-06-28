export interface WeatherData {
  city: string
  temperature: number // 温度，单位：摄氏度
  feelsLike: number // 体感温度，单位：摄氏度
  humidity: number // 湿度，单位：百分比
  windSpeed: number // 风速，单位：km/h
  condition: string // 天气条件，如晴朗、阴雨等
  updateTime: string // 更新时间，ISO 8601 格式
}
