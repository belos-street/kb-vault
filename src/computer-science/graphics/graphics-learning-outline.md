# 计算机图形学学习大纲（Web 图形方向 · 技术实战向）

> 以「从数学基础到 WebGPU 渲染器」为主线，覆盖变换与投影、光栅化、着色器、光照模型、纹理映射、光线追踪基础、GPU 编程七大核心模块。侧重 Web 平台图形技术（Canvas → WebGL → WebGPU），兼顾底层渲染原理。

---

## 📌 元信息

| 项目 | 说明 |
|------|------|
| **定位** | Web 图形技术实战向，兼顾渲染管线原理 |
| **目标读者** | 有线性代数基础、想深入 WebGL/WebGPU/可视化底层的前端/全栈工程师 |
| **前置知识** | 线性代数（向量、矩阵运算）、微积分基础、JavaScript/TypeScript |
| **实现语言** | TypeScript + GLSL/WGSL |
| **渲染 API** | Canvas 2D → WebGL 2.0 → WebGPU |
| **参考书** | GAMES101（闫令琪）/《Real-Time Rendering》/《Fundamentals of Computer Graphics》/ WebGPU Spec |
| **关联实践** | D3.js 可视化、Three.js、数据大屏、3D 编辑器 |

---

## 🎯 学习目标

完成本模块学习后，你应该能够：

1. 理解图形渲染管线全流程：顶点处理 → 光栅化 → 片元处理 → 帧缓冲
2. 掌握 2D/3D 变换（平移、旋转、缩放、投影）的矩阵表示与组合
3. 手写光栅化器：三角形填充、深度缓冲、抗锯齿
4. 编写 GLSL/WGSL 着色器，实现 Phong/PBR 光照模型
5. 理解色彩空间（sRGB/Linear/HDR）与 Gamma 校正对渲染正确性的影响
6. 理解纹理映射、Mipmap、法线贴图的原理与实现
7. 理解几何表示（Mesh/曲线/曲面）与基础动画技术（关键帧/骨骼/物理）
8. 理解光线追踪基本思想：射线-物体求交、递归反射/折射、BVH 加速
9. 使用 WebGPU 进行 GPU 计算（Compute Shader）
10. 掌握实时渲染性能优化手段：Draw Call 合批、Instancing、LOD、遮挡剔除
11. 能独立实现一个迷你软渲染器 + 一个 WebGPU 实时渲染 Demo

---

## 🗺️ 学习路径

| 阶段 | 章节 | 主题 | 产出 |
|------|------|------|------|
| **基础** | 第 1 章 | 图形学全景与数学基础（向量/矩阵/齐次坐标/色彩空间） | 向量/矩阵/齐次坐标笔记 + sRGB/Linear/HDR 色彩空间笔记 |
| **基础** | 第 2 章 | 变换与投影（MVP 矩阵） | 2D/3D 变换库实现 |
| **核心** | 第 3 章 | 光栅化与帧缓冲 | 软渲染器：三角形光栅化 + 深度缓冲 |
| **核心** | 第 4 章 | 着色器与光照模型 | GLSL 实现 Phong + Blinn-Phong（含 Gamma 校正） |
| **核心** | 第 5 章 | 纹理映射与材质 | 纹理采样 + Mipmap + 法线贴图 |
| **核心** | 第 6 章 | 几何建模与动画（曲线/曲面/关键帧/骨骼） | Bezier 曲线渲染 + 关键帧动画系统 |
| **进阶** | 第 7 章 | 实时渲染进阶（阴影/后处理/性能优化） | Shadow Mapping + HDR + Bloom + Instancing/LOD 实践 |
| **进阶** | 第 8 章 | 光线追踪基础 | 迷你 Ray Tracer（球体/平面 + 反射 + BVH） |
| **进阶** | 第 9 章 | GPU 架构与 Compute Shader | WebGPU Compute 并行计算实战 |
| **实战** | 第 10 章 | WebGPU 渲染器项目 | 完整渲染器：场景图 + PBR + 相机控制 |
| **实战** | 第 11 章 | 高性能 2D 渲染与粒子系统 | Canvas/WebGPU 粒子系统 + 路径渲染 + SDF 文字 |

---

## 📝 每篇笔记结构

```markdown
# 主题名

## 核心原理
数学推导 + 直觉解释

## 算法/管线流程
Mermaid flowchart 或伪代码

## 实现（TypeScript + GLSL/WGSL）
完整可运行代码

## 视觉效果
截图/GIF + 参数对比

## 性能考量
复杂度分析 + 优化手段

## 关联
- 前置章节
- 在渲染器项目中的应用位置
```

---

## 🔗 关联模块

| 关联 | 说明 |
|------|------|
| [algorithms/](../algorithms/) | 空间数据结构（BVH、四叉树）、几何算法 |
| [design-patterns/](../design-patterns/) | Composite（场景图）、Visitor（渲染遍历）、Strategy（渲染后端切换） |
| [computer-organization/](../computer-organization/) | GPU 并行架构、存储层次对渲染性能的影响 |
| [operating-system/](../operating-system/) | 显存管理、GPU 调度、帧同步（VSync） |
