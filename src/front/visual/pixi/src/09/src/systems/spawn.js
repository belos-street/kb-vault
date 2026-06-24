/**
 * 生成系统
 * 负责敌机和道具的生成逻辑
 */
import { CONFIG } from '../core/config.js'
import { eventBus, EVENTS } from '../core/event-bus.js'

export class SpawnSystem {
  constructor(enemySystem, powerUpSystem, gameManager) {
    this.enemySystem = enemySystem
    this.powerUpSystem = powerUpSystem
    this.gameManager = gameManager

    this.spawnTimer = 0
    this.difficultyTimer = 0

    // 监听敌机死亡事件，可能掉落道具
    eventBus.on(EVENTS.ENEMY_KILLED, (data) => this.onEnemyKilled(data))
  }

  /**
   * 更新生成逻辑（每帧调用）
   * @param {number} dt - 帧时间因子
   * @param {number} screenWidth - 屏幕宽度
   */
  update(dt, screenWidth) {
    if (!this.gameManager.isPlaying) return

    const elapsed = this.gameManager.elapsed

    // 计算当前生成间隔（难度递增）
    const spawnInterval = this.getSpawnInterval(elapsed)

    // 更新生成计时器
    this.spawnTimer -= dt

    // 生成敌机
    if (this.spawnTimer <= 0) {
      this.spawnEnemy(elapsed, screenWidth)
      this.spawnTimer = spawnInterval
    }
  }

  /**
   * 计算当前生成间隔
   * @param {number} elapsed - 游戏已运行时间（秒）
   * @returns {number} 生成间隔（帧）
   */
  getSpawnInterval(elapsed) {
    const { difficulty } = CONFIG
    const decay = Math.floor(elapsed / 30) * difficulty.spawnIntervalDecay
    return Math.max(difficulty.spawnIntervalMin, difficulty.spawnIntervalStart - decay)
  }

  /**
   * 计算当前速度倍率
   * @param {number} elapsed - 游戏已运行时间（秒）
   * @returns {number} 速度倍率
   */
  getSpeedMultiplier(elapsed) {
    const { difficulty } = CONFIG
    return Math.pow(difficulty.speedMultiplier, Math.floor(elapsed / 30))
  }

  /**
   * 生成敌机
   * @param {number} elapsed - 游戏已运行时间（秒）
   * @param {number} screenWidth - 屏幕宽度
   */
  spawnEnemy(elapsed, screenWidth) {
    // 确定可用的敌机类型
    const availableTypes = this.getAvailableEnemyTypes(elapsed)

    // 随机选择一种敌机
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]

    // 随机 x 位置
    const margin = 50
    const x = margin + Math.random() * (screenWidth - margin * 2)
    const y = -40

    // 速度倍率
    const speedMultiplier = this.getSpeedMultiplier(elapsed)

    // 生成敌机
    this.enemySystem.spawn(type, x, y, speedMultiplier)
  }

  /**
   * 获取当前可用的敌机类型
   * @param {number} elapsed - 游戏已运行时间（秒）
   * @returns {Array<string>} 可用敌机类型列表
   */
  getAvailableEnemyTypes(elapsed) {
    const { difficulty } = CONFIG
    const types = ['meteor'] // 默认只有陨石

    // 30 秒后解锁战斗机
    if (elapsed >= difficulty.fighterUnlockTime) {
      types.push('fighter')
    }

    // 60 秒后解锁坦克
    if (elapsed >= difficulty.tankUnlockTime) {
      types.push('tank')
    }

    return types
  }

  /**
   * 处理敌机死亡事件
   * @param {Object} data - 敌机数据 { type, x, y, score }
   */
  onEnemyKilled(data) {
    // 随机掉落道具
    if (Math.random() < CONFIG.powerUps.dropChance) {
      const powerUpType = this.getRandomPowerUpType()
      this.powerUpSystem.spawn(powerUpType, data.x, data.y)
    }
  }

  /**
   * 随机选择道具类型
   * @returns {string} 道具类型
   */
  getRandomPowerUpType() {
    const types = Object.keys(CONFIG.powerUps.types)
    return types[Math.floor(Math.random() * types.length)]
  }

  /**
   * 重置系统
   */
  reset() {
    this.spawnTimer = 0
    this.difficultyTimer = 0
  }
}
