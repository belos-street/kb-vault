# 04 — 样式系统与 Flexbox 布局

> 对应大纲：应用层 | 预计时间：2 天（含练习）
> 面试可答：RN 用 StyleSheet.create() 定义样式，属性名 camelCase，数值默认 dp 单位，没有级联和选择器。布局只能用 Flexbox（没有 Grid），默认 flexDirection 是 column（不是 Web 的 row）。RN 的样式本质上是 JS 对象，运行时提交给原生层。

---

## 1. StyleSheet 的本质

RN 的样式不是 CSS——它是一套 JavaScript 对象，最终会被提交给原生层渲染。

### 1.1 从 CSS 到 StyleSheet

```tsx
// Web CSS
.card {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

// RN StyleSheet
const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    // 阴影需要分开写（见下文）
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,  // Android 阴影用 elevation
  },
});
```

### 1.2 StyleSheet vs 普通对象

```tsx
// 方式一：StyleSheet.create（推荐）
const styles = StyleSheet.create({
  title: { fontSize: 18, color: '#333' },
});
<Text style={styles.title}>标题</Text>

// 方式二：直接写对象（可行但不推荐）
<Text style={{ fontSize: 18, color: '#333' }}>标题</Text>
```

`StyleSheet.create()` 在运行时会将样式对象注册到原生层，获得一个数字 ID，后续引用这个 ID 而非对象本身。这比每次创建新对象更高效，尤其在列表渲染中差异明显。

| 方式 | 内存 | 重渲染性能 | 可读性 |
|------|------|----------|--------|
| `StyleSheet.create()` | 更优（复用注册的样式 ID） | 更好（引用不变） | 好 |
| 内联对象 | 每次创建新对象 | 可能导致不必要重渲染 | 简单场景可接受 |

### 1.3 与 CSS 的核心差异

| 维度 | CSS | RN StyleSheet |
|------|-----|--------------|
| 属性名 | `font-size`（kebab-case） | `fontSize`（camelCase） |
| 单位 | `16px` / `1rem` / `50%` | `16`（纯数值 = dp），字符串 `'50%'` 部分属性支持 |
| 继承 | 子元素继承父元素样式 | **不继承**（Text 嵌套 Text 除外） |
| 选择器 | `.class` / `#id` / `div > p` | **没有**，只能通过 style 属性绑定 |
| 伪类 | `:hover` / `:active` / `:focus` | **没有**，交互状态用组件 state 控制 |
| 媒体查询 | `@media (max-width: 768px)` | **没有**，用 `useWindowDimensions()` |
| Grid | `display: grid` | **没有**，只有 Flexbox |
| 继承字体 | `body { font-family: ... }` 自动继承 | 每个 Text 都要单独设 |

---

## 2. 数值与单位

### 2.1 dp（密度无关像素）

RN 中的纯数值代表 **dp（density-independent pixels）**，这是 Android 的标准单位，iOS 中对应 pt。它的特点是：在不同像素密度的设备上，物理大小基本一致。

```tsx
// 这个按钮在 1x、2x、3x 屏幕上看起来一样大
<View style={{ width: 100, height: 44 }}>
  <Text>按钮</Text>
</View>
```

### 2.2 百分比

主流布局属性都支持百分比字符串（类型即 `DimensionValue`：number | `${number}%`）：

```tsx
// ✅ 支持百分比的属性
{ width: '50%' }
{ height: '100%' }
{ top: '50%', left: '50%' }  // 定位偏移同样支持百分比
{ padding: '10%' }           // 支持但不常用
{ borderRadius: '50%' }      // 支持（相对视图自身尺寸）

// ❌ 不支持百分比的属性
{ fontSize: '120%' }         // 不生效
```

> **注意**：百分比相对于**父容器**的尺寸（borderRadius 例外，相对视图自身），不是相对于屏幕。做圆形头像时，`borderRadius: width / 2` 依然是最稳妥的写法。

### 2.3 字符串值

某些属性只能用字符串：

```tsx
{ fontWeight: 'bold' }       // 'normal' | 'bold' | '100'-'900'
{ textAlign: 'center' }      // 'left' | 'center' | 'right'
{ position: 'absolute' }     // 'relative' | 'absolute'
{ display: 'flex' }          // 'flex' | 'none'
```

---

## 3. 阴影：iOS 和 Android 的差异

阴影是 RN 中最烦人的跨端差异之一——iOS 和 Android 用完全不同的属性。

### 3.1 iOS 阴影

