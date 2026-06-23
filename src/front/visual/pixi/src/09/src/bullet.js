/**
 * 子弹系统
 * 使用对象池管理子弹的创建和销毁
 */
import { Graphics, Sprite } from 'pixi.js'
import { ObjectPool } from './pool.js'

export class BulletSystem {
  constructor(app, gameScene) {
    this.app = app;
    this.gameScene = gameScene;
    this.speed = 8;
    this.shootCooldown = 0;
    this.shootInterval = 8; // 帧间隔

    // 生成子弹纹理（用 Graphics 生成，无需图片文件）
    const bulletGfx = new Graphics();
    bulletGfx.rect(0, 0, 4, 12);
    bulletGfx.fill(0xffd93d);
    this.texture = app.renderer.generateTexture(bulletGfx);
    bulletGfx.destroy();

    // 创建子弹池
    this.pool = new ObjectPool(
      () => this.createBullet(),
      (bullet) => this.resetBullet(bullet),
      50
    );
  }

  /**
   * 创建一个子弹精灵
   */
  createBullet() {
    const bullet = new Sprite(this.texture);
    bullet.anchor.set(0.5);
    this.gameScene.addChild(bullet);
    return bullet;
  }

  /**
   * 重置子弹状态
   */
  resetBullet(bullet) {
    bullet.x = 0;
    bullet.y = 0;
    bullet.alpha = 1;
    bullet.rotation = 0;
  }

  /**
   * 发射子弹
   * @param {number} x - 发射位置 x
   * @param {number} y - 发射位置 y
   */
  shoot(x, y) {
    if (this.shootCooldown > 0) return;

    const bullet = this.pool.get();
    if (bullet) {
      bullet.x = x;
      bullet.y = y - 20;
      this.shootCooldown = this.shootInterval;
    }
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
    this.shootCooldown -= dt;

    // 射击
    if (isShooting && this.shootCooldown <= 0) {
      this.shoot(playerX, playerY);
    }

    // 更新子弹位置
    for (let i = this.pool.active.length - 1; i >= 0; i--) {
      const bullet = this.pool.active[i];
      bullet.y -= this.speed * dt;

      // 超出屏幕则回收
      if (bullet.y < -20) {
        this.pool.release(bullet);
      }
    }
  }

  /**
   * 获取活跃子弹列表（用于碰撞检测）
   */
  getActiveBullets() {
    return this.pool.active;
  }

  /**
   * 回收子弹
   */
  release(bullet) {
    this.pool.release(bullet);
  }
}
