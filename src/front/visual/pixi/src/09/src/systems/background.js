/**
 * 背景滚动系统
 * 多层星星视差滚动效果
 * 使用 Sprite 替代 Graphics 每帧重绘，提升性能
 */
import { Graphics, Sprite, Container } from 'pixi.js'
import { CONFIG } from '../core/config.js'

export class Background {
  constructor(app, gameScene, screenWidth, screenHeight) {
    this.app = app
    this.gameScene = gameScene
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    this.layers = []
    this.starTextures = []

    this.init()
  }

  /**
   * 初始化星空背景
   */
  init() {
    const { background } = CONFIG

    // 预生成不同大小的星星纹理（只生成一次）
    this.starTextures = background.layers.map((layerConfig) => {
      const gfx = new Graphics()
      gfx.circle(0, 0, layerConfig.size)
      gfx.fill({ color: 0xffffff, alpha: 1 })
      const texture = this.app.renderer.generateTexture(gfx)
      gfx.destroy()
      return texture
    })

    // 为每一层创建星星
    background.layers.forEach((layerConfig, index) => {
      const container = new Container()
      const stars = []

      for (let i = 0; i < layerConfig.count; i++) {
        const sprite = new Sprite(this.starTextures[index])
        sprite.anchor.set(0.5)
        sprite.x = Math.random() * this.screenWidth
        sprite.y = Math.random() * this.screenHeight
        sprite.alpha = layerConfig.alpha * (0.5 + Math.random() * 0.5)
        container.addChild(sprite)
        stars.push(sprite)
      }

      this.gameScene.addChild(container)
      this.layers.push({ container, speed: layerConfig.speed, stars })
    })
  }

  /**
   * 更新背景滚动
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    this.layers.forEach((layer) => {
      const { speed, stars } = layer

      stars.forEach((star) => {
        star.y += speed * dt

        // 超出屏幕则重置到顶部
        if (star.y > this.screenHeight) {
          star.y = -5
          star.x = Math.random() * this.screenWidth
        }
      })
    })
  }

  /**
   * 重置背景
   */
  reset() {
    this.layers.forEach((layer) => {
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
      layer.container.destroy({ children: true })
    })
    this.starTextures.forEach((texture) => texture.destroy())
    this.layers = []
    this.starTextures = []
  }
}
