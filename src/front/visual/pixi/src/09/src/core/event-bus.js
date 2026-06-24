/**
 * 事件总线
 * 发布/订阅模式，模块间解耦通信
 */
export class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // 返回取消订阅函数
    return () => this.off(event, callback)
  }

  /**
   * 订阅事件（只触发一次）
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper)
      callback(data)
    }
    this.on(event, wrapper)
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  /**
   * 清空所有订阅
   */
  clear() {
    this.listeners.clear()
  }
}

// 导出全局单例
export const eventBus = new EventBus()

// 事件类型常量
export const EVENTS = {
  // 游戏状态
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  GAME_START: 'game:start',
  GAME_RESET: 'game:reset',

  // 战斗事件
  ENEMY_KILLED: 'enemy:killed',
  ENEMY_REACHED_BOTTOM: 'enemy:reachedBottom',
  PLAYER_HIT: 'player:hit',
  PLAYER_DIED: 'player:died',

  // 道具事件
  POWERUP_COLLECTED: 'powerup:collected',
  POWERUP_SPAWN: 'powerup:spawn',

  // 子弹事件
  BULLET_UPGRADE: 'bullet:upgrade',
  BOMB_USED: 'bomb:used',

  // UI 更新
  SCORE_UPDATE: 'score:update',
  LIVES_UPDATE: 'lives:update',
}
