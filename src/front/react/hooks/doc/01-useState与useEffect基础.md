# 01 - useState 与 useEffect 基础

> 对应大纲模块 1 | 预计时间：1 天
> 面试可答：`useState` 管理组件状态，`effect` 处理副作用，依赖数组控制执行时机。

---

## 学习目标

- 掌握 `useState` 的基本用法与函数式更新
- 理解状态不可变原则（数组/对象更新方式）
- 掌握 `useEffect` 的执行时机与依赖数组
- 理解清理函数（cleanup）的作用
- 面试时能解释 `useState` 和 `useEffect` 的工作原理

---

## 核心概念

### 1. useState — 状态管理

`useState` 是最基础的 Hook，用于在函数组件中声明**响应式状态**。

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState<number>(0);

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

**核心要点**：
- `useState(initialValue)` 返回 `[state, setState]` 元组
- 调用 `setState` 会触发组件重新渲染
- `initialValue` 只在**首次渲染**时生效，后续渲染会被忽略

### 2. 函数式更新

当新状态依赖旧状态时，应该使用**函数式更新**：

```tsx
function Counter() {
  const [count, setCount] = useState<number>(0);

  // ❌ 错误：闭包陷阱，可能拿到过期的 count
  const handleBad = () => {
    setCount(count + 1);
    setCount(count + 1); // 还是 +1，不是 +2
  };

  // ✅ 正确：函数式更新，基于上一个状态计算
  const handleGood = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1); // +2
  };
}
```

**面试常问**：为什么连续调用两次 `setCount(count + 1)` 只增加 1？

因为 `count` 是**渲染时的快照值**（闭包捕获），两次调用拿到的是同一个 `count`。函数式更新 `prev => prev + 1` 则是基于队列中的最新值计算。

### 3. 状态不可变原则

React 通过**引用比较**（`Object.is`）判断状态是否变化，直接修改原对象/数组**不会触发重渲染**。

#### 对象更新

```tsx
const [user, setUser] = useState<{ name: string; age: number }>({
  name: 'Alice',
  age: 25,
});

// ❌ 错误：直接修改原对象（引用不变）
// user.age = 26;
// setUser(user);

// ✅ 正确：展开运算符创建新对象
setUser(prev => ({ ...prev, age: 26 }));
```

#### 数组更新

```tsx
const [items, setItems] = useState<string[]>(['a', 'b', 'c']);

// 添加
setItems(prev => [...prev, 'd']);

// 删除（按索引）
setItems(prev => prev.filter((_, i) => i !== 1));

// 修改（按索引）
setItems(prev => prev.map((item, i) => (i === 0 ? 'x' : item)));

// 排序（创建新数组后排序）
setItems(prev => [...prev].sort());
```

**原则总结**：永远返回一个**新引用**，而不是修改原数据。

### 4. 惰性初始化

如果初始值计算昂贵，可以传一个**工厂函数**：

```tsx
// ❌ 每次渲染都会执行 JSON.parse
const [state, setState] = useState(JSON.parse(localStorage.getItem('key')!));

// ✅ 只在首次渲染时执行
const [state, setState] = useState(() =>
  JSON.parse(localStorage.getItem('key')!)
);
```

`useState(() => initialValue)` 的形式叫**惰性初始化**，工厂函数只在组件挂载时调用一次。

---

## useEffect — 副作用处理

### 5. 基本用法

`useEffect` 用于处理组件的**副作用**：数据请求、订阅、手动 DOM 操作等。

```tsx
import { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // 清理函数：组件卸载时执行
    return () => clearInterval(timer);
  }, []); // 空依赖数组：只在挂载时执行一次

  return <p>已运行 {seconds} 秒</p>;
}
```

### 6. 依赖数组的三种模式

| 依赖数组 | 执行时机 | 典型场景 |
|---------|---------|---------|
| 不传 | 每次渲染后都执行 | 很少使用（容易性能问题） |
| `[]` | 仅挂载时执行一次 | 事件监听、定时器、初始化请求 |
| `[dep1, dep2]` | 挂载时 + 依赖变化时 | 响应 props/state 变化 |