```tsx
{
  shadowColor: '#000',           // 阴影颜色
  shadowOffset: { width: 0, height: 2 },  // 阴影偏移
  shadowOpacity: 0.15,           // 阴影透明度（0-1）
  shadowRadius: 6,               // 阴影模糊半径
}
```

### 3.2 Android 阴影

```tsx
{
  elevation: 4,                  // 海拔高度（0-24），数字越大阴影越大
}
```

> ⚠️ `elevation` 的阴影颜色**不可自定义**（固定黑色系），旧资料中「Android 8.0+ 用 shadowColor 自定义 elevation 阴影颜色」的说法不成立。
>
> **新方案**：RN 0.77+（新架构）提供了统一的 `boxShadow` 属性，语法接近 CSS：`boxShadow: '0 2px 4px rgba(0,0,0,0.1)'`，支持自定义颜色；outset 阴影在 Android 上要求 9+（API 28）。新项目可以优先使用 `boxShadow`，老项目兼容期继续用双属性写法。

### 3.3 统一写法

```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    // iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android
    elevation: 3,
  },
});
```

> **注意**：Android 的 `elevation` 要求组件必须有 `backgroundColor`，否则阴影不显示。同时 `elevation` 会影响 Android 上的层叠顺序（类似 z-index）。

---

## 4. Flexbox 布局：唯一的选择

RN 中没有 CSS Grid、没有 Float、没有 `display: table`——Flexbox 是唯一的布局方案。好消息是 Flexbox 足够强大，能覆盖绝大多数布局需求。

### 4.1 Web vs RN Flexbox 默认值差异

这是从 Web 转 RN 最容易踩的坑：

| 属性 | Web 默认值 | RN 默认值 | 影响 |
|------|----------|----------|------|
| `flexDirection` | `row` | **`column`** | 子元素默认垂直排列 |
| `display` | `block` | **`flex`** | 所有 View 默认就是 flex 容器 |
| `flex` | `0 auto` | **`0`** | 子元素不会自动撑满 |

```tsx
// Web：子元素默认水平排列
<div style={{ display: 'flex' }}>
  <div>A</div> <div>B</div> <div>C</div>
</div>
// 结果：A B C

// RN：子元素默认垂直排列
<View>
  <Text>A</Text> <Text>B</Text> <Text>C</Text>
</View>
// 结果：
// A
// B
// C
```

### 4.2 主轴与交叉轴

Flexbox 的核心概念是**主轴**和**交叉轴**：

```
flexDirection: 'column'（默认）      flexDirection: 'row'
                                          
主轴 ↓                                 主轴 →
┌─────────────────┐                 ┌─────────────────┐
│  ↘ 交叉轴       │                 │  Item A │ Item B │
│  Item A         │                 │         │        │
│  Item B         │                 └─────────────────┘
│  Item C         │                   ↑ 交叉轴 ↓
└─────────────────┘
```

- `justifyContent` 控制**主轴**方向的对齐
- `alignItems` 控制**交叉轴**方向的对齐
- `flexDirection` 决定哪个方向是主轴

---

## 5. Flexbox 核心属性详解

### 5.1 flexDirection：主轴方向

```tsx
// column（默认）：从上到下
{ flexDirection: 'column' }

// row：从左到右
{ flexDirection: 'row' }

// column-reverse：从下到上
{ flexDirection: 'column-reverse' }

// row-reverse：从右到左
{ flexDirection: 'row-reverse' }
```

### 5.2 justifyContent：主轴对齐

只在 `flexDirection: 'row'` 时演示（column 时效果在垂直方向）：

```tsx
// flex-start（默认）：靠起点排列
// |[A][B][C]         |

// center：居中排列
// |    [A][B][C]     |

// flex-end：靠终点排列
// |         [A][B][C]|

// space-between：两端对齐，中间等距
// |[A]    [B]    [C]|

// space-around：每个元素两侧等距
// | [A]  [B]  [C]  |

// space-evenly：所有间距完全相等
// |  [A]  [B]  [C]  |
```

```tsx
import { View, StyleSheet } from 'react-native';

function JustifyContentDemo() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* 两端对齐的导航栏 */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 44,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        borderRadius: 8,
      }}>
        {/* 左侧 */}
        <View style={{ width: 60, height: 24, backgroundColor: '#ddd', borderRadius: 4 }} />
        {/* 中间 */}
        <View style={{ width: 100, height: 24, backgroundColor: '#ddd', borderRadius: 4 }} />
        {/* 右侧 */}
        <View style={{ width: 60, height: 24, backgroundColor: '#ddd', borderRadius: 4 }} />
      </View>
    </View>
  );
}
```

