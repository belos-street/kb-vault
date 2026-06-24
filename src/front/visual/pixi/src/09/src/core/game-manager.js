/**
 * 游戏状态管理
 * 管理 playing/paused/gameover 状态，处理暂停逻辑
 */
import { eventBus, EVENTS } from './event-bus.js'

// 游戏状态枚举
export const GameState = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
}

export class GameManager {
  constructor() {
    this.state = GameState.IDLE
    this.elapsedTime = 0    // 游戏已运行时间（秒）
    this.frameCount = 0     // 帧计数
    this.isPaused = false

    this.setupInput()
  }

  /**
   * 设置键盘输入
   */
  setupInput() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        this.togglePause()
      }
    })
  }

  /**
   * 切换暂停状态
   */
  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.pause()
    } else if (this.state === GameState.PAUSED) {
      this.resume()
    }
  }

  /**
   * 暂停游戏
   */
  pause() {
    if (this.state !== GameState.PLAYING) return
    this.state = GameState.PAUSED
    this.isPaused = true
    eventBus.emit(EVENTS.GAME_PAUSE)
  }

  /**
   * 继续游戏
   */
  resume() {
    if (this.state !== GameState.PAUSED) return
    this.state = GameState.PLAYING
    this.isPaused = false
    eventBus.emit(EVENTS.GAME_RESUME)
  }

  /**
   * 开始游戏
   */
  start() {
    this.state = GameState.PLAYING
    this.elapsedTime = 0
    this.frameCount = 0
    this.isPaused = false
    eventBus.emit(EVENTS.GAME_START)
  }

  /**
   * 游戏结束
   */
  gameOver() {
    this.state = GameState.GAME_OVER
    this.isPaused = true
    eventBus.emit(EVENTS.GAME_OVER)
  }

  /**
   * 重置游戏
   */
  reset() {
    this.state = GameState.IDLE
    this.elapsedTime = 0
    this.frameCount = 0
    this.isPaused = false
    eventBus.emit(EVENTS.GAME_RESET)
  }

  /**
   * 更新游戏时间（每帧调用）
   * @param {number} dt - 帧时间因子
   */
  update(dt) {
    if (this.state !== GameState.PLAYING) return

    this.frameCount++
    // 假设 60fps，每 60 帧 = 1 秒
    this.elapsedTime = this.frameCount / 60
  }

  /**
   * 当前是否在游戏中
   */
  get isPlaying() {
    return this.state === GameState.PLAYING
  }

  /**
   * 当前是否在暂停
   */
  get isPausedState() {
    return this.state === GameState.PAUSED
  }

  /**
   * 当前是否在游戏结束
   */
  get isGameOver() {
    return this.state === GameState.GAME_OVER
  }

  /**
   * 获取已运行时间（秒）
   */
  get elapsed() {
    return this.elapsedTime
  }
}
