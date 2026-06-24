/**
 * 玩家飞船类
 * 封装移动、边界限制、无敌状态
 */
import { Sprite } from 'pixi.js'
import { CONFIG } from '../core/config.js'

export class Player {
  constructor(texture, screenWidth, screenHeight) {
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.sprite.scale.set(0.5)
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight

    // 初始位置：底部居中
    this.sprite.position.set(screenWidth / 2, screenHeight - 80)

    // 碰撞半径
    this.radius = 20

    // 游戏属性
    this.lives = CONFIG.player.initialLives
    this.speed = CONFIG.player.speed

    // 无敌状态
    this.invincibleTimer = 0
    this.isInvincible = false

    // 键盘状态
    this.keys = {}
    this.setupInput()
  }

  /**
   * 设置键盘输入
   */
  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
  }

  /**
   * 更新玩家位置（每帧调用）
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    const { sprite, speed, screenWidth, screenHeight } = this

    // 移动
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      sprite.x -= speed * dt
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      sprite.x += speed * dt
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      sprite.y -= speed * dt
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      sprite.y += speed * dt
    }

    // 边界限制
    const halfW = sprite.width / 2
    const halfH = sprite.height / 2
    sprite.x = Math.max(halfW, Math.min(screenWidth - halfW, sprite.x))
    sprite.y = Math.max(halfH, Math.min(screenHeight - halfH, sprite.y))

    // 更新无敌状态
    if (this.isInvincible) {
      this.invincibleTimer -= dt
      // 闪烁效果
      this.sprite.alpha = Math.sin(this.invincibleTimer * 0.2) * 0.5 + 0.5
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false
        this.sprite.alpha = 1
      }
    }
  }

  /**
   * 设置无敌状态
   * @param {number} duration - 无敌持续时间（帧）
   */
  setInvincible(duration) {
    this.isInvincible = true
    this.invincibleTimer = duration
  }

  /**
   * 受到伤害
   * @returns {boolean} 是否死亡
   */
  takeDamage() {
    if (this.isInvincible) return false

    this.lives--
    return this.lives <= 0
  }

  /**
   * 重置到初始状态
   */
  reset() {
    this.sprite.position.set(this.screenWidth / 2, this.screenHeight - 80)
    this.lives = CONFIG.player.initialLives
    this.isInvincible = false
    this.invincibleTimer = 0
    this.sprite.alpha = 1
  }

  /**
   * 获取位置（用于子弹发射）
   */
  get x() {
    return this.sprite.x
  }

  get y() {
    return this.sprite.y
  }
}