### 5.3 alignItems：交叉轴对齐

```tsx
// stretch（默认）：拉伸填满交叉轴（前提是没设宽/高）
// flex-start：靠交叉轴起点
// center：交叉轴居中
// flex-end：靠交叉轴终点
// baseline：按文字基线对齐

// 最常见的居中模式
{
  flex: 1,
  justifyContent: 'center',  // 主轴居中
  alignItems: 'center',      // 交叉轴居中
}
```

### 5.4 alignSelf：单个子元素覆盖

```tsx
<View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
  <Text style={{ alignSelf: 'flex-end' }}>我会单独靠底部</Text>
  <Text>其他元素靠顶部</Text>
</View>
```

### 5.5 flex：弹性伸缩

`flex` 决定子元素如何分配父容器的剩余空间：

```tsx
// 三等分布局
<View style={{ flexDirection: 'row', height: 100 }}>
  <View style={{ flex: 1, backgroundColor: 'tomato' }} />
  <View style={{ flex: 1, backgroundColor: 'skyblue' }} />
  <View style={{ flex: 1, backgroundColor: 'limegreen' }} />
</View>

// 侧边栏 + 内容区
<View style={{ flexDirection: 'row', flex: 1 }}>
  <View style={{ width: 80, backgroundColor: '#f0f0f0' }} />
  <View style={{ flex: 1, backgroundColor: '#fff' }} />
</View>

// 头部固定 + 内容自适应 + 底部固定
<View style={{ flex: 1 }}>
  <View style={{ height: 56, backgroundColor: '#007AFF' }} />
  <View style={{ flex: 1, backgroundColor: '#fff' }} />
  <View style={{ height: 49, backgroundColor: '#f8f8f8' }} />
</View>
```

### 5.6 flexBasis / flexGrow / flexShrink

这三个属性是 `flex` 的细分控制：

| 属性 | 说明 | 等价于 CSS |
|------|------|-----------|
| `flex: N` | `flexGrow: N, flexShrink: 1, flexBasis: 0` 的简写 | `flex: N` |
| `flexBasis` | 初始尺寸（优先于 width/height） | `flex-basis` |
| `flexGrow` | 放大比例（默认 0，不放大） | `flex-grow` |
| `flexShrink` | 缩小比例（默认 1，会缩小） | `flex-shrink` |

```tsx
// 等宽三列（等价于 flex: 1）
{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }

// 固定宽度 + 弹性宽度
{ flexBasis: 100 }  // 初始 100dp
{ flexGrow: 1 }     // 剩余空间全部给它
```

### 5.7 gap：间距

RN 0.71+ 支持 `gap`、`rowGap`、`columnGap`：

```tsx
// 子元素间距 12dp
<View style={{ flexDirection: 'row', gap: 12 }}>
  <View style={{ width: 80, height: 80, backgroundColor: 'tomato' }} />
  <View style={{ width: 80, height: 80, backgroundColor: 'skyblue' }} />
  <View style={{ width: 80, height: 80, backgroundColor: 'limegreen' }} />
</View>

// 网格间距
<View style={{ gap: 12 }}>
  <View style={{ flexDirection: 'row', gap: 12 }}>
    <View style={{ flex: 1, height: 80, backgroundColor: 'tomato' }} />
    <View style={{ flex: 1, height: 80, backgroundColor: 'skyblue' }} />
  </View>
  <View style={{ flexDirection: 'row', gap: 12 }}>
    <View style={{ flex: 1, height: 80, backgroundColor: 'limegreen' }} />
    <View style={{ flex: 1, height: 80, backgroundColor: 'gold' }} />
  </View>
</View>
```

---

## 6. 绝对定位与相对定位

### 6.1 position 属性

RN 支持的定位模式：

| 值 | 说明 |
|---|------|
| `relative`（默认） | 在正常文档流中，配合 `top/right/bottom/left` 偏移 |
| `absolute` | 脱离文档流，相对于**父容器**定位（RN 没有"最近的已定位祖先"概念，始终相对父容器） |
| `static` | RN 0.74 起（Yoga 3，新架构）新增，行为对齐 CSS：元素忽略 `top/right/bottom/left` 偏移，且不作为 absolute 子元素的定位参照 |

> **注意**：RN 没有 `position: fixed`。要实现固定定位（如悬浮按钮），需要配合 `position: 'absolute'` + 屏幕尺寸计算（详见 10 篇 §3.3 的适用前提）。

### 6.2 绝对定位居中

