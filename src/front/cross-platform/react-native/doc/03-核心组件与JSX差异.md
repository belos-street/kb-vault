# 03 — 核心组件与 JSX 差异

> 对应大纲：应用层 | 预计时间：2 天（含练习）
> 面试可答：RN 的基础组件是 View / Text / Image / TextInput / ScrollView / FlatList / Pressable，它们分别映射为 iOS/Android 的原生 Widget。核心差异在于：所有文字必须被 Text 包裹、没有 HTML 语义标签、列表渲染用 FlatList 而非 map + div。

---

## 1. 为什么不能直接写 HTML

React Web 中你可以写 `<div>`、`<span>`、`<ul>` 这些 HTML 标签，浏览器认识它们。但 RN 运行在 iOS/Android 的原生环境中，没有浏览器、没有 DOM、没有 HTML——所有 UI 必须用 RN 提供的基础组件。

```tsx
// ❌ 浏览器认识 div，手机不认识
<div><p>Hello</p></div>

// ✅ RN 组件会被映射为原生 Widget
<View><Text>Hello</Text></View>
```

RN 的组件映射关系：

```
JSX 组件        →    iOS 原生         →    Android 原生
─────────────────────────────────────────────────────
<View>          →    UIView           →    android.view.ViewGroup
<Text>          →    UILabel/UITextView →  android.widget.TextView
<Image>         →    UIImageView      →    android.widget.ImageView
<TextInput>     →    UITextField      →    android.widget.EditText
<ScrollView>    →    UIScrollView     →    android.widget.ScrollView
<FlatList>      →    JS 层虚拟化（见下方说明）
```

> ⚠️ **FlatList 不是原生列表控件**：官方文档明确 FlatList 是 `<VirtualizedList>` 的包装，而 VirtualizedList 基于 `ScrollView` 在 **JS 层**做虚拟化（只渲染可见区 + 缓冲区的 item）。它并不映射到 iOS 的 `UICollectionView` / Android 的 `RecyclerView`——这也正是为什么超长列表场景社区会推荐基于原生回收机制重写的 `@shopify/flash-list`。

---

## 2. View：万能容器

`View` 是 RN 中最基础的容器组件，对标 Web 的 `<div>`。

### 2.1 基本用法

```tsx
import { View, StyleSheet } from 'react-native';

function Card() {
  return (
    <View style={styles.card}>
      <View style={styles.header} />
      <View style={styles.body} />
    </View>
  );
}

const styles = StyleSheet.create({
  card:    { padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  header:  { height: 40, backgroundColor: '#f0f0f0', marginBottom: 8 },
  body:    { height: 100, backgroundColor: '#e8e8e8' },
});
```

### 2.2 View 的特点

| 特点 | 说明 |
|------|------|
| 默认 Flexbox | `display: flex`，`flexDirection: column` |
| 不能直接写文字 | `<View>Hello</View>` 不会显示任何东西 |
| 支持嵌套 | 可以任意嵌套 View，跟 div 一样 |
| 不可滚动 | 内容溢出不会自动出现滚动条，需要用 `ScrollView` |
| **没有 onPress** | View 不是可点击组件，点击交互必须用 `Pressable` 等 Touchable 组件 |
| 支持阴影 | iOS 用 `shadowColor/shadowOffset`，Android 用 `elevation` |

### 2.3 View vs Pressable

`View` 只有低层级的触摸事件（`onTouchStart` / `onTouchEnd`，拿到的是原始触摸信息），没有 `onPress`。RN 推荐用 `Pressable` 处理点击交互：

```tsx
// 可以，但不推荐：只能拿到原始触摸事件，没有按压态管理
<View onTouchEnd={() => console.log('tapped')} />

// ✅ 推荐：用 Pressable
<Pressable onPress={() => console.log('tapped')}>
  <Text>点击我</Text>
</Pressable>
```

`Pressable` 提供了 `onPressIn`、`onPressOut`、`onLongPress` 等更丰富的交互状态，且自带按压反馈的样式能力。

---

## 3. Text：唯一能显示文字的组件

`Text` 是 RN 中**唯一能渲染文字**的组件。这是跟 Web 最大的不同——Web 中任何标签都能直接写文字，RN 中只有 `Text` 可以。

