/**
 * 玩家飞船类
 * 封装移动、边界限制
 */
import { Sprite } from 'pixi.js'

export class Player {
  constructor(texture, screenWidth, screenHeight) {
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.5);
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // 初始位置：底部居中
    this.sprite.position.set(screenWidth / 2, screenHeight - 80);

    // 碰撞半径
    this.radius = 20;

    // 移动速度
    this.speed = 5;

    // 键盘状态
    this.keys = {};
    this.setupInput();
  }

  /**
   * 设置键盘输入
   */
  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  /**
   * 更新玩家位置（每帧调用）
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    const { sprite, speed, screenWidth, screenHeight } = this;

    // 移动
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      sprite.x -= speed * dt;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      sprite.x += speed * dt;
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      sprite.y -= speed * dt;
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      sprite.y += speed * dt;
    }

    // 边界限制
    const halfW = sprite.width / 2;
    const halfH = sprite.height / 2;
    sprite.x = Math.max(halfW, Math.min(screenWidth - halfW, sprite.x));
    sprite.y = Math.max(halfH, Math.min(screenHeight - halfH, sprite.y));
  }

  /**
   * 重置到初始位置
   */
  reset() {
    this.sprite.position.set(this.screenWidth / 2, this.screenHeight - 80);
  }

  /**
   * 获取位置（用于子弹发射）
   */
  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }
}
