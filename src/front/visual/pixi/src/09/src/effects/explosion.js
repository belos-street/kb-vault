/**
 * 爆炸特效系统
 * 使用对象池管理爆炸粒子
 */
import { Graphics } from 'pixi.js'
import { ObjectPool } from '../pool.js'
import { CONFIG } from '../core/config.js'

export class ExplosionSystem {
  constructor(app, gameScene) {
    this.app = app
    this.gameScene = gameScene

    // 创建粒子池
    this.particlePool = new ObjectPool(
      () => this.createParticle(),
      (p) => this.resetParticle(p),
      CONFIG.explosion.maxPoolSize
    )
  }

  /**
   * 创建一个爆炸粒子
   * @returns {Graphics} 粒子图形
   */
  createParticle() {
    const p = new Graphics()
    p.circle(0, 0, 2 + Math.random() * 3)
    p.fill({ color: 0xffffff, alpha: 1 })
    this.gameScene.addChild(p)
    return p
  }

  /**
   * 重置粒子状态
   * @param {Graphics} p - 粒子图形
   */
  resetParticle(p) {
    p.x = 0
    p.y = 0
    p.alpha = 1
    p.scale.set(1)
    p.visible = true
    p.vx = 0
    p.vy = 0
    p.life = 1
  }

  /**
   * 创建爆炸效果
   * @param {number} x - 爆炸位置 x
   * @param {number} y - 爆炸位置 y
   * @param {number} count - 粒子数量
   */
  create(x, y, count = CONFIG.explosion.particleCount) {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.get()
      if (!p) return // 池满了就跳过

      // 设置位置
      p.position.set(x, y)

      // 设置颜色（红色和黄色交替）
      const isRed = i < count / 2
      p.tint = isRed ? 0xff6b6b : 0xffd93d

      // 设置速度和方向
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed

      // 设置生命周期
      p.life = 1
    }
  }

  /**
   * 更新所有粒子
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    const activeParticles = this.particlePool.active

    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i]

      // 移动粒子
      p.x += p.vx * dt
      p.y += p.vy * dt

      // 更新生命周期
      p.life -= CONFIG.explosion.lifetime * dt
      p.alpha = p.life
      p.scale.set(p.life)

      // 生命周期结束，回收粒子
      if (p.life <= 0) {
        this.particlePool.release(p)
      }
    }
  }

  /**
   * 重置系统
   */
  reset() {
    this.particlePool.clear()
  }
}