### 3.1 基本用法

```tsx
import { Text, View, StyleSheet } from 'react-native';

function Article() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>标题</Text>
      <Text style={styles.subtitle}>副标题</Text>
      <Text style={styles.body}>
        正文内容，这是一段比较长的文字，会自动换行。
      </Text>
    </View>
  );
}
```

### 3.2 Text 的嵌套

`Text` 可以嵌套 `Text`，实现行内样式混合：

```tsx
<Text style={{ fontSize: 16 }}>
  这是一段
  <Text style={{ fontWeight: 'bold', color: 'tomato' }}>加粗红色</Text>
  的文字
</Text>
// 渲染结果：这是一段 加粗红色 的文字（在同一行）
```

> **重要**：`Text` 嵌套 `Text` 是 RN 中**唯一能实现样式继承**的方式。外层 `Text` 的 `fontSize`、`color`、`fontFamily` 会被内层继承。

### 3.3 Text 的关键特性

| 特性 | 说明 |
|------|------|
| 支持嵌套 | `Text` 嵌套 `Text` 实现行内混合样式 |
| 样式继承 | 嵌套时内层继承外层的字体属性 |
| 不能嵌套 View | `<Text><View /></Text>` 在 iOS 上会崩溃 |
| 默认不换行 | 单个 `Text` 自动换行，但嵌套结构中需注意 |
| 可选中 | `selectable={true}` 允许用户长按复制文字 |
| numberOfLines | 限制行数，超出显示省略号 |

```tsx
// 限制行数，超出显示 ...
<Text numberOfLines={2} ellipsizeMode="tail">
  这是一段很长的文字，超过两行的部分会被截断并显示省略号...
</Text>
```

### 3.4 常见错误

```tsx
// ❌ 错误 1：View 里直接写文字（不会显示）
<View>Hello World</View>

// ❌ 错误 2：Text 里嵌套 View（iOS 崩溃）
<Text>
  你好 <View style={{ width: 10, height: 10, backgroundColor: 'red' }} />
</Text>

// ✅ 正确做法：用 View 包裹 Text 和其他元素
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Text>你好</Text>
  <View style={{ width: 10, height: 10, backgroundColor: 'red' }} />
</View>
```

---

## 4. Image：图片显示

### 4.1 基本用法

```tsx
import { Image, View, StyleSheet } from 'react-native';

function Avatar() {
  return (
    <View>
      {/* 本地图片 */}
      <Image source={require('./avatar.png')} style={styles.avatar} />

      {/* 网络图片（必须指定宽高） */}
      <Image
        source={{ uri: 'https://example.com/photo.jpg' }}
        style={styles.photo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32 },
  photo:  { width: '100%', height: 200 },
});
```

### 4.2 本地图片 vs 网络图片

| 维度 | 本地图片 | 网络图片 |
|------|---------|---------|
| source 写法 | `require('./img.png')` | `{ uri: 'https://...' }` |
| 宽高 | 可省略（自动读取图片尺寸） | **必须手动指定**，否则不显示 |
| 缓存 | Metro 打包时内嵌 | 平台行为不一致且不受控：iOS 依赖 HTTP 缓存头（NSURLSession），Android 无可靠的持久磁盘缓存；需要可控缓存时用 `expo-image` |
| 支持格式 | PNG / JPG / GIF / WebP | 同左（GIF 双端均支持，Android 底层由 Fresco 处理） |

### 4.3 Image 的关键特性

```tsx
// 圆形头像
<Image
  source={require('./avatar.png')}
  style={{ width: 80, height: 80, borderRadius: 40 }}
/>

// 填充模式（类似 CSS 的 object-fit）
<Image
  source={{ uri: 'https://example.com/wide.jpg' }}
  style={{ width: '100%', height: 200 }}
  resizeMode="cover"    // cover | contain | stretch | center
/>

// 背景图片（Image 没有 background-image，用绝对定位模拟）
<View style={{ width: '100%', height: 300 }}>
  <Image
    source={require('./bg.jpg')}
    style={{ ...StyleSheet.absoluteFillObject }}
    resizeMode="cover"
  />
  <Text style={{ color: '#fff', fontSize: 24 }}>覆盖在图片上的文字</Text>
</View>
```