```tsx
// 模式 1：每次渲染后执行（不传依赖数组）
useEffect(() => {
  console.log('每次渲染后都会执行');
});

// 模式 2：只在挂载时执行（空数组）
useEffect(() => {
  console.log('只在挂载时执行一次');
}, []);

// 模式 3：依赖变化时执行
useEffect(() => {
  console.log(`count 变为 ${count}`);
}, [count]);
```

### 7. 清理函数（Cleanup）

`useEffect` 回调返回的函数会在**下次 effect 执行前**或**组件卸载时**调用：

```tsx
// 模拟连接 API
function createConnection(roomId: string) {
  return {
    connect() { console.log(`已连接到 ${roomId}`); },
    disconnect() { console.log(`已断开 ${roomId}`); },
  };
}

function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();

    // 清理：离开房间或 roomId 变化时断开连接
    return () => {
      connection.disconnect();
    };
  }, [roomId]);

  return <h1>欢迎来到 {roomId}</h1>;
}
```

**执行顺序**（以 `roomId` 从 "general" 变为 "travel" 为例）：

```
1. 挂载：effect("general") → connect("general")
2. roomId 变化：
   a. cleanup("general") → disconnect("general")  // 先清理旧的
   b. effect("travel") → connect("travel")          // 再执行新的
3. 卸载：cleanup("travel") → disconnect("travel")
```

### 8. 数据请求模式

```tsx
interface User {
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // 防止组件卸载后更新状态

    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('请求失败');
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true; // 清理：标记为已取消
    };
  }, [userId]);

  if (loading) return <p>加载中...</p>;
  if (error) return <p>错误：{error}</p>;
  if (!user) return null;

  return <h1>{user.name}</h1>;
}
```

**注意**：`cancelled` 标志位防止了"竞态条件"——当 `userId` 快速切换时，旧请求的结果不会覆盖新请求。

### 9. useEffect 执行流程总览

```
组件首次渲染（mount）
  └→ 执行 effect 回调
      └→ 返回 cleanup 函数（暂存）

组件重渲染（update），依赖变化
  ├→ 执行上一次的 cleanup（清理旧 effect）
  └→ 执行新的 effect 回调
      └→ 返回新的 cleanup 函数（暂存）

组件卸载（unmount）
  └→ 执行最后一次的 cleanup
```

**对比 Class 生命周期**：

```
useEffect(() => {            ≈  componentDidMount
  return () => {             ≈  componentWillUnmount
  };
}, []);

useEffect(() => {            ≈  componentDidUpdate（依赖变化时）
  // ...
}, [dep]);
```

---

## 常见踩坑点

### 1. 闭包陷阱：effect 中引用过期状态

```tsx
// ❌ 错误：count 永远是 0
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // count 始终是初始值 0
  }, 1000);
  return () => clearInterval(timer);
}, []);

// ✅ 正确：使用函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1); // 基于最新状态
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### 2. 忘记依赖导致 stale closure

```tsx
// ❌ 错误：useEffect 内的 doSomething 永远是首次渲染的版本
useEffect(() => {
  doSomething(a, b);
}, []); // 缺少 a, b 依赖

// ✅ 正确：声明所有依赖
useEffect(() => {
  doSomething(a, b);
}, [a, b]);
```

**提示**：`eslint-plugin-react-hooks` 的 `exhaustive-deps` 规则会自动检测遗漏的依赖。

### 3. 无限循环：effect 中更新状态触发重渲染

```tsx
// ❌ 错误：每次渲染后都 setState → 触发重渲染 → 再 setState → 无限循环
useEffect(() => {
  setCount(count + 1); // 没有依赖数组，每次渲染都执行
});

// ✅ 正确：加依赖数组，或用条件判断
useEffect(() => {
  if (count < 10) {
    setCount(prev => prev + 1);
  }
}, [count]);
```

### 4. 对象/数组作为依赖时的引用问题

```tsx
// ❌ 问题：options 每次渲染都是新引用，effect 每次都执行
useEffect(() => {
  fetchData({ url, method });
}, [{ url, method }]); // 每次渲染创建新对象

