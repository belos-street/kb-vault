/**
 * 背景滚动系统
 * 多层星星视差滚动效果
 */
import { Graphics } from 'pixi.js'
import { CONFIG } from '../core/config.js'

export class Background {
  constructor(gameScene, screenWidth, screenHeight) {
    this.gameScene = gameScene
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    this.layers = []

    this.init()
  }

  /**
   * 初始化星空背景
   */
  init() {
    const { background } = CONFIG

    // 为每一层创建星星
    background.layers.forEach((layerConfig, index) => {
      const stars = this.createStarLayer(layerConfig, index)
      this.layers.push({
        container: stars,
        speed: layerConfig.speed,
        stars: [],
      })
    })
  }

  /**
   * 创建一层星星
   * @param {Object} config - 层配置
   * @param {number} layerIndex - 层索引
   * @returns {Graphics} 星星容器
   */
  createStarLayer(config, layerIndex) {
    const container = new Graphics()

    // 生成随机星星位置
    for (let i = 0; i < config.count; i++) {
      const x = Math.random() * this.screenWidth
      const y = Math.random() * this.screenHeight
      const size = config.size * (0.5 + Math.random() * 0.5) // 随机大小变化

      container.circle(x, y, size)
      container.fill({ color: 0xffffff, alpha: config.alpha * (0.5 + Math.random() * 0.5) })

      // 记录星星位置用于滚动
      this.layers[layerIndex]?.stars?.push({ x, y })
    }

    this.gameScene.addChild(container)
    return container
  }

  /**
   * 更新背景滚动
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    this.layers.forEach((layer, layerIndex) => {
      const { container, speed, stars } = layer

      // 清除并重绘星星（实现滚动效果）
      container.clear()

      stars.forEach((star) => {
        // 向下移动
        star.y += speed * dt

        // 超出屏幕则重置到顶部
        if (star.y > this.screenHeight) {
          star.y = -5
          star.x = Math.random() * this.screenWidth
        }

        // 重绘星星
        const config = CONFIG.background.layers[layerIndex]
        container.circle(star.x, star.y, config.size * (0.5 + Math.random() * 0.5))
        container.fill({ color: 0xffffff, alpha: config.alpha * (0.5 + Math.random() * 0.5) })
      })
    })
  }

  /**
   * 重置背景
   */
  reset() {
    this.layers.forEach((layer, layerIndex) => {
      const config = CONFIG.background.layers[layerIndex]
      layer.stars.forEach((star) => {
        star.x = Math.random() * this.screenWidth
        star.y = Math.random() * this.screenHeight
      })
    })
  }

  /**
   * 销毁背景
   */
  destroy() {
    this.layers.forEach((layer) => {
      this.gameScene.removeChild(layer.container)
      layer.container.destroy()
    })
    this.layers = []
  }
}