### 4.4 Image 的局限与替代

| 问题 | 解决方案 |
|------|---------|
| 网络图片缓存不可控 | 用 `expo-image`（官方推荐；老的 `react-native-fast-image` 已进入维护模式，不建议新项目使用） |
| 大图列表内存占用高 | `expo-image` 提供内存/磁盘缓存策略与占位图 |
| 不支持 SVG | 用 `react-native-svg` |
| 不能作为 CSS background-image | 用绝对定位 Image 模拟 |
| 图片尺寸必须手动指定 | 用 `Image.getSize()` 异步获取 |

```tsx
// 异步获取网络图片尺寸
Image.getSize('https://example.com/photo.jpg', (width, height) => {
  console.log(`尺寸: ${width}x${height}`);
});
```

---

## 5. TextInput：文本输入

### 5.1 基本用法

```tsx
import { TextInput, View, StyleSheet } from 'react-native';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="请输入邮箱"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="请输入密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form:   { padding: 16 },
  input:  {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
});
```

### 5.2 常用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `value` | string | 受控组件的值 |
| `onChangeText` | (text) => void | 文字变化回调（不是 `onChange`） |
| `placeholder` | string | 占位文字 |
| `placeholderTextColor` | string | 占位文字颜色 |
| `secureTextEntry` | boolean | 密码输入模式 |
| `keyboardType` | enum | 键盘类型：`default` / `email-address` / `numeric` / `phone-pad` |
| `returnKeyType` | enum | 回车键文字：`done` / `go` / `next` / `search` |
| `multiline` | boolean | 多行输入 |
| `numberOfLines` | number | 多行输入的初始行数 |
| `autoFocus` | boolean | 自动聚焦 |
| `editable` | boolean | 是否可编辑 |
| `maxLength` | number | 最大字符数 |

### 5.3 受控组件模式

`TextInput` 跟 Web 的 `<input>` 一样是受控组件，但回调函数不同：

```tsx
// Web 的 <input>
<input value={text} onChange={(e) => setText(e.target.value)} />

// RN 的 TextInput（onChangeText 直接给字符串，不是 event 对象）
<TextInput value={text} onChangeText={setText} />
```

### 5.4 获取焦点与收起键盘

```tsx
import { TextInput, Keyboard } from 'react-native';
import { useRef } from 'react';

function SearchBar() {
  const inputRef = useRef<TextInput>(null);

  return (
    <TextInput
      ref={inputRef}
      placeholder="搜索..."
      onSubmitEditing={() => {
        // 用户按回车时
        Keyboard.dismiss(); // 收起键盘
      }}
    />
  );
}

// 手动聚焦
inputRef.current?.focus();

// 手动失焦
inputRef.current?.blur();

// 收起键盘
Keyboard.dismiss();
```

> **注意**：RN 中键盘不会像 Web 一样点击空白区域自动收起，需要手动处理。常见做法是在 `ScrollView` 上加 `keyboardShouldPersistTaps="handled"`。

---

## 6. Pressable：交互组件

### 6.1 为什么不用 TouchableOpacity

RN 中有多个可点击组件，它们的历史演进：

| 组件 | 状态 | 说明 |
|------|------|------|
| `TouchableHighlight` | 旧 | 按下变暗 + 底色高亮 |
| `TouchableOpacity` | 旧 | 按下透明度变化，仍在广泛使用 |
| `TouchableWithoutFeedback` | 旧 | 无视觉反馈，不推荐 |
| **`Pressable`** | **新（推荐）** | 最灵活，支持按压样式回调 |

`Pressable` 是 RN 0.63+ 引入的统一交互组件，推荐所有新代码使用它。

### 6.2 基本用法

