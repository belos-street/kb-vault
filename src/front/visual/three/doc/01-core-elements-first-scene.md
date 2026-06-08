# 模块 1：核心三要素与第一个场景

**预计时间**：0.5 天（4-6 小时）  
**学习目标**：理解 Three.js 的核心三要素，创建第一个 3D 场景  
**面试可答**：Three.js 核心是 Scene + Camera + Renderer，Scene 是容器，Camera 定义视角，Renderer 负责渲染。

---

## 0. Three.js 是什么？

**Three.js** 是一个基于 WebGL 的 JavaScript 3D 渲染库，它将复杂的底层 WebGL API 封装成简单易用的接口，让开发者能用少量代码创建 3D 场景。

**能做什么**：
- 3D 产品展示（如 IKEA 家具配置器）
- 数据可视化（3D 图表、地图）
- 游戏开发（网页 3D 游戏）
- 建筑/室内设计预览
- AR/VR 体验

**为什么选择 Three.js**：
- 生态最成熟：GitHub 100k+ Star，社区活跃，文档完善
- 上手最快：API 设计直观，比原生 WebGL 简单 10 倍
- 功能全面：支持模型加载、物理引擎、后处理等
- 性能优秀：底层仍是 WebGL，性能接近原生

> **面试可答**：Three.js 是最流行的 WebGL 3D 库，将底层 WebGL API 封装成简单接口，让前端开发者能快速创建 3D 场景，广泛应用于产品展示、数据可视化、游戏等领域。

---

## 1. 核心三要素

Three.js 的渲染系统由三个核心组件构成：

### 1.1 Scene（场景）

场景是所有 3D 对象的容器，类似于 HTML 中的 `<body>` 元素。

```js
// 创建场景
const scene = new THREE.Scene();

// 设置背景色（可选）
scene.background = new THREE.Color(0xf0f0f0);

// 添加雾效（可选，增加深度感）
scene.fog = new THREE.Fog(0xf0f0f0, 10, 100);
```

**场景的作用**：
- 作为所有 3D 对象的根容器
- 管理光照、相机、网格等对象
- 提供全局设置（背景色、雾效等）

### 1.2 Camera（相机）

相机定义了观察 3D 场景的视角，类似于人的眼睛。

#### PerspectiveCamera（透视相机）

最常用的相机类型，模拟人眼的透视效果（近大远小）。

```js
// 创建透视相机
const camera = new THREE.PerspectiveCamera(
  75,                                    // fov: 视野角度（度）
  window.innerWidth / window.innerHeight, // aspect: 宽高比
  0.1,                                   // near: 近裁剪面
  1000                                   // far: 远裁剪面
);

// 设置相机位置
camera.position.set(0, 0, 5);

// 让相机看向原点
camera.lookAt(0, 0, 0);
```

**参数说明**：
- `fov`（Field of View）：视野角度，越大视野越广，常用值 45-75
- `aspect`：宽高比，通常为 `window.innerWidth / window.innerHeight`
- `near`：近裁剪面，比这更近的物体不会被渲染
- `far`：远裁剪面，比这更远的物体不会被渲染

#### OrthographicCamera（正交相机）

正交相机没有透视效果，物体大小不受距离影响，常用于 2D 游戏或工程制图。

```js
// 创建正交相机
const frustumSize = 10;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  frustumSize * aspect / -2,  // left
  frustumSize * aspect / 2,   // right
  frustumSize / 2,            // top
  frustumSize / -2,           // bottom
  0.1,                        // near
  1000                        // far
);
```

**两种相机的对比**：
| 特性 | PerspectiveCamera | OrthographicCamera |
|------|------------------|-------------------|
| 透视效果 | 有（近大远小） | 无（平行投影） |
| 适用场景 | 3D 游戏、产品展示 | 2D 游戏、工程制图 |
| 参数 | fov, aspect, near, far | left, right, top, bottom, near, far |

### 1.3 Renderer（渲染器）

渲染器负责将场景和相机的信息渲染到屏幕上。

```js
// 创建渲染器
const renderer = new THREE.WebGLRenderer({
  antialias: true,  // 开启抗锯齿
  alpha: true       // 允许透明背景
});

// 设置渲染尺寸
renderer.setSize(window.innerWidth, window.innerHeight);

// 设置像素比（适配高清屏）
renderer.setPixelRatio(window.devicePixelRatio);

// 开启阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 将渲染器的 DOM 元素添加到页面
document.body.appendChild(renderer.domElement);
```

**渲染器的作用**：
- 将 3D 场景渲染为 2D 图像
- 处理抗锯齿、阴影、色调映射等
- 输出到 Canvas 元素

---

## 2. 渲染循环

Three.js 使用 `requestAnimationFrame` 实现动画循环，每帧调用渲染函数。

