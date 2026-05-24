# 02 — 从 React Web 到 React Native：核心差异全景

> 对应大纲：思维层 | 预计时间：1 天
> 面试可答：RN 和 React Web 共享同一套组件模型（Props/State/Hooks），但渲染层从 DOM 变成了 Native Widget，样式从 CSS 变成了 StyleSheet，路由从 URL 变成了 Native Navigator。

***

## 1. 总览：同样的 React，不同的世界

如果你已经会 React Web，学 RN 的核心工作不是"学新框架"，而是**理解两个世界的差异点**。

先看全局对比：

| 维度 | React Web | React Native |
|------|-----------|-------------|
| 渲染目标 | 浏览器 DOM | iOS/Android 原生组件 |
| 标签系统 | `<div>` `<span>` `<p>` `<img>` | `View` `Text` `Image` |
| 样式系统 | CSS（文件/模块/CSS-in-JS） | `StyleSheet.create()` |
| 布局方案 | Flexbox + Grid + Float + 定位 | **只有 Flexbox** |
| 路由 | 浏览器 URL + React Router | React Navigation（原生栈） |
| 事件系统 | DOM 事件（click/mouseover） | RN 手势系统 + Pressable |
| 存储 | localStorage / sessionStorage | AsyncStorage / MMKV |
| 网络 | Fetch / Axios（无 CORS 问题） | Fetch / Axios（有平台限制） |
| 调试 | Chrome DevTools | Metro + Flipper + Chrome DevTools |
| 热重载 | Webpack HMR / Vite HMR | Fast Refresh |

**不变的部分**：组件模型、Props/State、Hooks、Context、生命周期、虚拟 DOM Diffing —— 这些你已经会的知识**完全通用**。

***

## 2. 渲染层：DOM 没有了

### 2.1 Web 的渲染链路

```
React 组件 → Virtual DOM → 调和（Reconciliation）→ DOM 操作（document.createElement）
```

浏览器有 DOM API，React Web 通过 `react-dom` 把组件树映射为 DOM 节点。

### 2.2 RN 的渲染链路

```
React 组件 → Virtual DOM → 调和 → Bridge 序列化 → Native Widget（UIView / android.view.View）
```

RN 没有 DOM，通过 `react-native` 包把组件树映射为平台原生 Widget。JS 和 Native 之间的通信依赖 **JS Bridge**（异步 JSON 序列化），这是旧架构的性能瓶颈所在。2026 年的 RN 已默认启用 **New Architecture**（Fabric + JSI），通过 C++ 层直接操作 Shadow Tree，大幅缓解了序列化开销。详见 00 篇第 7 节。

### 2.3 实际代码对比

```tsx
// React Web
function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1>标题</h1>
      <p>正文内容</p>
      <img src="photo.png" alt="照片" />
    </div>
  );
}
```

```tsx
// React Native
import { View, Text, Image } from 'react-native';

function App() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>标题</Text>
      <Text>正文内容</Text>
      <Image source={require('./photo.png')} style={{ width: 200, height: 150 }} />
    </View>
  );
}
```

**核心差异**：
- `<div>` → `View`，`<h1>/<p>` → `Text`，`<img>` → `Image`
- 所有文字必须被 `Text` 包裹，**不能直接在 `View` 里写文字**
- 图片必须显式设置宽高，否则不显示

***

## 3. 标签系统：Web 标签 → RN 基础组件

这是 React Web 开发者最容易犯错的地方——习惯性地用 HTML 标签写代码。

### 3.1 核心映射表

| Web 标签 | RN 组件 | 关键区别 |
|---------|---------|---------|
| `<div>` | `View` | 无语义化，纯容器 |
| `<span>` / `<p>` / `<h1>` | `Text` | **所有文字必须嵌套在 Text 内** |
| `<img>` | `Image` | 必须指定宽高，`source` 替代 `src` |
| `<input>` | `TextInput` | 受控组件模式，无 placeholder 色彩自定义 |
| `<button>` | `Pressable` / `TouchableOpacity` | 无原生按钮样式，需自行定义 |
| `<ul>/<li>` | `FlatList` / `ScrollView` | 列表渲染完全不同的组件 |
| `<a>` | 无直接对应 | 用 `Pressable` + `navigation.navigate()` |