```tsx
import { Pressable, Text, StyleSheet, Alert } from 'react-native';

function MyButton({ title, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={() => Alert.alert('长按触发')}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### 6.3 Pressable 的回调

| 回调 | 触发时机 |
|------|---------|
| `onPress` | 手指抬起时触发（主要的点击事件） |
| `onLongPress` | 长按（约 500ms）触发 |
| `onPressIn` | 手指按下瞬间 |
| `onPressOut` | 手指抬起瞬间 |
| `onHoverIn` | 鼠标移入（仅 iPadOS / 键盘+鼠标设备） |
| `onHoverOut` | 鼠标移出（同上） |

### 6.4 按压样式

`Pressable` 的 `style` 可以接收一个函数，参数是当前按压状态：

```tsx
<Pressable
  style={({ pressed }) => ({
    backgroundColor: pressed ? '#ddd' : '#fff',
    transform: [{ scale: pressed ? 0.98 : 1 }],
  })}
>
  <Text>点击效果</Text>
</Pressable>
```

---

## 7. ScrollView：可滚动容器

### 7.1 基本用法

```tsx
import { ScrollView, Text, View, StyleSheet } from 'react-native';

function LongContent() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>第一部分</Text>
        <Text>这里有很多内容...</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>第二部分</Text>
        <Text>更多内容...</Text>
      </View>
      {/* 更多 section... */}
    </ScrollView>
  );
}
```

### 7.2 ScrollView 的特点

| 特点 | 说明 |
|------|------|
| 一次性渲染 | **所有子组件一次性全部渲染**，不管是否在屏幕内 |
| 适用场景 | 内容量已知且不多（表单设置页、详情页） |
| 不适合长列表 | 百条以上数据会导致性能问题，用 `FlatList` |
| 水平滚动 | `horizontal={true}` |
| 分页滚动 | `pagingEnabled={true}` |
| 吸附效果 | `snapToInterval` |

```tsx
// 水平轮播效果
<ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
  <View style={{ width: screenWidth, height: 200, backgroundColor: 'tomato' }} />
  <View style={{ width: screenWidth, height: 200, backgroundColor: 'skyblue' }} />
  <View style={{ width: screenWidth, height: 200, backgroundColor: 'limegreen' }} />
</ScrollView>
```

### 7.3 ScrollView vs FlatList 选择

```
内容量多少？
├── 已知且少（< 20 条）→ ScrollView
├── 已知且多（> 20 条）→ FlatList
└── 未知（从 API 加载）→ FlatList
```

---

## 8. FlatList：高性能列表

`FlatList` 是 RN 中最重要的列表组件，对标 Web 中的虚拟滚动列表。

### 8.1 基本用法

```tsx
import { FlatList, Text, View, StyleSheet } from 'react-native';

const DATA = [
  { id: '1', title: 'React Native 入门' },
  { id: '2', title: '样式系统详解' },
  { id: '3', title: '导航路由实战' },
];

function BookList() {
  return (
    <FlatList
      data={DATA}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.title}>{item.title}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item:  { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16 },
});
```

### 8.2 FlatList 的核心原理

```
FlatList 的渲染策略：
┌────────────────────────────┐
│  屏幕可见区域               │
│  ┌──────────────────────┐  │
│  │  Item 1              │  │ ← 已渲染
│  │  Item 2              │  │ ← 已渲染
│  │  Item 3              │  │ ← 已渲染
│  └──────────────────────┘  │
│  缓冲区（屏幕外少量）       │
│  Item 4 ← 已渲染（预加载） │
│  ─────────────────────── │
│  Item 5 ← 未渲染（回收）   │
│  Item 6 ← 未渲染（回收）   │
│  ...                       │
└────────────────────────────┘
```

FlatList 只渲染屏幕可见区域 + 少量缓冲区的列表项，屏幕外的列表项会被回收。这就是它能高效渲染万级数据的原因——跟 Web 的虚拟列表原理一样。

### 8.3 核心属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | array | 数据源 |
| `renderItem` | ({ item, index }) => Element | 每行的渲染函数 |
| `keyExtractor` | (item) => string | 唯一 key（不用 `index` 除非数据不变） |
| `ItemSeparatorComponent` | Component | 行间分隔线 |
| `ListHeaderComponent` | Component | 列表头部 |
| `ListFooterComponent` | Component | 列表尾部 |
| `ListEmptyComponent` | Component | 数据为空时显示 |
| `onEndReached` | () => void | 滚动到底部触发（用于加载更多） |
| `onEndReachedThreshold` | number | 距离底部多远触发（0.5 = 半屏） |
| `onRefresh` | () => void | 下拉刷新回调 |
| `refreshing` | boolean | 是否显示刷新指示器 |
| `horizontal` | boolean | 水平列表 |
| `numColumns` | number | 网格列数 |
| `initialNumToRender` | number | 首屏渲染条数 |
| `windowSize` | number | 渲染区域大小（屏幕数） |

### 8.4 完整示例：下拉刷新 + 上拉加载

```tsx
import { FlatList, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArticles = useCallback(async (pageNum: number, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    const res = await fetch(`https://api.example.com/articles?page=${pageNum}`);
    const data = await res.json();

    setArticles((prev) => (refresh ? data : [...prev, ...data]));
    setPage(pageNum);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchArticles(1); }, [fetchArticles]);

  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.summary}</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.empty}>暂无数据</Text>}
      ListFooterComponent={
        loading ? <ActivityIndicator style={{ padding: 16 }} /> : null
      }
      refreshing={refreshing}
      onRefresh={() => fetchArticles(1, true)}
      onEndReached={() => { if (!loading) fetchArticles(page + 1); }}
      onEndReachedThreshold={0.3}
    />
  );
}

