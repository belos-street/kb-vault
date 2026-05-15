根据你"快速上手、面试能答、做出交互应用"的目标，这份大纲把 Konva.js 学习拆解成 **6 个模块**，每天 1~2 小时，**约 10 天完成**。每个模块都对应到面试常问点，最后用一个**在线白板/画板** Demo 串联全部知识。

---

## 🎯 学习目标
- 理解 Konva 的分层架构和场景图
- 掌握图形绘制、拖拽、变换、事件处理
- 能实现画板、图层管理、撤销重做等功能
- 面试时能解释 Konva 与原生 Canvas/ fabric.js 的区别

---

## 📋 前置要求
- 熟悉 JavaScript ES6+
- 了解 Canvas 基本概念
- 有 DOM 事件处理基础

---

## 📚 模块详解

### 模块 1：Konva 核心概念与初始化（0.5 天）
**面试可答**：Konva 采用分层架构，Stage 包含 Layer，Layer 包含 Shape。

- `Stage`：顶层容器，绑定到 DOM 元素
- `Layer`：渲染层，每个 Layer 一个 Canvas
- `Group`：逻辑分组
- **练习**：创建一个带两个 Layer 的画布

---

### 模块 2：基础图形与样式（1 天）
**面试可答**：Konva 内置 Rect、Circle、Line 等图形类，支持链式调用。

- `Rect`、`Circle`、`Ellipse`、`Line`、`Polygon`
- `Text`、`Image`
- 样式属性：`fill`、`stroke`、`strokeWidth`、`opacity`
- 链式调用风格
- **练习**：绘制一个简单的房子（矩形+三角形+圆形）

---

### 模块 3：变换与拖拽（1 天）
**面试可答**：`draggable: true` 启用拖拽，`Transformer` 实现缩放旋转。

- `draggable` 属性
- `Konva.Transformer`：可视化变换控件
- `scaleX`、`scaleY`、`rotation`
- 约束拖拽范围
- **练习**：创建可拖拽、可缩放的图片

---

### 模块 4：事件系统（1 天）
**面试可答**：Konva 事件系统类似 DOM，支持冒泡，有精确的像素级命中检测。

- `on()` 绑定事件
- 事件类型：`click`、`dblclick`、`mouseover`、`mouseout`、`dragstart`、`dragend`
- 事件冒泡：`e.target` vs `e.currentTarget`
- `getIntersection()` 碰撞检测
- **练习**：点击图形变色，拖拽结束记录位置

---

### 模块 5：序列化与导出（0.5 天）
**面试可答**：`toJSON()` 序列化为 JSON，`toDataURL()` 导出图片。

- `stage.toJSON()` 序列化
- `Stage.create(json)` 反序列化
- `toDataURL()` 导出为图片
- 保存/加载功能实现
- **练习**：实现画板的保存和加载

---

### 模块 6：进阶功能与实战整合（2 天）
**面试可答**：撤销重做用命令模式，图层管理用 Layer 数组。

- 命令模式实现撤销/重做
- 图层管理与切换
- 自定义图形
- 性能优化：`batchDraw()`、`listening: false`
- **完整项目**：见下方实践项目

---

## 🕹️ 实践项目：在线白板/画板

**功能清单**（覆盖全部核心 API）：
- 工具栏：选择、画笔、矩形、圆形、文字
- 拖拽移动与缩放旋转
- 撤销/重做（Ctrl+Z / Ctrl+Y）
- 图层管理面板
- 导出为 PNG/JPEG
- 保存/加载项目（JSON）

**项目结构建议**：
```
/js
  main.js         // 初始化 Stage，管理全局状态
  Toolbar.js      // 工具栏逻辑
  Canvas.js       // 绘图逻辑
  History.js      // 撤销重做
  LayerPanel.js   // 图层管理
  Export.js       // 导出功能
```

**制作时间**：3~5 天（每天 1-2 小时）

---

## 🗓️ 总时间线（每天 1-2 小时）

| 时间段 | 内容 | 积累成果 |
|--------|------|----------|
| 第 1 天 | 模块 1+2 | Stage/Layer 架构、基础图形 |
| 第 2-3 天 | 模块 3+4 | 变换、拖拽、事件 |
| 第 4 天 | 模块 5 | 序列化、导出 |
| 第 5-10 天 | 模块 6 + 画板项目 | 撤销重做、完整应用 |

---

## ✅ 完成标准
- 能独立用 Konva 实现画板核心功能
- 能解释 Konva 的分层架构和事件系统
- 理解 Konva 与原生 Canvas、fabric.js 的差异
- 面试时能画出 Konva 的对象模型

---

## 🆚 Konva vs fabric.js vs 原生 Canvas 面试对比

| 维度 | Konva | fabric.js | 原生 Canvas |
|------|-------|-----------|-------------|
| 对象模型 | 有 | 有 | 无 |
| 拖拽支持 | 内置 | 内置 | 需手动实现 |
| 变换控件 | Transformer | 内置 | 无 |
| 分层支持 | Layer | 无 | 无 |
| 序列化 | JSON | JSON/SVG | 无 |
| 性能 | 高 | 中 | 最高 |
| 学习成本 | 低 | 中 | 高 |