### 3.2 不能做的事

```tsx
// ❌ 错误：Text 不能嵌套 View（iOS 会崩溃）
<Text>
  你好 <View style={{ width: 10, height: 10, backgroundColor: 'red' }} />
</Text>

// ✅ 正确：View 内嵌 Text
<View>
  <Text>你好</Text>
  <View style={{ width: 10, height: 10, backgroundColor: 'red' }} />
</View>
```

```tsx
// ❌ 错误：View 内直接写文字（不会有显示）
<View>你好世界</View>

// ✅ 正确：文字必须被 Text 包裹
<View><Text>你好世界</Text></View>
```

***

## 4. 样式体系：CSS 没有了

### 4.1 从 CSS 到 StyleSheet

React Web 用 CSS 文件、CSS Modules 或 CSS-in-JS。RN 只有一种方案——`StyleSheet.create()`。

```tsx
// React Web：CSS 类名
<div className="card">
  <h2 className="title">标题</h2>
</div>
```

```tsx
// React Native：StyleSheet
import { View, Text, StyleSheet } from 'react-native';

<View style={styles.card}>
  <Text style={styles.title}>标题</Text>
</View>

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### 4.2 StyleSheet 的关键特点

| 特点 | 说明 |
|------|------|
| **对象语法** | 属性名用 camelCase（`fontSize` 而非 `font-size`） |
| **无级联** | 没有 CSS 选择器、没有继承（除 `Text` 内嵌 `Text` 外） |
| **无单位** | 数值默认是 dp（密度无关像素），不写 `px` |
| **没有 Grid** | 布局只能用 Flexbox |
| **没有伪类** | 没有 `:hover`、`:active`、`:focus`，交互状态需用组件 state 控制 |
| **没有媒体查询** | 响应式用 `useWindowDimensions()` 或 `Dimensions` API |
| **不支持百分比定位** | `position: absolute` 不能用 `left: 50%`，需配合 `Dimensions` 计算 |

### 4.3 样式合并

RN 中合并多个样式用数组：

```tsx
// ❌ Web 思维：className 拼接
<div className="card highlighted">...</div>

// ✅ RN 方式：数组合并
<View style={[styles.card, styles.highlighted]}>
```

```tsx
// 条件样式
<View style={[styles.card, isActive && styles.active]}>
```

***

## 5. 布局：Flexbox 是唯一选择

### 5.1 默认值不同

这是 Web 开发者最容易踩的第一个坑——RN 的 Flexbox 默认值跟 Web **不一样**。

| 属性 | Web 默认值 | RN 默认值 | 影响 |
|------|----------|----------|------|
| `flexDirection` | `row`（水平排列） | **`column`（垂直排列）** | 子元素默认从上往下排 |
| `display` | `block` | **`flex`** | 所有 View 默认都是 flex 容器 |
| `flex` | `0 auto` | **`0`** | 子元素不会自动撑满剩余空间 |

```tsx
// Web 中：子元素默认水平排列
<div style={{ display: 'flex' }}>
  <div>A</div>
  <div>B</div>
  <div>C</div>
</div>
// 结果：A B C（水平排列）

// RN 中：子元素默认垂直排列
<View>
  <Text>A</Text>
  <Text>B</Text>
  <Text>C</Text>
</View>
// 结果：
// A
// B
// C
```

### 5.2 Flex 属性速查

```tsx
// 常见的居中布局
<View style={{
  flex: 1,                         // 占满父容器剩余空间
  justifyContent: 'center',        // 主轴居中（column 时是垂直居中）
  alignItems: 'center',            // 交叉轴居中（column 时是水平居中）
}}>
  <Text>居中内容</Text>
</View>
```

```tsx
// 常见的左右布局（导航栏）
<View style={{
  flexDirection: 'row',            // 切换为水平排列
  justifyContent: 'space-between', // 两端对齐
  alignItems: 'center',
  padding: 16,
}}>
  <Text>返回</Text>
  <Text>标题</Text>
  <Text>更多</Text>