const styles = StyleSheet.create({
  card:      { padding: 16 },
  title:     { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  desc:      { fontSize: 14, color: '#666' },
  separator: { height: 1, backgroundColor: '#eee' },
  empty:     { textAlign: 'center', padding: 40, color: '#999' },
});
```

### 8.5 FlatList 性能优化

| 优化手段 | 说明 |
|---------|------|
| `keyExtractor` 用唯一 ID | 不要用 index（数据变化时会导致不必要的重渲染） |
| `getItemLayout` | 如果列表项高度固定，提供此属性可以跳过布局计算 |
| `initialNumToRender` | 设为屏幕可见数量，减少首屏渲染压力 |
| `windowSize` | 默认 21（屏幕外渲染 10 屏），减小可节省内存 |
| `removeClippedSubviews` | Android 上将屏幕外的 View 从原生层级移除 |
| `React.memo` 包裹列表项 | 避免列表项不必要的重渲染 |

```tsx
// 固定高度列表项的性能优化
<FlatList
  data={DATA}
  getItemLayout={(data, index) => ({
    length: 72,           // 每项高度
    offset: 72 * index,   // 偏移量
    index,
  })}
  renderItem={({ item }) => <MemoizedItem item={item} />}
/>

// 用 React.memo 包裹列表项组件
const MemoizedItem = React.memo(({ item }) => (
  <View style={styles.item}>
    <Text>{item.title}</Text>
  </View>
));
```

---

## 9. SectionList：分组列表

当数据需要按分组展示时（如通讯录按字母分组），用 `SectionList`：

```tsx
import { SectionList, Text, View, StyleSheet } from 'react-native';

const SECTIONS = [
  {
    title: 'A',
    data: [
      { name: 'Alice', phone: '138-0000-0001' },
      { name: 'Andy', phone: '138-0000-0002' },
    ],
  },
  {
    title: 'B',
    data: [
      { name: 'Bob', phone: '138-0000-0003' },
    ],
  },
];

function Contacts() {
  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(item) => item.name}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      )}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      stickySectionHeadersEnabled  // iOS 上的吸顶效果
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  row: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phone: { color: '#888' },
});
```

---

## 10. 其他常用组件速查

| 组件 | 用途 | 关键点 |
|------|------|--------|
| `Switch` | 开关 | `value` + `onValueChange` |
| `ActivityIndicator` | 加载指示器 | `size="large"` / `color="#007AFF"` |
| `StatusBar` | 状态栏控制 | `barStyle="dark-content"` / `backgroundColor` |
| `KeyboardAvoidingView` | 键盘弹出时自动调整布局 | `behavior="padding"`（iOS）/ `behavior="height"`（Android） |
| `SafeAreaView` | 刘海屏/底部安全区域 | iOS 必用，Android 通常不需要 |
| `Modal` | 模态弹窗 | `visible` + `onRequestClose` |
| `RefreshControl` | 下拉刷新（配合 ScrollView） | `onRefresh` + `refreshing` |

```tsx
// SafeAreaView 用法（适配刘海屏）
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>内容不会被刘海遮挡</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
```

```tsx
// KeyboardAvoidingView 用法（输入框不被键盘遮挡）
import { KeyboardAvoidingView, TextInput, Platform } from 'react-native';