```js
// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  
  // 更新动画
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  
  // 渲染场景
  renderer.render(scene, camera);
}

// 启动渲染循环
animate();
```

**为什么需要渲染循环**：
- 实现动画效果（旋转、移动、缩放）
- 响应用户交互（鼠标、键盘）
- 更新物理模拟
- 处理异步加载

**性能提示**：
- **避免在循环中创建对象**：几何体、材质等应在循环外创建
- **使用 `requestAnimationFrame` 而非 `setInterval`**：更流畅、省电
- **页面不可见时自动暂停**：`requestAnimationFrame` 会自动暂停，无需手动处理
- **批量更新**：多个物体的更新放在同一个循环中，避免多次调用 `renderer.render`

```js
// ❌ 错误：在循环中创建对象
function animate() {
  requestAnimationFrame(animate);
  const geometry = new THREE.BoxGeometry(); // 每帧都创建，浪费内存
  renderer.render(scene, camera);
}

// ✅ 正确：在循环外创建对象
const geometry = new THREE.BoxGeometry();
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
```

---

## 3. 完整示例：旋转立方体

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Three.js 第一个场景</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      overflow: hidden;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <!-- 引入 Three.js -->
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
  
  <script>
    // 1. 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 2. 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    // 3. 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // 4. 创建立方体
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: false
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // 5. 渲染循环
    function animate() {
      requestAnimationFrame(animate);
      
      // 旋转立方体
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      // 渲染场景
      renderer.render(scene, camera);
    }
    
    animate();
    
    // 6. 响应窗口大小变化
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>
```

---

## 4. 常见踩坑

### 4.1 黑屏问题

**问题**：运行代码后只看到黑色背景，没有立方体。

**原因**：
1. 忘记调用 `renderer.render(scene, camera)`
2. 相机位置不对，立方体在相机视野之外
3. 立方体颜色和背景色相同

**解决方案**：
```js
// 确保在渲染循环中调用 render
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);  // 这行不能少
}

// 检查相机位置
camera.position.z = 5;  // 相机往后退，才能看到物体