</View>
```

### 5.3 没有 Grid

Web 中常用的 `display: grid` 在 RN 中不存在。复杂的网格布局需要用嵌套的 Flexbox 或第三方库（如 `react-native-easy-grid`）模拟。

***

## 6. 路由：URL 没有了

### 6.1 核心区别

| 维度 | React Web | React Native |
|------|-----------|-------------|
| 导航基础 | 浏览器 URL（`window.location`） | 原生导航栈（Native Stack） |
| 主流库 | React Router / Next.js Router | React Navigation |
| 页面切换效果 | CSS Transition / Animate | 原生过渡动画（push/pop） |
| 深链接 | URL 直接访问 | Deep Link / Universal Link 配置 |
| 返回行为 | 浏览器后退按钮 | 物理返回键（Android）/ 手势滑动返回（iOS） |

### 6.2 代码对比

```tsx
// React Web（React Router）
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
  <Link to="/profile">去个人页</Link>
</BrowserRouter>
```

```tsx
// React Native（React Navigation）
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

<NavigationContainer>
  <Stack.Navigator>
    <Stack.Screen name="Home" component={Home} />
    <Stack.Screen name="Profile" component={Profile} />
  </Stack.Navigator>
</NavigationContainer>

// 在组件内导航
navigation.navigate('Profile');
```

**关键思维转变**：
- Web 的路由是"URL 驱动"的，RN 的导航是"栈驱动"的
- Web 可以直接输入 URL 跳转，RN 只能通过代码 `navigate`
- RN 有物理返回键和手势返回，需要处理"后退"逻辑（`navigation.goBack()`）

***

## 7. 事件系统：DOM 事件 → 手势系统

### 7.1 点击事件

Web 中最常用的 `onClick`，在 RN 中需要换成专门的可点击组件：

```tsx
// React Web
<button onClick={() => alert('clicked')}>点击我</button>

// React Native
import { Pressable, Alert } from 'react-native';

<Pressable onPress={() => Alert.alert('clicked')}>
  <Text>点击我</Text>
</Pressable>
```

### 7.2 常用交互组件对比

| Web | RN | 特点 |
|-----|-----|------|
| `onClick` | `Pressable.onPress` | 最通用的点击方案 |
| `onMouseEnter/Leave` | `Pressable.onHoverIn/Out` | 仅支持键盘/鼠标设备 |
| `onSubmit`（表单） | `TextInput.onSubmitEditing` | 键盘提交时触发 |
| `onScroll` | `ScrollView.onScroll` | 滚动事件 |
| `onDrag` | PanResponder / react-native-gesture-handler | 拖拽需要手势库 |

### 7.3 RN 的手势处理

RN 中没有 `mousedown` / `mousemove` / `mouseup` 这套 DOM 事件。复杂手势需要用 **PanResponder**（内置）或 **react-native-gesture-handler**（第三方推荐）：

```tsx
// 简单的手势处理用 PanResponder
import { PanResponder } from 'react-native';

const panResponder = PanResponder.create({
  onStartShouldSetPanResponder: () => true,
  onPanResponderMove: (evt, gestureState) => {
    console.log('移动距离:', gestureState.dx, gestureState.dy);
  },
  onPanResponderRelease: () => {
    console.log('手势结束');
  },
});

<View {...panResponder.panHandlers}>
  <Text>拖拽我</Text>
</View>
```

**建议**：大部分场景用 `Pressable` 就够了，只有涉及拖拽、缩放、滑动等复杂手势时才需要 PanResponder 或 react-native-gesture-handler。

***

## 8. 存储：localStorage → AsyncStorage

### 8.1 对比

| 维度 | Web localStorage | AsyncStorage |
|------|-----------------|-------------|
| API | 同步 `setItem / getItem` | **异步** `await AsyncStorage.setItem()` |
| 容量 | ~5-10MB | ~6MB（Android SQLite 限制） |
| 存储位置 | 浏览器内部 | iOS: NSUserDefaults / Android: SQLite |
| 数据类型 | 只能存字符串 | 只能存字符串（JSON 需手动序列化） |

### 8.2 代码对比

```tsx
// Web
localStorage.setItem('user', JSON.stringify({ name: 'Tom' }));
const user = JSON.parse(localStorage.getItem('user'));
```

```tsx
// React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