```tsx
// 居中的 badge
<View style={{ position: 'relative', width: 60, height: 60 }}>
  <Image source={require('./avatar.png')} style={{ width: 60, height: 60 }} />
  <View style={{
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <Text style={{ color: '#fff', fontSize: 12 }}>3</Text>
  </View>
</View>
```

### 6.3 StyleSheet.absoluteFillObject

RN 提供了一个快捷属性，等价于 `{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }`：

```tsx
// 全屏背景图
<View style={{ flex: 1 }}>
  <Image
    source={require('./bg.jpg')}
    style={StyleSheet.absoluteFillObject}
    resizeMode="cover"
  />
  <Text style={{ color: '#fff', fontSize: 24 }}>前景内容</Text>
</View>
```

---

## 7. 样式合并与条件样式

### 7.1 数组合并

```tsx
// 合并多个样式
<View style={[styles.card, styles.highlighted]} />

// 后面的覆盖前面的（如果有同名属性）
<View style={[styles.text, { color: 'red' }]} />

// 数组内可以有 falsy 值（会被忽略）
<View style={[styles.card, isActive && styles.active, null, undefined]} />
```

### 7.2 条件样式

```tsx
function Tag({ label, variant }) {
  return (
    <View style={[
      styles.tag,
      variant === 'success' && styles.tagSuccess,
      variant === 'error' && styles.tagError,
    ]}>
      <Text style={[
        styles.tagText,
        variant === 'success' && styles.tagTextSuccess,
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag:            { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagSuccess:     { backgroundColor: '#d4edda' },
  tagError:       { backgroundColor: '#f8d7da' },
  tagText:        { fontSize: 12 },
  tagTextSuccess: { color: '#155724' },
});
```

### 7.3 动态样式（运行时计算）

```tsx
function ProgressBar({ percent }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  fill:  { height: 8, backgroundColor: '#007AFF', borderRadius: 4 },
});
```

> 注意：频繁变化的样式（如动画属性）推荐用 `Animated` 或 `Reanimated` 而非 setState + style，因为 setState 走 JS 线程会卡顿。

---

## 8. 响应式布局

RN 没有媒体查询，响应式布局需要用 JS 方案。

### 8.1 获取屏幕尺寸

```tsx
import { useWindowDimensions, Dimensions } from 'react-native';

// 方式一：Hooks（推荐，窗口变化时自动更新）
function MyComponent() {
  const { width, height } = useWindowDimensions();
  return <Text>屏幕宽度: {width}</Text>;
}

// 方式二：静态 API（不会响应窗口变化）
const { width, height } = Dimensions.get('window');
```

### 8.2 常见响应式模式

```tsx
// 根据屏幕宽度切换布局
function ResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  return (
    <View style={{ flex: 1, flexDirection: isWide ? 'row' : 'column' }}>
      <View style={{ width: isWide ? 280 : '100%', backgroundColor: '#f5f5f5' }}>
        {/* 侧边栏 */}
      </View>
      <View style={{ flex: 1 }}>
        {/* 内容区 */}
      </View>
    </View>
  );
}

// 等宽网格
function Grid({ columns = 2 }) {
  const { width } = useWindowDimensions();
  const gap = 12;
  const itemWidth = (width - gap * (columns + 1)) / columns;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ width: itemWidth, height: itemWidth, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
      ))}
    </View>
  );
}
```

---

## 9. 常见布局模式速查

### 9.1 居中

```tsx
// 垂直水平居中
{
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
}

// 水平居中（文字）
{ textAlign: 'center' }

// 水平居中（容器宽度已知）
{ alignSelf: 'center' }
```

### 9.2 底部固定按钮

```tsx
<View style={{ flex: 1 }}>
  <ScrollView style={{ flex: 1 }}>
    {/* 可滚动内容 */}
  </ScrollView>
  <View style={{ padding: 16, backgroundColor: '#fff' }}>
    <Pressable style={styles.button}>
      <Text style={styles.buttonText}>提交</Text>
    </Pressable>
  </View>
</View>
```

### 9.3 底部 Tab 栏

```tsx
<View style={{
  flexDirection: 'row',
  height: 49,
  borderTopWidth: 1,
  borderTopColor: '#e0e0e0',
  backgroundColor: '#fff',
}}>
  {tabs.map((tab) => (
    <Pressable
      key={tab.name}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      onPress={() => setActiveTab(tab.name)}
    >
      <Text style={{ color: activeTab === tab.name ? '#007AFF' : '#999', fontSize: 10 }}>
        {tab.label}
      </Text>
    </Pressable>
  ))}
</View>
```

