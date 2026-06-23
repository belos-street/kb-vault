/**
 * 敌机系统
 * 管理敌机的生成、移动和回收
 */
import { Sprite } from 'pixi.js'
import { ObjectPool } from './pool.js'

export class EnemySystem {
  constructor(app, gameScene, texture) {
    this.app = app;
    this.gameScene = gameScene;
    this.speed = 2;
    this.spawnTimer = 0;
    this.spawnInterval = 60; // 每 60 帧生成一个

    // 创建敌机池
    this.pool = new ObjectPool(
      () => this.createEnemy(texture),
      (enemy) => this.resetEnemy(enemy),
      20
    );
  }

  /**
   * 创建一个敌机精灵
   */
  createEnemy(texture) {
    const enemy = new Sprite(texture);
    enemy.anchor.set(0.5);
    enemy.scale.set(0.4);
    this.gameScene.addChild(enemy);
    return enemy;
  }

  /**
   * 重置敌机状态
   */
  resetEnemy(enemy) {
    enemy.x = 0;
    enemy.y = 0;
    enemy.alpha = 1;
    enemy.radius = 20; // 碰撞半径
  }

  /**
   * 生成一个敌机
   * @param {number} screenWidth - 屏幕宽度
   */
  spawn(screenWidth) {
    const enemy = this.pool.get();
    if (enemy) {
      enemy.x = 50 + Math.random() * (screenWidth - 100);
      enemy.y = -40;
    }
  }

  /**
   * 更新所有敌机位置
   * @param {number} dt - 帧时间因子
   * @param {number} screenWidth - 屏幕宽度
   * @param {number} screenHeight - 屏幕高度
   */
  update(dt, screenWidth, screenHeight) {
    // 更新生成计时器
    this.spawnTimer -= dt;

    // 生成敌机
    if (this.spawnTimer <= 0) {
      this.spawn(screenWidth);
      this.spawnTimer = this.spawnInterval;
    }

    // 更新敌机位置
    for (let i = this.pool.active.length - 1; i >= 0; i--) {
      const enemy = this.pool.active[i];
      enemy.y += this.speed * dt;

      // 超出屏幕则回收
      if (enemy.y > screenHeight + 50) {
        this.pool.release(enemy);
      }
    }
  }

  /**
   * 获取活跃敌机列表（用于碰撞检测）
   */
  getActiveEnemies() {
    return this.pool.active;
  }

  /**
   * 回收敌机
   */
  release(enemy) {
    this.pool.release(enemy);
  }

  /**
   * 重置系统
   */
  reset() {
    this.pool.clear();
    this.spawnTimer = 0;
  }
}
