/**
 * 游戏配置
 * 所有可调参数集中管理
 */
export const CONFIG = {
    // 屏幕尺寸
    screen: {
        width: 800,
        height: 600,
        background: '#0f0f23',
    },

    // 玩家配置
    player: {
        speed: 5,
        initialLives: 3,
        invincibleDuration: 3, // 护盾无敌时长（秒）
    },

    // 子弹配置
    bullet: {
        speed: 8,
        shootInterval: 8, // 帧间隔
        maxPoolSize: 50,
        // 子弹等级配置
        levels: {
            1: { count: 1, spread: 0 },           // 单发
            2: { count: 2, spread: 10 },          // 双发（间隔 10px）
            3: { count: 3, spread: 15, angle: 5 }, // 三发散射（角度 5°）
        },
    },

    // 敌机配置
    enemies: {
        meteor: {
            type: 'meteor',
            hp: 1,
            speed: 2,
            score: 10,
            radius: 20,
            scale: 0.4,
            texture: 'Meteors/spaceMeteors_001.png',
        },
        fighter: {
            type: 'fighter',
            hp: 1,
            speed: 4,
            score: 20,
            radius: 15,
            scale: 0.3,
            texture: 'Missiles/spaceMissiles_001.png',
        },
        tank: {
            type: 'tank',
            hp: 3,
            speed: 1,
            score: 50,
            radius: 25,
            scale: 0.5,
            texture: 'Building/spaceBuilding_001.png',
        },
    },

    // 道具配置
    powerUps: {
        dropChance: 0.2, // 20% 掉落概率
        types: {
            bulletUpgrade: {
                type: 'bulletUpgrade',
                color: 0xffd93d, // 金色
                duration: 0,     // 永久
                texture: 'Parts/spaceParts_001.png',
            },
            shield: {
                type: 'shield',
                color: 0x4ecdc4, // 青色
                duration: 3,     // 3 秒
                texture: 'Parts/spaceParts_002.png',
            },
            life: {
                type: 'life',
                color: 0xff6b6b, // 红色
                duration: 0,
                texture: 'Parts/spaceParts_003.png',
            },
            bomb: {
                type: 'bomb',
                color: 0xff9ff3, // 粉色
                duration: 0,
                texture: 'Parts/spaceParts_004.png',
            },
        },
    },

    // 难度曲线配置
    difficulty: {
        spawnIntervalStart: 60,   // 初始生成间隔（帧）
        spawnIntervalMin: 20,     // 最小生成间隔
        spawnIntervalDecay: 0.5,  // 每 30 秒减少多少帧
        speedMultiplier: 1.1,     // 每 30 秒速度倍率增长
        fighterUnlockTime: 30,    // 30 秒后解锁战斗机
        tankUnlockTime: 60,       // 60 秒后解锁坦克
    },

    // 爆炸特效配置
    explosion: {
        particleCount: 12,  // 每次爆炸粒子数
        maxPoolSize: 200,   // 粒子池上限
        lifetime: 0.03,     // 生命周期衰减速度
    },

    // 背景配置
    background: {
        layers: [
            { count: 50, speed: 0.3, size: 1, alpha: 0.3 },  // 远景小星星
            { count: 30, speed: 0.6, size: 2, alpha: 0.5 },  // 中景星星
            { count: 15, speed: 1.0, size: 3, alpha: 0.8 },  // 近景大星星
        ],
    },
}
