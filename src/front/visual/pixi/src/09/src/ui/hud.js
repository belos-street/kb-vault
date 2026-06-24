/**
 * HUD 系统
 * 显示游戏内 UI：分数、生命、子弹等级、护盾状态
 */
import { Text, Graphics } from 'pixi.js'
import { CONFIG } from '../core/config.js'
import { eventBus, EVENTS } from '../core/event-bus.js'

export class HUD {
  constructor(gameScene) {
    this.gameScene = gameScene

    // 分数
    this.score = 0
    this.scoreText = new Text({
      text: '得分: 0',
      style: {
        fill: '#ffffff',
        fontSize: 20,
        fontFamily: 'Arial',
      },
    })
    this.scoreText.position.set(10, 10)
    gameScene.addChild(this.scoreText)

    // 生命值
    this.lives = CONFIG.player.initialLives
    this.livesText = new Text({
      text: `生命: ${this.lives}`,
      style: {
        fill: '#ff6b6b',
        fontSize: 20,
        fontFamily: 'Arial',
      },
    })
    this.livesText.position.set(10, 40)
    gameScene.addChild(this.livesText)

    // 子弹等级
    this.bulletLevel = 1
    this.bulletLevelText = new Text({
      text: '子弹: Lv.1',
      style: {
        fill: '#ffd93d',
        fontSize: 16,
        fontFamily: 'Arial',
      },
    })
    this.bulletLevelText.position.set(10, 70)
    gameScene.addChild(this.bulletLevelText)

    // 护盾状态
    this.shieldActive = false
    this.shieldText = new Text({
      text: '',
      style: {
        fill: '#4ecdc4',
        fontSize: 16,
        fontFamily: 'Arial',
      },
    })
    this.shieldText.position.set(10, 95)
    gameScene.addChild(this.shieldText)

    // 监听事件
    this.setupEventListeners()
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    eventBus.on(EVENTS.SCORE_UPDATE, (data) => this.updateScore(data.score))
    eventBus.on(EVENTS.LIVES_UPDATE, (data) => this.updateLives(data.lives))
    eventBus.on(EVENTS.BULLET_UPGRADE, () => this.updateBulletLevel())
    eventBus.on(EVENTS.POWERUP_COLLECTED, (data) => {
      if (data.type === 'shield') {
        this.showShieldActive()
      }
    })
    eventBus.on(EVENTS.PLAYER_HIT, () => {
      this.shieldActive = false
      this.shieldText.text = ''
    })
  }

  /**
   * 更新分数显示
   * @param {number} score - 新分数
   */
  updateScore(score) {
    this.score = score
    this.scoreText.text = `得分: ${score}`
  }

  /**
   * 更新生命显示
   * @param {number} lives - 新生命数
   */
  updateLives(lives) {
    this.lives = lives
    this.livesText.text = `生命: ${lives}`
  }

  /**
   * 更新子弹等级显示
   */
  updateBulletLevel() {
    if (this.bulletLevel < 3) {
      this.bulletLevel++
      this.bulletLevelText.text = `子弹: Lv.${this.bulletLevel}`
    }
  }

  /**
   * 显示护盾激活
   */
  showShieldActive() {
    this.shieldActive = true
    this.shieldText.text = '护盾: 激活'
  }

  /**
   * 更新护盾计时器显示
   * @param {number} remaining - 剩余时间（秒）
   */
  updateShieldTimer(remaining) {
    if (this.shieldActive) {
      this.shieldText.text = `护盾: ${remaining.toFixed(1)}s`
    }
  }

  /**
   * 重置 HUD
   */
  reset() {
    this.score = 0
    this.lives = CONFIG.player.initialLives
    this.bulletLevel = 1
    this.shieldActive = false

    this.scoreText.text = '得分: 0'
    this.livesText.text = `生命: ${this.lives}`
    this.bulletLevelText.text = '子弹: Lv.1'
    this.shieldText.text = ''
  }
}
