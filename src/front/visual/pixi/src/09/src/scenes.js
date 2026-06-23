/**
 * 场景管理
 * 管理开始/游戏/结束三个场景的切换
 */
import { Container, Text } from 'pixi.js'

export class SceneManager {
  constructor(app) {
    this.app = app;
    this.currentScene = null;

    // 创建三个场景容器
    this.startScene = this.createStartScene();
    this.gameScene = this.createGameScene();
    this.gameOverScene = this.createGameOverScene();

    // 添加到舞台
    app.stage.addChild(this.startScene);
    app.stage.addChild(this.gameScene);
    app.stage.addChild(this.gameOverScene);

    // 默认显示开始场景
    this.showScene(this.startScene);
  }

  /**
   * 创建开始场景
   */
  createStartScene() {
    const scene = new Container();

    const title = new Text({
      text: '飞机大战',
      style: {
        fill: '#4ecdc4',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    title.anchor.set(0.5);
    title.position.set(400, 200);
    scene.addChild(title);

    const hint = new Text({
      text: '按空格键开始',
      style: {
        fill: '#888888',
        fontSize: 24,
        fontFamily: 'Arial',
      },
    });
    hint.anchor.set(0.5);
    hint.position.set(400, 300);
    scene.addChild(hint);

    const controls = new Text({
      text: '方向键/WASD 移动 | 空格键 射击',
      style: {
        fill: '#666666',
        fontSize: 16,
        fontFamily: 'Arial',
      },
    });
    controls.anchor.set(0.5);
    controls.position.set(400, 400);
    scene.addChild(controls);

    return scene;
  }

  /**
   * 创建游戏场景
   */
  createGameScene() {
    const scene = new Container();
    scene.visible = false;
    return scene;
  }

  /**
   * 创建结束场景
   */
  createGameOverScene() {
    const scene = new Container();
    scene.visible = false;

    const gameOverText = new Text({
      text: '游戏结束',
      style: {
        fill: '#ff6b6b',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    gameOverText.anchor.set(0.5);
    gameOverText.position.set(400, 200);
    scene.addChild(gameOverText);

    // 最终分数（稍后动态更新）
    this.finalScoreText = new Text({
      text: '得分: 0',
      style: {
        fill: '#ffffff',
        fontSize: 28,
        fontFamily: 'Arial',
      },
    });
    this.finalScoreText.anchor.set(0.5);
    this.finalScoreText.position.set(400, 280);
    scene.addChild(this.finalScoreText);

    const restartHint = new Text({
      text: '按空格键重新开始',
      style: {
        fill: '#888888',
        fontSize: 20,
        fontFamily: 'Arial',
      },
    });
    restartHint.anchor.set(0.5);
    restartHint.position.set(400, 350);
    scene.addChild(restartHint);

    return scene;
  }

  /**
   * 切换显示场景
   */
  showScene(scene) {
    this.startScene.visible = false;
    this.gameScene.visible = false;
    this.gameOverScene.visible = false;
    scene.visible = true;
    this.currentScene = scene;
  }

  /**
   * 显示开始场景
   */
  showStart() {
    this.showScene(this.startScene);
  }

  /**
   * 显示游戏场景
   */
  showGame() {
    this.showScene(this.gameScene);
  }

  /**
   * 显示结束场景
   */
  showGameOver(score) {
    this.finalScoreText.text = `得分: ${score}`;
    this.showScene(this.gameOverScene);
  }

  /**
   * 当前是否在游戏场景
   */
  get isPlaying() {
    return this.currentScene === this.gameScene;
  }
}
