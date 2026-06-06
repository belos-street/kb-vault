根据你"快速上手、面试能答、做出 3D 效果"的目标，这份大纲把 Three.js 学习拆解成 **7 个模块**，每天 1~2 小时，**约两周（14 天）完成**。每个模块都对应到面试常问点，最后用一个**3D 产品展示器** Demo 串联全部知识。

---

## 🎯 学习目标
- 理解 Three.js 的核心三要素：场景、相机、渲染器
- 掌握几何体、材质、光照、动画的基本用法
- 能实现 3D 模型加载、交互、动画效果
- 面试时能解释 WebGL 与 Three.js 的关系

---

## 📋 前置要求
- 熟悉 JavaScript ES6+
- 了解基本的 3D 坐标系概念（x、y、z 轴）
- 有 Canvas 或 DOM 编程经验

---

## 📚 模块详解

### 模块 1：核心三要素与第一个场景（0.5 天）
**面试可答**：Three.js 核心是 Scene + Camera + Renderer，Scene 是容器，Camera 定义视角，Renderer 负责渲染。

- `Scene`：场景容器
- `Camera`：`PerspectiveCamera`（透视）vs `OrthographicCamera`（正交）
- `Renderer`：`WebGLRenderer`
- `requestAnimationFrame` 渲染循环
- **练习**：创建一个带旋转立方体的场景

---

### 模块 2：几何体与材质（1.5 天）
**面试可答**：几何体定义形状，材质定义外观，两者组合成 Mesh。纹理贴图让材质更真实。

- 几何体：`BoxGeometry`、`SphereGeometry`、`PlaneGeometry`、`CylinderGeometry`
- 材质：`MeshBasicMaterial`（无光照）、`MeshStandardMaterial`（PBR）
- 材质属性：`color`、`wireframe`、`opacity`、`side`
- 纹理贴图：`TextureLoader` 加载图片纹理
- UV 映射：理解纹理坐标如何映射到几何体表面
- 纹理属性：`wrapS`、`wrapT`、`repeat`、`offset`
- `Mesh` 组合几何体与材质
- **练习**：创建多个不同材质的几何体，给立方体贴上纹理

---

### 模块 3：光照系统（1 天）
**面试可答**：Three.js 支持环境光、点光源、平行光、聚光灯等。

- `AmbientLight`：环境光，均匀照亮所有物体
- `DirectionalLight`：平行光，模拟太阳
- `PointLight`：点光源，向四周发光
- `SpotLight`：聚光灯，锥形光束
- 阴影：`castShadow`、`receiveShadow`
- **练习**：创建一个带阴影的场景

---

### 模块 4：相机控制与交互（1 天）
**面试可答**：`OrbitControls` 实现轨道控制，支持旋转、缩放、平移。

- `OrbitControls`：轨道控制器
- 鼠标交互：旋转、缩放、平移
- `Raycaster`：射线检测，实现点击选中物体
- 触摸设备支持
- **练习**：添加鼠标控制，点击物体高亮

---

### 模块 5：模型加载（1.5 天）
**面试可答**：Three.js 支持 glTF、OBJ、FBX 等格式，glTF 是推荐格式。Draco 压缩可大幅减小模型体积。

- `GLTFLoader`：加载 glTF/GLB 模型
- `OBJLoader`：加载 OBJ 模型
- 模型加载流程与错误处理
- 加载进度监听：`onProgress` 回调实现进度条
- Draco 压缩：使用 `DRACOLoader` 解压 glTF 模型
- 模型动画：`AnimationMixer`
- **练习**：加载一个 3D 模型并播放动画，实现加载进度条

---

### 模块 6：动画与特效（1.5 天）
**面试可答**：`requestAnimationFrame` 驱动动画，`GSAP` 可做复杂补间，`EffectComposer` 实现后处理特效。

- `requestAnimationFrame` 渲染循环
- 对象动画：位移、旋转、缩放
- 动画库集成：`GSAP` 实现复杂补间动画
- 粒子系统：`Points`、`BufferGeometry`
- 后处理：`EffectComposer`、`UnrealBloomPass`（泛光）
- **练习**：使用 GSAP 实现模型旋转动画，创建粒子效果

---

### 模块 7：进阶技巧与实战整合（2.5 天）
**面试可答**：性能优化用实例化渲染、LOD，响应式需监听 resize。Web Workers 可实现离屏渲染。

- 响应式：监听 `resize` 事件
- 性能优化：`InstancedMesh`、LOD、`dispose()` 内存管理
- GUI 控制：`lil-gui`
- HDR 环境贴图
- 调试工具：Chrome DevTools Three.js 插件、Spector.js
- Web Workers：离屏渲染、多线程计算（进阶）
- **完整项目**：见下方实践项目

---

## 🕹️ 实践项目：3D 产品展示器

**功能清单**（覆盖全部核心 API）：
- 加载 3D 产品模型（glTF）
- 轨道控制：旋转、缩放查看
- 点击部件高亮显示名称
- 材质/颜色切换
- 动画展示（自动旋转、爆炸视图）
- 响应式适配

**项目结构建议**：
```
/js
  main.js         // 初始化场景、相机、渲染器
  Scene.js        // 场景管理
  Model.js        // 模型加载与管理
  Controls.js     // 交互控制
  UI.js           // 界面交互
  Animation.js    // 动画管理
```

**制作时间**：5~7 天（每天 1-2 小时），可与模块 7 合并进行。

---

## 🗓️ 总时间线（每天 1-2 小时）

| 时间段 | 内容 | 积累成果 |
|--------|------|----------|
| 第 1-2 天 | 模块 1+2 | Scene/Camera/Renderer、几何体材质、纹理贴图 |
| 第 3-4 天 | 模块 3+4 | 光照阴影、相机控制 |
| 第 5-6 天 | 模块 5 | 模型加载、Draco 压缩 |
| 第 7-8 天 | 模块 6 | 动画、GSAP、粒子效果 |
| 第 9-14 天 | 模块 7 + 产品展示器 | 性能优化、调试工具、完整项目 |

---

## ✅ 完成标准
- 能独立用 Three.js 创建 3D 场景并加载模型
- 能解释 Scene、Camera、Renderer 的关系
- 理解 WebGL 与 Three.js 的抽象层级
- 面试时能画出 Three.js 的渲染流程

---

## 🆚 Three.js vs Babylon.js vs 原生 WebGL 面试对比

| 维度 | Three.js | Babylon.js | 原生 WebGL |
|------|----------|------------|------------|
| 定位 | 通用 3D 库 | 游戏引擎 | 底层 API |
| 学习曲线 | 中等 | 中等 | 陡峭 |
| 生态 | 最丰富 | 丰富 | 无 |
| 性能 | 高 | 高 | 最高 |
| 适用场景 | 可视化、展示、轻量游戏 | 游戏、XR | 极致性能需求 |
| 社区 | 最大 | 较大 | - |
| 物理引擎 | 需第三方 | 内置 | 无 |

---

## 💡 WebGL 基础知识（面试常问）

**WebGL 是什么**：
- 基于 OpenGL ES 的浏览器 3D API
- 通过 Canvas 元素访问
- 使用 GLSL 着色器语言

**渲染管线简述**：
1. 顶点着色器：处理顶点位置
2. 图元装配：连接顶点成三角形
3. 光栅化：三角形转为片元
4. 片元着色器：计算像素颜色
5. 帧缓冲输出

**Three.js 的价值**：
- 封装了复杂的 WebGL API
- 提供高级抽象：Scene、Mesh、Material
- 内置数学库：Vector3、Matrix4、Quaternion
- 处理了兼容性和性能优化
