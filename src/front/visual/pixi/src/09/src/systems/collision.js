/**
 * 碰撞检测系统
 * 处理子弹 vs 敌机、敌机 vs 玩家、玩家 vs 道具的碰撞
 */
import { eventBus, EVENTS } from '../core/event-bus.js'

export class CollisionSystem {
  constructor(player, bulletSystem, enemySystem, powerUpSystem, explosionSystem) {
    this.player = player
    this.bulletSystem = bulletSystem
    this.enemySystem = enemySystem
    this.powerUpSystem = powerUpSystem
    this.explosionSystem = explosionSystem
  }

  /**
   * 圆形碰撞检测（平方比较，性能更好）
   * @param {Object} a - 对象 a（需有 x, y, radius）
   * @param {Object} b - 对象 b（需有 x, y, radius）
   * @returns {boolean} 是否碰撞
   */
  circleHit(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const r = (a.radius || 10) + (b.radius || 10)
    return dx * dx + dy * dy < r * r
  }

  /**
   * 更新碰撞检测（每帧调用）
   */
  update() {
    this.checkBulletVsEnemy()
    this.checkEnemyVsPlayer()
    this.checkPlayerVsPowerUp()
  }

  /**
   * 检测子弹 vs 敌机碰撞
   */
  checkBulletVsEnemy() {
    const bullets = this.bulletSystem.getActiveBullets()
    const enemies = this.enemySystem.getActiveEnemies()

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j]
        if (this.circleHit(bullet, enemy)) {
          this.onBulletHitEnemy(bullet, enemy)
          break // 一颗子弹只能打一个敌机
        }
      }
    }
  }

  /**
   * 处理子弹命中敌机
   * @param {Object} bullet - 子弹
   * @param {Object} enemy - 敌机
   */
  onBulletHitEnemy(bullet, enemy) {
    // 回收子弹
    this.bulletSystem.release(bullet)

    // 扣血
    enemy.hp -= 1

    if (enemy.hp <= 0) {
      // 敌机死亡
      this.explosionSystem.create(enemy.x, enemy.y)
      this.enemySystem.release(enemy)

      // 发布敌机死亡事件
      eventBus.emit(EVENTS.ENEMY_KILLED, {
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        score: enemy.score,
      })
    } else {
      // 受伤闪烁效果
      this.flashEnemy(enemy)
    }
  }

  /**
   * 敌机受伤闪烁
   * @param {Object} enemy - 敌机
   */
  flashEnemy(enemy) {
    enemy.tint = 0xff0000
    setTimeout(() => {
      if (enemy && !enemy.destroyed) {
        enemy.tint = 0xffffff
      }
    }, 100)
  }

  /**
   * 检测敌机 vs 玩家碰撞
   */
  checkEnemyVsPlayer() {
    if (this.player.isInvincible) return // 无敌状态不检测

    const enemies = this.enemySystem.getActiveEnemies()

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      if (this.circleHit(this.player, enemy)) {
        this.onEnemyHitPlayer(enemy)
        break
      }
    }
  }

  /**
   * 处理敌机撞到玩家
   * @param {Object} enemy - 敌机
   */
  onEnemyHitPlayer(enemy) {
    // 爆炸特效
    this.explosionSystem.create(enemy.x, enemy.y)

    // 回收敌机
    this.enemySystem.release(enemy)

    // 发布玩家被击中事件
    eventBus.emit(EVENTS.PLAYER_HIT)
  }

  /**
   * 检测玩家 vs 道具碰撞
   */
  checkPlayerVsPowerUp() {
    if (!this.powerUpSystem) return

    const powerUps = this.powerUpSystem.getActivePowerUps()

    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i]
      if (this.circleHit(this.player, powerUp)) {
        this.onPlayerCollectPowerUp(powerUp)
      }
    }
  }

  /**
   * 处理玩家拾取道具
   * @param {Object} powerUp - 道具
   */
  onPlayerCollectPowerUp(powerUp) {
    // 发布道具拾取事件
    eventBus.emit(EVENTS.POWERUP_COLLECTED, {
      type: powerUp.type,
      x: powerUp.x,
      y: powerUp.y,
    })

    // 回收道具
    this.powerUpSystem.release(powerUp)
  }

  /**
   * 重置系统
   */
  reset() {
    // 无需重置，因为依赖的系统会自己重置
  }
}
