/**
 * 敌机系统
 * 使用对象池 + 工厂模式管理不同类型敌机
 */
import { Sprite } from 'pixi.js'
import { ObjectPool } from '../pool.js'
import { CONFIG } from '../core/config.js'

export class EnemySystem {
  constructor(app, gameScene, textures) {
    this.app = app
    this.gameScene = gameScene
    this.textures = textures // 纹理映射 { meteor: Texture, fighter: Texture, ... }

    // 创建敌机池
    this.pool = new ObjectPool(
      () => this.createEnemy(),
      (enemy) => this.resetEnemy(enemy),
      30 // 最大敌机数
    )
  }

  /**
   * 创建一个敌机精灵
   * @returns {Sprite} 敌机精灵
   */
  createEnemy() {
    const enemy = new Sprite()
    enemy.anchor.set(0.5)
    this.gameScene.addChild(enemy)
    return enemy
  }

  /**
   * 重置敌机状态
   * @param {Sprite} enemy - 敌机精灵
   */
  resetEnemy(enemy) {
    enemy.x = 0
    enemy.y = 0
    enemy.alpha = 1
    enemy.tint = 0xffffff
    enemy.visible = true
    enemy.type = null
    enemy.hp = 1
    enemy.score = 0
    enemy.radius = 20
    enemy.speed = 2
  }

  /**
   * 生成敌机（工厂方法）
   * @param {string} type - 敌机类型（meteor/fighter/tank）
   * @param {number} x - 生成位置 x
   * @param {number} y - 生成位置 y
   * @param {number} speedMultiplier - 速度倍率
   * @returns {Sprite|null} 敌机精灵
   */
  spawn(type, x, y, speedMultiplier = 1) {
    const enemy = this.pool.get()
    if (!enemy) return null

    const config = CONFIG.enemies[type]
    if (!config) return null

    // 设置敌机属性
    enemy.type = type
    enemy.hp = config.hp
    enemy.score = config.score
    enemy.radius = config.radius
    enemy.speed = config.speed * speedMultiplier
    enemy.scale.set(config.scale)

    // 设置纹理
    const texture = this.textures[type]
    if (texture) {
      enemy.texture = texture
    }

    // 设置位置
    enemy.x = x
    enemy.y = y

    return enemy
  }

  /**
   * 更新所有敌机位置
   * @param {number} dt - 帧时间因子
   * @param {number} screenHeight - 屏幕高度
   */
  update(dt, screenHeight) {
    for (let i = this.pool.active.length - 1; i >= 0; i--) {
      const enemy = this.pool.active[i]
      enemy.y += enemy.speed * dt

      // 超出屏幕则回收
      if (enemy.y > screenHeight + 50) {
        this.pool.release(enemy)
      }
    }
  }

  /**
   * 获取活跃敌机列表
   * @returns {Array} 活跃敌机数组
   */
  getActiveEnemies() {
    return this.pool.active
  }

  /**
   * 回收敌机
   * @param {Sprite} enemy - 敌机精灵
   */
  release(enemy) {
    this.pool.release(enemy)
  }

  /**
   * 清空所有敌机（炸弹效果）
   */
  clearAll() {
    const enemies = [...this.pool.active]
    enemies.forEach((enemy) => {
      this.pool.release(enemy)
    })
  }

  /**
   * 重置系统
   */
  reset() {
    this.clearAll()
  }
}
