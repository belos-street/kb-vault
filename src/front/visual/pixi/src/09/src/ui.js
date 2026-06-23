/**
 * UI 系统
 * 管理分数、生命值的显示
 */
import { Text } from 'pixi.js'

export class UI {
  constructor(gameScene) {
    this.gameScene = gameScene;

    // 分数
    this.score = 0;
    this.scoreText = new Text({
      text: '得分: 0',
      style: {
        fill: '#ffffff',
        fontSize: 20,
        fontFamily: 'Arial',
      },
    });
    this.scoreText.position.set(10, 10);
    gameScene.addChild(this.scoreText);

    // 生命值
    this.lives = 3;
    this.livesText = new Text({
      text: '生命: 3',
      style: {
        fill: '#ff6b6b',
        fontSize: 20,
        fontFamily: 'Arial',
      },
    });
    this.livesText.position.set(10, 40);
    gameScene.addChild(this.livesText);
  }

  /**
   * 增加分数
   * @param {number} points - 增加的分数
   */
  addScore(points) {
    this.score += points;
    this.scoreText.text = `得分: ${this.score}`;
  }

  /**
   * 减少生命值
   * @returns {boolean} 是否游戏结束
   */
  loseLife() {
    this.lives--;
    this.livesText.text = `生命: ${this.lives}`;
    return this.lives <= 0;
  }

  /**
   * 重置 UI
   */
  reset() {
    this.score = 0;
    this.lives = 3;
    this.scoreText.text = '得分: 0';
    this.livesText.text = '生命: 3';
  }

  /**
   * 获取当前分数
   */
  get currentScore() {
    return this.score;
  }
}
