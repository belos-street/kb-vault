# Kenney Space Shooter Extension

> 来源：https://kenney.nl/assets/space-shooter-extension
> 作者：Kenney Vleugels (Kenney.nl)
> 许可证：CC0（免费商用，无需署名）

---

## 目录结构

```
PNG/
└── Sprites X2/          # 2 倍分辨率素材（推荐使用）
    ├── Astronauts/       # 宇航员
    ├── Building/         # 建筑/设施
    ├── Effects/          # 特效
    ├── Meteors/          # 陨石
    ├── Missiles/         # 导弹/子弹
    ├── Parts/            # 飞船零部件（组装用）
    ├── Rocket parts/     # 火箭零部件
    ├── Rockets/          # 火箭（完整）
    ├── Ships/            # 飞船（完整）
    └── Station/          # 空间站
```

## 素材分类说明

| 目录 | 数量 | 说明 | 典型用途 |
|------|------|------|---------|
| **Astronauts** | 18 | 宇航员角色，多种姿态 | 角色 Sprite、NPC |
| **Building** | 25 | 太空建筑/设施 | 背景装饰、基地 |
| **Effects** | 18 | 爆炸、光环等特效 | 粒子效果、爆炸动画帧 |
| **Meteors** | 4 | 陨石（不同大小和形状） | 障碍物、可破坏目标 |
| **Missiles** | 40 | 各种导弹和子弹 | 子弹 Sprite、武器类型 |
| **Parts** | 98 | 飞船零部件（机翼、引擎、驾驶舱等） | 飞船组装系统、自定义飞船 |
| **Rocket parts** | 31 | 火箭零部件 | 火箭组装、升级系统 |
| **Rockets** | 4 | 完整火箭 | 火箭 Sprite |
| **Ships** | 9 | 完整飞船 | 玩家/敌机 Sprite |
| **Station** | 31 | 空间站模块 | 关卡背景、Boss |

## 在 PixiJS 中使用

```javascript
import { Assets, Sprite } from 'pixi.js';

// 加载单张素材
const texture = await Assets.load('assets/kenney_space-shooter-extension/PNG/Sprites X2/Ships/spaceShips_001.png');
const ship = new Sprite(texture);
ship.anchor.set(0.5);
app.stage.addChild(ship);

// 批量加载（带别名）
await Assets.load([
  { alias: 'player', src: 'assets/kenney_space-shooter-extension/PNG/Sprites X2/Ships/spaceShips_001.png' },
  { alias: 'enemy',  src: 'assets/kenney_space-shooter-extension/PNG/Sprites X2/Ships/spaceShips_006.png' },
  { alias: 'bullet', src: 'assets/kenney_space-shooter-extension/PNG/Sprites X2/Missiles/spaceMissiles_001.png' },
  { alias: 'meteor', src: 'assets/kenney_space-shooter-extension/PNG/Sprites X2/Meteors/spaceMeteors_001.png' },
]);

const playerShip = new Sprite(Assets.get('player'));
const enemyShip = new Sprite(Assets.get('enemy'));
```

## 文件命名规则

素材按类别编号，格式为 `space{类别}_{编号}.png`：

- `spaceShips_001.png` ~ `spaceShips_009.png` — 飞船
- `spaceMissiles_001.png` ~ `spaceMissiles_040.png` — 导弹/子弹
- `spaceMeteors_001.png` ~ `spaceMeteors_004.png` — 陨石
- `spaceEffects_001.png` ~ `spaceEffects_018.png` — 特效
- `spaceParts_001.png` ~ `spaceParts_098.png` — 零部件
