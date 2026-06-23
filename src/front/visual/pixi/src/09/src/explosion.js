/**
 * 爆炸特效
 * 命中时显示粒子爆炸效果
 */
import { Graphics } from 'pixi.js'

export class ExplosionSystem {
  constructor(app, gameScene) {
    this.app = app;
    this.gameScene = gameScene;
    this.particles = []; // 活跃的粒子
  }

  /**
   * 创建爆炸效果
   * @param {number} x - 爆炸位置 x
   * @param {number} y - 爆炸位置 y
   * @param {number} count - 粒子数量
   */
  create(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      p.circle(0, 0, 2 + Math.random() * 3);
      p.fill(i < count / 2 ? 0xff6b6b : 0xffd93d);
      p.position.set(x, y);

      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 1;

      this.gameScene.addChild(p);
      this.particles.push(p);
    }
  }

  /**
   * 更新所有粒子
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.03 * dt;
      p.alpha = p.life;
      p.scale.set(p.life);

      // 生命周期结束，移除粒子
      if (p.life <= 0) {
        this.gameScene.removeChild(p);
        p.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * 重置系统
   */
  reset() {
    for (const p of this.particles) {
      this.gameScene.removeChild(p);
      p.destroy();
    }
    this.particles = [];
  }
}
