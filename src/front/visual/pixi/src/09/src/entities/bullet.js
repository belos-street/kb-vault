/**
 * 子弹系统
 * 支持子弹等级（单发/双发/三发散射）
 */
import { Graphics, Sprite } from 'pixi.js'
import { ObjectPool } from '../pool.js'
import { CONFIG } from '../core/config.js'
import { eventBus, EVENTS } from '../core/event-bus.js'

export class BulletSystem {
    constructor(app, gameScene) {
        this.app = app
        this.gameScene = gameScene
        this.shootCooldown = 0
        this.level = 1 // 子弹等级

        // 生成子弹纹理
        const bulletGfx = new Graphics()
        bulletGfx.rect(0, 0, 4, 12)
        bulletGfx.fill(0xffd93d)
        this.texture = app.renderer.generateTexture(bulletGfx)
        bulletGfx.destroy()

        // 创建子弹池
        this.pool = new ObjectPool(
            () => this.createBullet(),
            (bullet) => this.resetBullet(bullet),
            CONFIG.bullet.maxPoolSize
        )

        // 监听子弹升级事件
        eventBus.on(EVENTS.BULLET_UPGRADE, () => this.upgrade())
    }

    /**
     * 创建一个子弹精灵
     * @returns {Sprite} 子弹精灵
     */
    createBullet() {
        const bullet = new Sprite(this.texture)
        bullet.anchor.set(0.5)
        this.gameScene.addChild(bullet)
        return bullet
    }

    /**
     * 重置子弹状态
     * @param {Sprite} bullet - 子弹精灵
     */
    resetBullet(bullet) {
        bullet.x = 0
        bullet.y = 0
        bullet.alpha = 1
        bullet.rotation = 0
        bullet.visible = true
    }

    /**
     * 升级子弹
     */
    upgrade() {
        if (this.level < 3) {
            this.level++
        }
    }

    /**
     * 重置子弹等级
     */
    resetLevel() {
        this.level = 1
    }

    /**
     * 发射子弹
     * @param {number} x - 发射位置 x
     * @param {number} y - 发射位置 y
     */
    shoot(x, y) {
        if (this.shootCooldown > 0) return

        const levelConfig = CONFIG.bullet.levels[this.level]
        if (!levelConfig) return

        const { count, spread, angle } = levelConfig

        // 根据等级发射子弹
        for (let i = 0; i < count; i++) {
            const bullet = this.pool.get()
            if (!bullet) continue

            // 计算子弹位置和角度
            if (count === 1) {
                // 单发：居中
                bullet.x = x
                bullet.y = y - 20
                bullet.rotation = 0
            } else if (count === 2) {
                // 双发：左右偏移
                bullet.x = x + (i === 0 ? -spread / 2 : spread / 2)
                bullet.y = y - 20
                bullet.rotation = 0
            } else if (count === 3) {
                // 三发：散射
                const angleRad = ((i - 1) * angle * Math.PI) / 180
                bullet.x = x
                bullet.y = y - 20
                bullet.rotation = angleRad
                // 存储角度用于移动
                bullet.vx = Math.sin(angleRad) * CONFIG.bullet.speed
                bullet.vy = -Math.cos(angleRad) * CONFIG.bullet.speed
            }
        }

        this.shootCooldown = CONFIG.bullet.shootInterval
    }

    /**
     * 更新所有子弹位置
     * @param {number} dt - 帧时间因子
     * @param {boolean} isShooting - 是否正在射击
     * @param {number} playerX - 玩家位置 x
     * @param {number} playerY - 玩家位置 y
     */
    update(dt, isShooting, playerX, playerY) {
        // 更新射击冷却
        this.shootCooldown -= dt

        // 射击
        if (isShooting && this.shootCooldown <= 0) {
            this.shoot(playerX, playerY)
        }

        // 更新子弹位置
        for (let i = this.pool.active.length - 1; i >= 0; i--) {
            const bullet = this.pool.active[i]

            // 散射子弹有自己的速度
            if (bullet.vx !== undefined) {
                bullet.x += bullet.vx * dt
                bullet.y += bullet.vy * dt
            } else {
                bullet.y -= CONFIG.bullet.speed * dt
            }

            // 超出屏幕则回收
            if (bullet.y < -20 || bullet.x < -20 || bullet.x > CONFIG.screen.width + 20) {
                this.pool.release(bullet)
            }
        }
    }

    /**
     * 获取活跃子弹列表
     * @returns {Array} 活跃子弹数组
     */
    getActiveBullets() {
        return this.pool.active
    }

    /**
     * 回收子弹
     * @param {Sprite} bullet - 子弹精灵
     */
    release(bullet) {
        this.pool.release(bullet)
    }

    /**
     * 重置系统
     */
    reset() {
        this.pool.clear()
        this.shootCooldown = 0
        this.level = 1
    }
}