// ✅ 正确：展开依赖，或用 useMemo 缓存对象
useEffect(() => {
  fetchData({ url, method });
}, [url, method]);
```

---

## 面试高频问题

### Q1：useState 的初始值只在首次渲染时生效吗？

**答**：是的。`useState(initialValue)` 的 `initialValue` 只在组件**首次挂载**时使用，后续重渲染会被忽略。如果初始值计算昂贵，可以用惰性初始化：`useState(() => expensiveCompute())`。

### Q2：为什么不能在条件语句中调用 useState？

**答**：React 内部通过**调用顺序**来匹配 Hook 和状态。如果在条件语句中调用，渲染之间的调用顺序会变化，导致状态错位。这是 Hooks 的核心规则——**只能在组件顶层调用**。

### Q3：useEffect 和 componentDidMount / componentDidUpdate 有什么区别？

**答**：`useEffect` 不等同于某个生命周期方法，它统一处理所有副作用。通过依赖数组控制执行时机：`[]` 类似 `componentDidMount`，有依赖类似 `componentDidUpdate`，返回的清理函数类似 `componentWillUnmount`。但 `useEffect` 是**异步执行**的（浏览器绘制后），不会阻塞渲染。

### Q4：useEffect 的清理函数什么时候执行？

**答**：清理函数在**两种情况**下执行：(1) 组件卸载时；(2) 依赖变化导致 effect 重新执行前（先清理旧的，再执行新的）。

---

## 面试回答模板

> **问：介绍一下 useState 和 useEffect？**
>
> `useState` 用于在函数组件中声明响应式状态，返回 `[state, setState]`，调用 `setState` 触发重渲染。`useEffect` 用于处理副作用，通过依赖数组控制执行时机：空数组只在挂载时执行，有依赖则在依赖变化时执行。`useEffect` 的返回值是清理函数，在卸载或重新执行前调用。
>
> **追问：useEffect 的依赖数组原理？**
>
> React 在每次渲染后对比新旧依赖数组（浅比较 `Object.is`），如果有变化就先执行清理函数，再执行新的 effect。如果依赖数组为空，只在挂载和卸载时各执行一次。

---

## 练习

### 练习 1：计数器

**要求**：实现一个计数器组件，支持 +1、-1、重置功能

**提示**：三个按钮分别用 `setCount(prev => prev + 1)`、`setCount(prev => prev - 1)`、`setCount(0)` 实现

**预期效果**：页面显示当前计数值和三个按钮，点击对应按钮后数字立即变化

```tsx
function Counter() {
  const [count, setCount] = useState<number>(0);

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={() => setCount(prev => prev - 1)}>-1</button>
      <button onClick={() => setCount(0)}>重置</button>
      <button onClick={() => setCount(prev => prev + 1)}>+1</button>
    </div>
  );
}
```

### 练习 2：窗口尺寸监听

**要求**：封装一个 `useWindowSize` 自定义 Hook，监听窗口 resize 事件

**提示**：`useEffect` + 空依赖数组绑定一次事件，清理函数移除监听

**预期效果**：页面实时显示当前窗口的宽高，拖动浏览器窗口边缘时数字自动更新

```tsx
function useWindowSize() {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // 清理：组件卸载时移除监听
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 使用
function App() {
  const { width, height } = useWindowSize();
  return (
    <p>
      窗口尺寸：{width} x {height}
    </p>
  );
}
```

**关键点**：
- `[]` 空依赖：只绑定一次事件监听
- 清理函数：防止内存泄漏
- 这就是自定义 Hook 的雏形（模块 4 会深入讲解）

---

## 本模块完成标准

- [ ] 能用 `useState` 管理基本类型和引用类型状态
- [ ] 理解函数式更新的使用场景
- [ ] 能用 `useEffect` 处理副作用并正确设置依赖数组
- [ ] 理解清理函数的执行时机
- [ ] 面试时能解释闭包陷阱及解决方案