### 9.4 头像 + 文字水平排列

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
  <Image
    source={{ uri: 'https://...' }}
    style={{ width: 48, height: 48, borderRadius: 24 }}
  />
  <View style={{ marginLeft: 12, flex: 1 }}>
    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>用户名</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>个人简介</Text>
  </View>
</View>
```

---

## 10. 平台差异处理

### 10.1 Platform API

```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 方式一：Platform.select
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  text: {
    fontSize: 16,
    // 方式二：Platform.OS
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
});

// 方式三：平台特定文件
// Button.ios.js    → iOS 自动使用
// Button.android.js → Android 自动使用
```

### 10.2 常见平台差异

| 属性/行为 | iOS | Android |
|----------|-----|---------|
| 阴影 | `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` | `elevation` |
| 字体 | SF Pro | Roboto |
| 密码眼睛图标 | 自带 | 需要自行实现 |
| 返回按钮 | 左滑手势 | 物理/虚拟返回键 |
| 模态框 | 从底部滑入 | 淡入 |
| SafeArea | 刘海 + 底部指示条 | 通常只需要状态栏高度 |

---

## ✏️ 练习

### 练习 1：Flexbox 布局挑战

不用查文档，实现以下布局：

**布局 A**：三列等宽，每列高度 80dp，间距 8dp
```
[红  ][蓝  ][绿  ]
```

**布局 B**：头部 56dp + 内容自适应 + 底部 49dp
```
[    头部    ]
[   内容区   ]
[    底部    ]
```

**布局 C**：左侧固定 100dp + 右侧弹性
```
[侧栏][    内容区    ]
```

**验收标准**：每种布局 3 行 StyleSheet 以内实现。

### 练习 2：卡片 UI

实现一个电商商品卡片：
- 顶部：商品图片（宽 100%、高 200dp）
- 中间：商品标题（粗体 18）+ 描述（灰色 14）
- 底部：价格（红色 20）+ 购买按钮（蓝色圆角）

**要求**：
- 用 `StyleSheet.create` 定义所有样式
- 阴影兼容 iOS 和 Android
- 卡片圆角 12dp

### 练习 3：响应式网格

实现一个图片网格：
- 屏幕宽度 > 768dp 时显示 4 列
- 屏幕宽度 ≤ 768dp 时显示 2 列
- 列间距 8dp
- 用 `useWindowDimensions` 获取屏幕宽度

---

## 📝 面试回答模板

> **问：RN 的 StyleSheet 和 CSS 有什么区别？**
>
> 最大的区别有四点。第一，没有级联和选择器，样式只能通过 style 属性绑定到组件上，不能用 class 名或标签选择器。第二，没有继承（Text 嵌套 Text 除外），每个组件都要显式定义自己的样式。第三，属性名用 camelCase（fontSize 而非 font-size），数值默认是 dp 单位。第四，布局只能用 Flexbox，没有 Grid 和 Float。本质上 StyleSheet 是 JS 对象，通过 StyleSheet.create 注册到原生层获得一个 ID，比每次创建新对象更高效。

> **问：RN 的 Flexbox 和 Web 的 Flexbox 有什么不同？**
>
> 语法完全一样，但有两个关键的默认值不同。第一，flexDirection 默认是 column（Web 默认是 row），所以 RN 中子元素默认垂直排列，这是新手最容易踩的坑。第二，所有 View 默认就是 display: flex，不需要手动声明。另外 RN 中没有 CSS Grid，Flexbox 是唯一的布局方案，复杂的网格布局需要嵌套 Flexbox 或用 gap 属性。

> **问：RN 中怎么做响应式布局？**
>
> RN 没有 CSS 媒体查询，需要用 JS 方案。核心工具是 useWindowDimensions Hook，它返回当前窗口的宽高并响应屏幕变化。常见的做法是根据 width 判断是否为宽屏，然后动态切换 flexDirection（row/column）或调整列数。也可以用 Dimensions.get('window') 获取静态尺寸。百分比字符串（width: '50%'、left: '50%' 等）在主流布局属性上都支持，但复杂场景不如 JS 计算灵活。

> **问：RN 的阴影怎么做？iOS 和 Android 有什么区别？**
>
> iOS 和 Android 用完全不同的属性。iOS 用 shadowColor + shadowOffset + shadowOpacity + shadowRadius 四个属性控制阴影。Android 用 elevation 属性，值越大阴影越大，但 Android 的 elevation 要求组件必须有 backgroundColor 才能显示阴影。实际开发中一般用 Platform.select 同时写两套属性。另外 elevation 在 Android 上还会影响组件的层叠顺序（类似 z-index 的效果）。
