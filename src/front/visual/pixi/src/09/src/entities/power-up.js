/**
 * 道具系统
 * 管理道具的生成、移动和回收
 */
import { Graphics, Sprite } from 'pixi.js'
import { ObjectPool } from '../pool.js'
import { CONFIG } from '../core/config.js'

export class PowerUpSystem {
    constructor(app, gameScene, textures) {
        this.app = app
        this.gameScene = gameScene
        this.textures = textures // 纹理映射 { bulletUpgrade: Texture, shield: Texture, ... }

        // 创建道具池
        this.pool = new ObjectPool(
            () => this.createPowerUp(),
            (powerUp) => this.resetPowerUp(powerUp),
            10 // 最大道具数
        )
    }

    /**
     * 创建一个道具精灵
     * @returns {Sprite} 道具精灵
     */
    createPowerUp() {
        const powerUp = new Sprite()
        powerUp.anchor.set(0.5)
        this.gameScene.addChild(powerUp)
        return powerUp
    }

    /**
     * 重置道具状态
     * @param {Sprite} powerUp - 道具精灵
     */
    resetPowerUp(powerUp) {
        powerUp.x = 0
        powerUp.y = 0
        powerUp.alpha = 1
        powerUp.visible = true
        powerUp.type = null
        powerUp.radius = 15
        powerUp.speed = 2
    }

    /**
     * 生成道具
     * @param {string} type - 道具类型
     * @param {number} x - 生成位置 x
     * @param {number} y - 生成位置 y
     * @returns {Sprite|null} 道具精灵
     */
    spawn(type, x, y) {
        const powerUp = this.pool.get()
        if (!powerUp) return null

        const config = CONFIG.powerUps.types[type]
        if (!config) return null

        // 设置道具属性
        powerUp.type = type
        powerUp.radius = 15
        powerUp.speed = 2

        // 设置纹理
        const texture = this.textures[type]
        if (texture) {
            powerUp.texture = texture
            powerUp.scale.set(0.5)
        } else {
            // 没有纹理时用颜色方块表示
            const gfx = new Graphics()
            gfx.rect(-10, -10, 20, 20)
            gfx.fill(config.color)
            // 这里简化处理，实际应该生成纹理
        }

        // 设置位置
        powerUp.x = x
        powerUp.y = y

        return powerUp
    }

    /**
     * 更新所有道具位置
     * @param {number} dt - 帧时间因子
     * @param {number} screenHeight - 屏幕高度
     */
    update(dt, screenHeight) {
        for (let i = this.pool.active.length - 1; i >= 0; i--) {
            const powerUp = this.pool.active[i]
            powerUp.y += powerUp.speed * dt

            // 超出屏幕则回收
            if (powerUp.y > screenHeight + 50) {
                this.pool.release(powerUp)
            }
        }
    }

    /**
     * 获取活跃道具列表
     * @returns {Array} 活跃道具数组
     */
    getActivePowerUps() {
        return this.pool.active
    }

    /**
     * 回收道具
     * @param {Sprite} powerUp - 道具精灵
     */
    release(powerUp) {
        this.pool.release(powerUp)
    }

    /**
     * 重置系统
     */
    reset() {
        this.pool.clear()
    }
}
