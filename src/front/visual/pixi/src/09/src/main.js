/**
 * 飞机大战 - 主入口
 * 整合所有模块，启动游戏循环
 */
import { Application, Assets } from 'pixi.js'
import { SceneManager } from './scenes.js'
import { Player } from './player.js'
import { BulletSystem } from './bullet.js'
import { EnemySystem } from './enemy.js'
import { ExplosionSystem } from './explosion.js'
import { UI } from './ui.js'

// 游戏尺寸
const SCREEN_WIDTH = 800
const SCREEN_HEIGHT = 600

async function main() {
  // 初始化应用
  const app = new Application()
  await app.init({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    background: '#0f0f23',
  })
  document.body.appendChild(app.canvas)

  // 加载资源（路径相对 index.html，目录名含空格需编码）
  const assetBase = '../assets/kenney_space-shooter-extension/PNG/Sprites%20X2'
  const shipTexture = await Assets.load(`${assetBase}/Ships/spaceShips_001.png`)
  const enemyTexture = await Assets.load(`${assetBase}/Meteors/spaceMeteors_001.png`)

  // 初始化场景管理
  const sceneManager = new SceneManager(app)

  // 初始化游戏对象（添加到游戏场景）
  const player = new Player(shipTexture, SCREEN_WIDTH, SCREEN_HEIGHT)
  sceneManager.gameScene.addChild(player.sprite)

  const bulletSystem = new BulletSystem(app, sceneManager.gameScene)
  const enemySystem = new EnemySystem(app, sceneManager.gameScene, enemyTexture)
  const explosionSystem = new ExplosionSystem(app, sceneManager.gameScene)
  const ui = new UI(sceneManager.gameScene)

  // 碰撞检测：圆形碰撞（平方比较，性能更好）
  function circleHit(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const r = (a.radius || 10) + (b.radius || 10)
    return dx * dx + dy * dy < r * r
  }

  // 重置游戏状态
  function resetGame() {
    player.reset()
    bulletSystem.pool.clear()
    enemySystem.reset()
    explosionSystem.reset()
    ui.reset()
  }

  // 开始游戏
  function startGame() {
    resetGame()
    sceneManager.showGame()
  }

  // 游戏结束
  function gameOver() {
    sceneManager.showGameOver(ui.currentScore)
  }

  // 键盘监听：空格键
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault()
      if (!sceneManager.isPlaying) {
        startGame()
      }
    }
  })

  // 游戏主循环
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime

    // 未进入游戏场景时不执行游戏逻辑
    if (!sceneManager.isPlaying) return

    // 1. 更新玩家位置
    player.update(dt)

    // 2. 更新子弹系统
    const isShooting = player.keys['Space']
    bulletSystem.update(dt, isShooting, player.x, player.y)

    // 3. 更新敌机系统
    enemySystem.update(dt, SCREEN_WIDTH, SCREEN_HEIGHT)

    // 4. 碰撞检测：子弹 vs 敌机
    const bullets = bulletSystem.getActiveBullets()
    const enemies = enemySystem.getActiveEnemies()

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j]
        if (circleHit(bullet, enemy)) {
          // 命中！
          explosionSystem.create(enemy.x, enemy.y)
          bulletSystem.release(bullet)
          enemySystem.release(enemy)
          ui.addScore(10)
          break
        }
      }
    }

    // 5. 碰撞检测：敌机 vs 玩家
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      if (circleHit(player, enemy)) {
        explosionSystem.create(enemy.x, enemy.y)
        enemySystem.release(enemy)
        const isGameOver = ui.loseLife()
        if (isGameOver) {
          gameOver()
          return
        }
      }
    }

    // 6. 更新爆炸特效
    explosionSystem.update(dt)
  })
}

// 启动游戏
main().catch(console.error)
