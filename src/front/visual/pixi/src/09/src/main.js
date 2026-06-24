/**
 * 飞机大战 - 主入口
 * 串联所有模块，启动游戏循环
 */
import { Application, Assets } from 'pixi.js'
import { CONFIG } from './core/config.js'
import { eventBus, EVENTS } from './core/event-bus.js'
import { GameManager, GameState } from './core/game-manager.js'
import { SceneManager } from './ui/scenes.js'
import { HUD } from './ui/hud.js'
import { Background } from './systems/background.js'
import { CollisionSystem } from './systems/collision.js'
import { SpawnSystem } from './systems/spawn.js'
import { Player } from './entities/player.js'
import { BulletSystem } from './entities/bullet.js'
import { EnemySystem } from './entities/enemy.js'
import { PowerUpSystem } from './entities/power-up.js'
import { ExplosionSystem } from './effects/explosion.js'

async function main() {
  // 初始化应用
  const app = new Application()
  await app.init({
    width: CONFIG.screen.width,
    height: CONFIG.screen.height,
    background: CONFIG.screen.background,
  })
  document.body.appendChild(app.canvas)

  // 加载资源
  const textures = await loadTextures()

  // 初始化核心系统
  const gameManager = new GameManager()
  const sceneManager = new SceneManager(app)

  // 初始化游戏对象
  const player = new Player(textures.ship, CONFIG.screen.width, CONFIG.screen.height)
  const bulletSystem = new BulletSystem(app, sceneManager.gameScene)
  const enemySystem = new EnemySystem(app, sceneManager.gameScene, textures.enemies)
  const powerUpSystem = new PowerUpSystem(app, sceneManager.gameScene, textures.powerUps)
  const explosionSystem = new ExplosionSystem(app, sceneManager.gameScene)
  const background = new Background(sceneManager.gameScene, CONFIG.screen.width, CONFIG.screen.height)

  // 初始化系统
  const collisionSystem = new CollisionSystem(
    player, bulletSystem, enemySystem, powerUpSystem, explosionSystem
  )
  const spawnSystem = new SpawnSystem(enemySystem, powerUpSystem, gameManager)
  const hud = new HUD(sceneManager.gameScene)

  // 将玩家添加到游戏场景
  sceneManager.gameScene.addChild(player.sprite)

  // 设置事件监听
  setupEventListeners(gameManager, sceneManager, player, bulletSystem, enemySystem, powerUpSystem, explosionSystem, hud)

  // 键盘监听：空格键开始/重新开始
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault()
      if (gameManager.state === GameState.IDLE || gameManager.state === GameState.GAME_OVER) {
        startGame(gameManager, player, bulletSystem, enemySystem, powerUpSystem, explosionSystem, background, hud, sceneManager)
      }
    }
  })

  // 游戏主循环
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime

    // 暂停时不更新游戏逻辑
    if (gameManager.isPaused) return

    // 只在游戏状态时更新
    if (gameManager.isPlaying) {
      // 更新游戏时间
      gameManager.update(dt)

      // 更新背景
      background.update(dt)

      // 更新玩家
      player.update(dt)

      // 更新子弹系统
      const isShooting = player.keys['Space']
      bulletSystem.update(dt, isShooting, player.x, player.y)

      // 更新敌机系统
      enemySystem.update(dt, CONFIG.screen.height)

      // 更新道具系统
      powerUpSystem.update(dt, CONFIG.screen.height)

      // 更新生成系统
      spawnSystem.update(dt, CONFIG.screen.width)

      // 碰撞检测
      collisionSystem.update()

      // 更新爆炸特效
      explosionSystem.update(dt)

      // 更新护盾计时器
      if (player.isInvincible) {
        hud.updateShieldTimer(player.invincibleTimer)
      }
    }
  })
}

/**
 * 加载所有纹理
 */
async function loadTextures() {
  const [ship, meteor, fighter, tank, bulletUpgrade, shield, life, bomb] = await Promise.all([
    Assets.load('./assets/Ships/spaceShips_001.png'),
    Assets.load('./assets/Meteors/spaceMeteors_001.png'),
    Assets.load('./assets/Missiles/spaceMissiles_001.png'),
    Assets.load('./assets/Building/spaceBuilding_001.png'),
    Assets.load('./assets/Parts/spaceParts_001.png'),
    Assets.load('./assets/Parts/spaceParts_002.png'),
    Assets.load('./assets/Parts/spaceParts_003.png'),
    Assets.load('./assets/Parts/spaceParts_004.png'),
  ])

  return {
    ship,
    enemies: { meteor, fighter, tank },
    powerUps: { bulletUpgrade, shield, life, bomb },
  }
}

/**
 * 设置事件监听
 */
function setupEventListeners(
  gameManager, sceneManager, player, bulletSystem, enemySystem,
  powerUpSystem, explosionSystem, hud
) {
  // 敌机死亡：加分
  eventBus.on(EVENTS.ENEMY_KILLED, (data) => {
    hud.updateScore(hud.score + data.score)
    eventBus.emit(EVENTS.SCORE_UPDATE, { score: hud.score + data.score })
  })

  // 玩家被击中：扣血或死亡
  eventBus.on(EVENTS.PLAYER_HIT, () => {
    if (player.isInvincible) return

    const isDead = player.takeDamage()
    if (isDead) {
      // 游戏结束
      gameManager.gameOver()
      eventBus.emit(EVENTS.GAME_OVER, { score: hud.score })
    } else {
      // 扣血
      hud.updateLives(player.lives)
      eventBus.emit(EVENTS.LIVES_UPDATE, { lives: player.lives })
      // 短暂无敌
      player.setInvincible(60) // 1 秒无敌（60 帧）
    }
  })

  // 拾取道具
  eventBus.on(EVENTS.POWERUP_COLLECTED, (data) => {
    switch (data.type) {
      case 'bulletUpgrade':
        eventBus.emit(EVENTS.BULLET_UPGRADE)
        break
      case 'shield':
        player.setInvincible(CONFIG.player.invincibleDuration * 60)
        break
      case 'life':
        player.lives = Math.min(player.lives + 1, CONFIG.player.initialLives + 2)
        hud.updateLives(player.lives)
        eventBus.emit(EVENTS.LIVES_UPDATE, { lives: player.lives })
        break
      case 'bomb':
        // 清屏
        enemySystem.clearAll()
        eventBus.emit(EVENTS.BOMB_USED)
        break
    }
  })
}

/**
 * 开始游戏
 */
function startGame(
  gameManager, player, bulletSystem, enemySystem,
  powerUpSystem, explosionSystem, background, hud, sceneManager
) {
  // 重置所有系统
  player.reset()
  bulletSystem.reset()
  enemySystem.reset()
  powerUpSystem.reset()
  explosionSystem.reset()
  background.reset()
  hud.reset()

  // 开始游戏
  gameManager.start()
  sceneManager.showGame()
}

// 启动游戏
main().catch(console.error)
