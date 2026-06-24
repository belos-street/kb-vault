/**
 * 场景管理
 * 管理开始/游戏/结束/暂停场景的切换
 */
import { Container, Text, Graphics } from 'pixi.js'
import { CONFIG } from '../core/config.js'
import { eventBus, EVENTS } from '../core/event-bus.js'

export class SceneManager {
  constructor(app) {
    this.app = app
    this.currentScene = null

    // 创建场景容器
    this.startScene = this.createStartScene()
    this.gameScene = this.createGameScene()
    this.pauseOverlay = this.createPauseOverlay()
    this.gameOverScene = this.createGameOverScene()

    // 添加到舞台
    app.stage.addChild(this.startScene)
    app.stage.addChild(this.gameScene)
    app.stage.addChild(this.pauseOverlay)
    app.stage.addChild(this.gameOverScene)

    // 默认显示开始场景
    this.showScene(this.startScene)

    // 监听事件
    this.setupEventListeners()
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    eventBus.on(EVENTS.GAME_PAUSE, () => this.showPause())
    eventBus.on(EVENTS.GAME_RESUME, () => this.hidePause())
    eventBus.on(EVENTS.GAME_OVER, (data) => this.showGameOver(data?.score || 0))
    eventBus.on(EVENTS.GAME_START, () => this.showGame())
  }

  /**
   * 创建开始场景
   * @returns {Container} 开始场景容器
   */
  createStartScene() {
    const scene = new Container()

    const title = new Text({
      text: '飞机大战',
      style: {
        fill: '#4ecdc4',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    })
    title.anchor.set(0.5)
    title.position.set(CONFIG.screen.width / 2, 200)
    scene.addChild(title)

    const hint = new Text({
      text: '按空格键开始',
      style: {
        fill: '#888888',
        fontSize: 24,
        fontFamily: 'Arial',
      },
    })
    hint.anchor.set(0.5)
    hint.position.set(CONFIG.screen.width / 2, 300)
    scene.addChild(hint)

    const controls = new Text({
      text: '方向键/WASD 移动 | 空格键 射击 | ESC 暂停',
      style: {
        fill: '#666666',
        fontSize: 16,
        fontFamily: 'Arial',
      },
    })
    controls.anchor.set(0.5)
    controls.position.set(CONFIG.screen.width / 2, 400)
    scene.addChild(controls)

    return scene
  }

  /**
   * 创建游戏场景
   * @returns {Container} 游戏场景容器
   */
  createGameScene() {
    const scene = new Container()
    scene.visible = false
    return scene
  }

  /**
   * 创建暂停覆盖层
   * @returns {Container} 暂停覆盖层容器
   */
  createPauseOverlay() {
    const overlay = new Container()
    overlay.visible = false

    // 半透明背景
    const bg = new Graphics()
    bg.rect(0, 0, CONFIG.screen.width, CONFIG.screen.height)
    bg.fill({ color: 0x000000, alpha: 0.7 })
    overlay.addChild(bg)

    // 暂停文字
    const pauseText = new Text({
      text: '暂停中',
      style: {
        fill: '#ffffff',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    })
    pauseText.anchor.set(0.5)
    pauseText.position.set(CONFIG.screen.width / 2, CONFIG.screen.height / 2 - 50)
    overlay.addChild(pauseText)

    // 提示文字
    const hintText = new Text({
      text: '按 ESC 继续',
      style: {
        fill: '#888888',
        fontSize: 20,
        fontFamily: 'Arial',
      },
    })
    hintText.anchor.set(0.5)
    hintText.position.set(CONFIG.screen.width / 2, CONFIG.screen.height / 2 + 20)
    overlay.addChild(hintText)

    return overlay
  }

  /**
   * 创建结束场景
   * @returns {Container} 结束场景容器
   */
  createGameOverScene() {
    const scene = new Container()
    scene.visible = false

    const gameOverText = new Text({
      text: '游戏结束',
      style: {
        fill: '#ff6b6b',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    })
    gameOverText.anchor.set(0.5)
    gameOverText.position.set(CONFIG.screen.width / 2, 200)
    scene.addChild(gameOverText)

    // 最终分数
    this.finalScoreText = new Text({
      text: '得分: 0',
      style: {
        fill: '#ffffff',
        fontSize: 28,
        fontFamily: 'Arial',
      },
    })
    this.finalScoreText.anchor.set(0.5)
    this.finalScoreText.position.set(CONFIG.screen.width / 2, 280)
    scene.addChild(this.finalScoreText)

    const restartHint = new Text({
      text: '按空格键重新开始',
      style: {
        fill: '#888888',
        fontSize: 20,
        fontFamily: 'Arial',
      },
    })
    restartHint.anchor.set(0.5)
    restartHint.position.set(CONFIG.screen.width / 2, 350)
    scene.addChild(restartHint)

    return scene
  }

  /**
   * 切换显示场景
   * @param {Container} scene - 要显示的场景
   */
  showScene(scene) {
    this.startScene.visible = false
    this.gameScene.visible = false
    this.gameOverScene.visible = false
    this.pauseOverlay.visible = false
    scene.visible = true
    this.currentScene = scene
  }

  /**
   * 显示开始场景
   */
  showStart() {
    this.showScene(this.startScene)
  }

  /**
   * 显示游戏场景
   */
  showGame() {
    this.showScene(this.gameScene)
  }

  /**
   * 显示暂停覆盖层
   */
  showPause() {
    this.pauseOverlay.visible = true
  }

  /**
   * 隐藏暂停覆盖层
   */
  hidePause() {
    this.pauseOverlay.visible = false
  }

  /**
   * 显示结束场景
   * @param {number} score - 最终分数
   */
  showGameOver(score) {
    this.finalScoreText.text = `得分: ${score}`
    this.showScene(this.gameOverScene)
  }

  /**
   * 当前是否在游戏场景
   */
  get isPlaying() {
    return this.currentScene === this.gameScene
  }
}