// 存
await AsyncStorage.setItem('user', JSON.stringify({ name: 'Tom' }));
// 取
const raw = await AsyncStorage.getItem('user');
const user = raw ? JSON.parse(raw) : null;
```

**关键转变**：AsyncStorage 是**全异步**的，所有读写操作必须 `await`。这是 Web 开发者容易忘的点。

***

## 9. 网络请求：几乎相同，细节不同

### 9.1 Fetch API

RN 内置了 `fetch`，用法跟浏览器完全一致：

```tsx
// 在 RN 中使用跟 Web 完全一样的 Fetch
const response = await fetch('https://api.example.com/users');
const data = await response.json();
```

### 9.2 差异点

| 维度 | Web | React Native |
|------|-----|-------------|
| CORS 限制 | 有（跨域需要服务端配合） | **无**（没有浏览器安全沙箱） |
| Cookie | 浏览器自动管理 | 需要手动用 `fetch` 的 `credentials` 或第三方库 |
| 请求拦截 | Axios 拦截器 | 同样支持 Axios，用法一致 |
| 网络状态 | `navigator.onLine` | `NetInfo` 库（`@react-native-community/netinfo`） |
| 证书固定 | 不支持 | 可以做 SSL Pinning（安全场景） |

**结论**：如果你用 Axios 在 Web 上请求数据，RN 中换一下 import 路径就能用，大部分代码可以复用。

***

## 10. 调试：Chrome DevTools → 多工具组合

### 10.1 调试方式对比

| 调试需求 | Web | React Native |
|---------|-----|-------------|
| 查看 Console 日志 | 浏览器 Console | Metro 终端 / Chrome DevTools |
| 网络请求 | Network 面板 | Flipper Network / Reactotron |
| 元素审查 | Elements 面板 | **没有**（RN 没有 DOM） |
| 性能分析 | Performance 面板 | React DevTools Profiler / systrace |
| 断点调试 | 直接打断点 | Chrome DevTools / VS Code 调试器 |

### 10.2 最常用的调试方式

```bash
# 1. Metro 终端看日志（最直接）
# 代码中 console.log 的输出直接显示在 Metro 终端

# 2. 打开 Chrome DevTools
# 在 Metro 终端按 j 打开调试器（需要 Debug 模式；新版 Fusebox 调试器快捷键可能不同，以 Metro 终端输出为准）

# 3. React DevTools（查看组件树）
npx react-devtools
```

### 10.3 RN 专属调试手段

```tsx
// 打开 RN 开发者菜单
// iOS 模拟器：Cmd + D
// Android 模拟器：Cmd + M（macOS）或 Ctrl + M（Windows）