function ChatInput() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TextInput placeholder="输入消息..." style={{ borderWidth: 1, padding: 12 }} />
    </KeyboardAvoidingView>
  );
}
```

---

## 11. 组件组合模式

掌握了基础组件后，常见的 UI 模式都可以通过组合实现：

### 11.1 卡片列表

```tsx
import { FlatList, View, Text, StyleSheet } from 'react-native';

function CardList({ data }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc}>{item.desc}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    // Android 阴影
    elevation: 2,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardDesc:  { color: '#666', marginTop: 8 },
});
```

### 11.2 搜索栏 + 列表

```tsx
function SearchableList({ data }) {
  const [query, setQuery] = useState('');
  const filtered = data.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        placeholder="搜索..."
        value={query}
        onChangeText={setQuery}
        style={{
          margin: 16,
          padding: 12,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
        }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={{ padding: 16 }}>{item.title}</Text>}
      />
    </View>
  );
}
```

---

## ✏️ 练习

### 练习 1：用户列表页

用 `FlatList` 实现一个用户列表页：
- 数据：至少 10 条用户数据（姓名、头像、简介）
- 每行显示头像（圆角）+ 姓名 + 简介
- 支持下拉刷新
- 滚动到底部时加载更多

**提示**：
- 头像用 `Image` + `borderRadius`
- 下拉刷新用 `onRefresh` + `refreshing`
- 加载更多用 `onEndReached`

### 练习 2：搜索与过滤

在练习 1 的基础上：
- 顶部加一个搜索输入框
- 输入文字时实时过滤列表
- 无匹配结果时显示"未找到用户"

**提示**：
- 用 `useState` 管理搜索词
- 用 `useMemo` 缓存过滤结果，避免每次渲染都重新过滤：

```tsx
const [query, setQuery] = useState('');
const filtered = useMemo(
  () => data.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  ),
  [data, query]
);
```

- `FlatList` 的 `ListEmptyComponent` 显示空状态

### 练习 3：Tab 切换

用 `ScrollView` + `Pressable` 实现一个简单的 Tab 切换效果：
- 顶部一排 Tab 按钮（水平排列）
- 点击不同 Tab 显示不同内容
- 选中 Tab 有高亮样式

---

## 📝 面试回答模板

> **问：RN 的基础组件有哪些？跟 HTML 标签有什么对应关系？**
>
> RN 的基础组件包括 View（对标 div）、Text（对标 span/p/h1-h6）、Image（对标 img）、TextInput（对标 input）、ScrollView（对标 overflow:auto 的容器）、FlatList（对标虚拟滚动列表）。核心差异是：所有文字必须被 Text 包裹，View 里直接写文字不会显示；Image 必须手动指定宽高否则不显示；没有 HTML 的语义化标签（没有 header/footer/nav/article）。

> **问：ScrollView 和 FlatList 怎么选？**
>
> ScrollView 一次性渲染所有子组件，适合内容量已知且少的场景（比如表单设置页、详情页）。FlatList 实现了虚拟列表，只渲染屏幕可见区域的列表项，屏幕外的会被回收，适合长列表和数据量未知的场景。简单判断标准：20 条以内用 ScrollView，超过 20 条或数据从 API 加载用 FlatList。

> **问：FlatList 的性能优化有哪些？**
>
> 首先，keyExtractor 要用数据的唯一 ID 而不是 index，这样数据变化时能精确 diff。其次，如果列表项高度固定，提供 getItemLayout 可以跳过布局计算。第三，用 React.memo 包裹列表项组件，避免父组件重渲染时所有列表项跟着重渲染。第四，initialNumToRender 设为屏幕可见数量，windowSize 适当减小来控制渲染区域。最后，Android 上可以开启 removeClippedSubviews 把屏幕外的 View 从原生层级移除。
