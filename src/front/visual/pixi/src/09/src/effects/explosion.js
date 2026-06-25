/**
 * 爆炸特效系统
 * 使用 ParticleContainer + Particle 实现高性能粒子效果
 * 参考: pixijs-scene-particle-container skill
 */
import { Graphics, ParticleContainer, Particle, Rectangle } from 'pixi.js'
import { CONFIG } from '../core/config.js'

export class ExplosionSystem {
  constructor(app, gameScene) {
    this.app = app
    this.gameScene = gameScene

    // 预生成粒子纹理
    const gfx = new Graphics()
    gfx.circle(0, 0, 4)
    gfx.fill({ color: 0xffffff, alpha: 1 })
    this.texture = app.renderer.generateTexture(gfx)
    gfx.destroy()

    // 使用 ParticleContainer 高性能渲染
    this.container = new ParticleContainer({
      texture: this.texture,
      boundsArea: new Rectangle(0, 0, CONFIG.screen.width, CONFIG.screen.height),
      dynamicProperties: {
        position: true,
        rotation: false,
        color: true,    // 需要动画 alpha/tint
        vertex: true,   // 需要动画 scale
      },
    })
    gameScene.addChild(this.container)

    // 粒子池（Particle 是轻量结构，用数组管理）
    this.particles = []       // 所有活跃粒子
    this.velocities = []      // 对应粒子的速度 { vx, vy }
    this.lifetimes = []       // 对应粒子的生命周期
    this.maxParticles = CONFIG.explosion.maxPoolSize
  }

  /**
   * 创建爆炸效果
   * @param {number} x - 爆炸位置 x
   * @param {number} y - 爆炸位置 y
   * @param {number} count - 粒子数量
   */
  create(x, y, count = CONFIG.explosion.particleCount) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) return

      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
      const speed = 2 + Math.random() * 3

      const particle = new Particle({
        texture: this.texture,
        x,
        y,
        scaleX: 1,
        scaleY: 1,
        anchorX: 0.5,
        anchorY: 0.5,
        tint: i < count / 2 ? 0xff6b6b : 0xffd93d,
        alpha: 1,
      })

      this.container.addParticle(particle)
      this.particles.push(particle)
      this.velocities.push({
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      })
      this.lifetimes.push(1)
    }
  }

  /**
   * 更新所有粒子
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    const decay = CONFIG.explosion.lifetime * dt

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      const v = this.velocities[i]

      // 移动粒子
      p.x += v.vx * dt
      p.y += v.vy * dt

      // 更新生命周期
      this.lifetimes[i] -= decay
      const life = this.lifetimes[i]
      p.alpha = life
      p.scaleX = life
      p.scaleY = life

      // 生命周期结束，回收粒子
      if (life <= 0) {
        this.container.removeParticle(p)
        this.particles.splice(i, 1)
        this.velocities.splice(i, 1)
        this.lifetimes.splice(i, 1)
      }
    }
  }

  /**
   * 重置系统
   */
  reset() {
    for (const p of this.particles) {
      this.container.removeParticle(p)
    }
    this.particles.length = 0
    this.velocities.length = 0
    this.lifetimes.length = 0
  }
}