// 检查物体位置
cube.position.set(0, 0, 0);  // 确保物体在原点
```

### 4.2 渲染器 DOM 元素未添加

**问题**：代码运行正常，但页面上看不到任何内容。

**原因**：忘记将渲染器的 DOM 元素添加到页面。

**解决方案**：
```js
document.body.appendChild(renderer.domElement);
```

### 4.3 像素比问题

**问题**：在高清屏上渲染模糊。

**原因**：没有设置正确的像素比。

**解决方案**：
```js
renderer.setPixelRatio(window.devicePixelRatio);
```

### 4.4 窗口大小变化

**问题**：调整浏览器窗口大小后，渲染变形或留白。

**原因**：没有监听窗口大小变化事件。

**解决方案**：
```js
window.addEventListener('resize', () => {
  // 更新相机宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // 更新渲染器尺寸
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## 5. 方案对比：Three.js vs 原生 WebGL vs Babylon.js

| 特性 | Three.js | 原生 WebGL | Babylon.js |
|------|----------|-----------|------------|
| **上手难度** | ⭐⭐ 简单 | ⭐⭐⭐⭐⭐ 极难 | ⭐⭐⭐ 中等 |
| **代码量** | 少（10 行创建场景） | 极多（100+ 行） | 中等 |
| **性能** | 接近原生 | 最优 | 接近原生 |
| **生态** | 最成熟（100k+ Star） | 无封装 | 较成熟（20k+ Star） |
| **适用场景** | 通用 3D、产品展示 | 底层控制、极致性能 | 游戏、复杂场景 |
| **学习曲线** | 平缓 | 陡峭 | 中等 |

**选型建议**：
- **选 Three.js**：快速上手、通用 3D 需求、生态丰富
- **选原生 WebGL**：极致性能、底层控制、学习 WebGL 原理
- **选 Babylon.js**：游戏开发、复杂物理场景、微软生态

> **面试可答**：Three.js 是最流行的 WebGL 库，生态最成熟，上手最快；原生 WebGL 性能最优但代码量大；Babylon.js 适合游戏开发。选 Three.js 是因为生态好、社区活跃、文档完善。

---

## 6. 面试常问

### Q0：Three.js 是什么？能做什么？

**答**：Three.js 是最流行的 WebGL 3D 渲染库，将底层 WebGL API 封装成简单接口。能做 3D 产品展示、数据可视化、游戏、AR/VR 等。选择它是因为生态最成熟（100k+ Star）、上手最快、功能全面。

### Q1：Three.js 的核心三要素是什么？

**答**：Three.js 的核心三要素是 Scene、Camera、Renderer：
- **Scene**：场景容器，所有 3D 对象的根节点
- **Camera**：相机，定义观察视角
- **Renderer**：渲染器，将 3D 场景渲染为 2D 图像

三者的关系：Scene 存放物体，Camera 定义视角，Renderer 将两者结合渲染到屏幕上。

### Q2：PerspectiveCamera 和 OrthographicCamera 有什么区别？

**答**：
- **PerspectiveCamera**：透视相机，模拟人眼效果，近大远小，常用于 3D 游戏和产品展示
- **OrthographicCamera**：正交相机，平行投影，物体大小不受距离影响，常用于 2D 游戏和工程制图

### Q3：为什么需要 requestAnimationFrame？

**答**：
- `requestAnimationFrame` 是浏览器提供的动画 API，每秒调用 60 次（60fps）
- 比 `setInterval` 更流畅，会自动暂停（页面不可见时）
- 与浏览器刷新率同步，避免掉帧
- 是实现动画循环的标准方式

**追问：requestAnimationFrame 与 setInterval 的区别？**

| 特性 | requestAnimationFrame | setInterval |
|------|----------------------|-------------|
| 刷新率 | 与浏览器同步（60fps） | 固定间隔（可能掉帧） |
| 页面不可见 | 自动暂停 | 继续执行 |
| 性能 | 优化（批量渲染） | 可能卡顿 |
| 精度 | 高（RAF 时间戳） | 低（定时器误差） |

**追问：页面不可见时动画会继续吗？**

不会。`requestAnimationFrame` 会自动暂停，节省性能。如果需要后台继续执行，可以用 `Web Worker` 或 `setInterval`（但不推荐）。

**追问：掉帧时如何处理？**

使用 `deltaTime` 计算时间差，保证动画速度一致：
```js
let lastTime = 0;
function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = (currentTime - lastTime) / 1000; // 转为秒
  lastTime = currentTime;
  
  // 基于时间的动画（速度恒定）
  cube.rotation.y += 2 * deltaTime; // 每秒转 2 弧度
  
  renderer.render(scene, camera);
}
```

### Q4：如何实现响应式渲染？

**答**：
```js
window.addEventListener('resize', () => {
  // 1. 更新相机宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // 2. 更新渲染器尺寸
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // 3. 更新像素比（可选）
  renderer.setPixelRatio(window.devicePixelRatio);
});
```

---

## 7. 练习

### 练习 1：创建基础场景

**要求**：
1. 创建一个场景，设置背景色为浅灰色
2. 创建一个透视相机，位置在 (0, 0, 5)
3. 创建一个渲染器，开启抗锯齿
4. 添加一个红色立方体到场景中心
5. 实现渲染循环

**提示**：
- 使用 `new THREE.Scene()` 创建场景
- 使用 `new THREE.PerspectiveCamera()` 创建相机
- 使用 `new THREE.WebGLRenderer()` 创建渲染器
- 使用 `new THREE.BoxGeometry()` 创建立方体几何体
- 使用 `new THREE.MeshBasicMaterial()` 创建材质
- 使用 `new THREE.Mesh()` 组合几何体和材质

**预期效果**：
- 页面中央显示一个红色立方体
- 背景为浅灰色
- 窗口大小变化时自动适配

### 练习 2：添加旋转动画

**要求**：
1. 在练习 1 的基础上，让立方体绕 X 轴和 Y 轴旋转
2. 旋转速度适中（不要太快也不要太慢）

**提示**：
- 在渲染循环中更新 `cube.rotation.x` 和 `cube.rotation.y`
- 每帧增加一个小角度（如 0.01）

**预期效果**：
- 立方体持续旋转
- 旋转流畅，不卡顿

### 练习 3：添加多个物体

**要求**：
1. 创建 3 个不同颜色的立方体
2. 将它们放置在不同的位置
3. 让它们以不同的速度旋转

**提示**：
- 使用 `cube.position.set(x, y, z)` 设置位置
- 为每个立方体创建不同的材质颜色
- 在渲染循环中分别更新每个立方体的旋转

**预期效果**：
- 三个立方体在不同位置旋转
- 颜色分别为红、绿、蓝

---

## 8. 进阶挑战

### 挑战 1：添加坐标轴辅助

```js
// 添加坐标轴辅助（红X、绿Y、蓝Z）
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
```

### 挑战 2：添加网格地面

```js
// 添加网格地面
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);
```

### 挑战 3：使用 OrbitControls

```js
// 引入 OrbitControls
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 创建控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 启用阻尼

// 在渲染循环中更新控制器
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // 必须调用
  renderer.render(scene, camera);
}
```

---

## 9. 总结

本模块介绍了 Three.js 的核心三要素：

1. **Scene**：场景容器，所有 3D 对象的根节点
2. **Camera**：相机，定义观察视角（透视 vs 正交）
3. **Renderer**：渲染器，将 3D 场景渲染为 2D 图像

以及渲染循环的基本实现方式：使用 `requestAnimationFrame` 实现动画循环。

**下一步**：模块 2 将介绍几何体与材质，学习如何创建各种形状和外观。