// 菜单中的有用选项：
// - Reload：重新加载 JS Bundle
// - Debug：打开 Chrome DevTools
// - Show Perf Monitor：显示实时帧率和内存
// - Show Element Inspector：类似浏览器的元素审查（RN 内置简化版）
```

***

## 11. Web 开发者的高频思维陷阱

整理几个从 Web 转 RN 时最容易踩的认知坑：

| 陷阱 | Web 思维 | RN 正确做法 |
|------|---------|-----------|
| 直接写文字 | `<div>Hello</div>` | 必须 `<View><Text>Hello</Text></View>` |
| 忘记给图片设尺寸 | `<img src="x.png">` 自动按原图尺寸 | `Image` 不设宽高**不显示** |
| 用 CSS 类名 | `className="card"` | `style={styles.card}` |
| 百分比布局 | `width: 50%` 通用 | `width: '50%'` 在部分属性中不生效 |
| 继承字体样式 | 子元素自动继承 `font-family` | 除 `Text` 嵌套 `Text` 外，**样式不继承** |
| `onClick` | 最通用的事件 | RN 中用 `Pressable.onPress` |
| `position: fixed` | 固定在视口 | **不存在**，用绝对定位 + 屏幕尺寸模拟 |
| `z-index` | 直接设置层级 | RN 支持 `zIndex`，但 Android 上 `elevation` 阴影会影响层叠顺序 |
| 同步读 localStorage | `localStorage.getItem()` | AsyncStorage 是**全异步**的 |

***

## ✏️ 练习

### 练习 1：Web → RN 组件翻译

将以下 Web 组件翻译为 RN 组件：

```tsx
// Web 版本
function UserCard() {
  return (
    <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <img src="avatar.png" style={{ width: 60, height: 60, borderRadius: 30 }} />
      <h2 style={{ marginTop: 8 }}>张三</h2>
      <p style={{ color: '#888' }}>前端工程师 · 3年经验</p>
      <button onClick={() => alert('已关注')}>关注</button>
    </div>
  );
}
```

**要求**：
1. 用 RN 基础组件（View / Text / Image / Pressable）重写
2. 用 `StyleSheet.create` 定义样式
3. 在模拟器上验证显示效果

**提示**：
- `<div>` → `View`
- `<h2>` / `<p>` → `Text`（用 `fontSize` 和 `fontWeight` 区分大小）
- `<button>` → `Pressable` + `Text`
- 圆角头像：`Image` 设 `borderRadius: 30`

**预期效果**：一张居中的用户卡片，显示头像、姓名、简介和关注按钮，点击按钮弹出 Alert。

### 练习 2：默认值实验

创建一个 `View` 放 3 个子 `View`（各设不同颜色和宽高），观察默认排列方向，然后加上 `flexDirection: 'row'` 看变化。

```tsx
import { View, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.box1} />
      <View style={styles.box2} />
      <View style={styles.box3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  box1: { width: 80, height: 80, backgroundColor: 'tomato' },
  box2: { width: 80, height: 80, backgroundColor: 'skyblue' },
  box3: { width: 80, height: 80, backgroundColor: 'limegreen' },
});
```

**实验步骤**：
1. 运行代码，观察默认排列（垂直）
2. 给 `container` 加 `flexDirection: 'row'`，观察变化（水平）
3. 再加 `justifyContent: 'space-around'`，观察分布

***

## 📝 面试回答模板

> **问：React Native 和 React Web 的核心区别是什么？**
>
> 最大的区别在渲染层。React Web 通过 react-dom 把组件树映射为浏览器 DOM 节点，RN 通过 react-native 映射为 iOS/Android 的原生 Widget。这导致了三个连锁变化：第一，标签系统完全不同——div 变成 View，span/p 变成 Text，img 变成 Image；第二，样式系统从 CSS 变成 StyleSheet，没有级联、没有继承（Text 嵌套 Text 除外）、没有 Grid；第三，路由从 URL 驱动变成了原生导航栈驱动。
>
> 但组件模型是完全通用的——Props、State、Hooks、Context、生命周期这些 React 核心概念在 RN 中完全一样，这也是前端工程师能快速上手 RN 的原因。

> **问：RN 的 Flexbox 跟 Web 的 Flexbox 有什么不同？**
>
> 语法完全一样，但有两个关键的默认值不同。第一，`flexDirection` 默认是 `column`（Web 默认是 `row`），所以 RN 中子元素默认垂直排列；第二，所有 View 默认就是 `display: flex`，不需要手动声明。另外 RN 中没有 CSS Grid，Flexbox 是唯一的布局方案。

> **问：RN 中怎么做样式？**
>
> 用 `StyleSheet.create()` 定义样式对象，通过 `style` 属性绑定到组件上。属性名用 camelCase，数值默认是 dp 单位。多个样式用数组合并 `[styles.a, styles.b]`，条件样式用 `[styles.a, isActive && styles.active]`。注意 RN 的样式没有级联和选择器，除了 Text 内嵌 Text 之外，子元素不会继承父元素的样式，每个组件都需要显式定义自己的样式。