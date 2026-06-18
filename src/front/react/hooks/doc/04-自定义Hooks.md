# 04 - 自定义 Hooks

> 对应大纲模块 4 | 预计时间：1.5 天
> 面试可答：自定义 Hook 是以 `use` 开头的函数，内部可组合任意 Hooks，实现逻辑复用。

---

## 学习目标

- 理解自定义 Hook 的命名规范与设计原则
- 掌握返回值设计（数组 vs 对象）的取舍
- 实现核心自定义 Hook：`useToggle`、`useDebounce`、`useFetch`
- 能用自定义 Hook 组合完成完整功能
- 面试时能解释自定义 Hook 与 HOC / Render Props 的对比优劣

---

## 核心概念

### 1. 什么是自定义 Hook？

自定义 Hook 是一个以 `use` 开头的 JavaScript 函数，内部可以调用其他 Hooks（`useState`、`useEffect`、`useRef` 等），用于**抽取组件逻辑**为可复用的函数。

```tsx
// 一个最简单的自定义 Hook
function useToggle(initialValue = false) {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = () => setValue(prev => !prev);

  return [value, toggle] as const;
}
```

**为什么需要自定义 Hook？**

对比三种逻辑复用方案：

| 方案 | 代码量 | 可读性 | TS 支持 | 逻辑隔离 |
|------|--------|--------|---------|---------|
| HOC（高阶组件） | 多 | 差（嵌套地狱） | 一般 | 好 |
| Render Props | 多 | 差（回调地狱） | 一般 | 好 |
| **自定义 Hook** | **少** | **好（扁平）** | **好** | **好** |

> **横向对比**：在 Vue 中，类似的逻辑复用方案是 **Composables**（组合式函数），其设计理念与自定义 Hook 高度一致——以 `use` 开头、内部可组合其他 composables、返回状态和方法。而在 Class 组件时代，逻辑复用只能通过 Mixins（易命名冲突、来源不透明）实现，自定义 Hook 和 Composables 本质上都是对"函数组合优于继承"这一理念的实践。

```tsx
// ❌ HOC：额外组件层级，props 来源不透明
const EnhancedComponent = withAuth(withLogger(withTheme(MyComponent)));

// ❌ Render Props：嵌套回调
<DataProvider>
  {data => (
    <ThemeProvider>
      {theme => <MyComponent data={data} theme={theme} />}
    </ThemeProvider>
  )}
</DataProvider>

// ✅ 自定义 Hook：扁平、可组合、类型推导自然
function MyComponent() {
  const { data } = useData();
  const { theme } = useTheme();
  const { user } = useAuth();
  // ...
}
```

### 2. 命名规范与设计原则

#### 命名规范

| 规则 | 说明 | 示例 |
|------|------|------|
| 以 `use` 开头 | React 约定，也是 ESLint 规则的识别依据 | `useToggle` ✅ / `toggle` ❌ |
| 动词语义 | 描述"做什么" | `useFetch` / `useDebounce` / `useMediaQuery` |
| 返回值命名对应 | 返回的变量名与 Hook 名相关 | `useToggle` → `[isOn, toggle]` |

#### 设计原则

1. **单一职责**：一个 Hook 只做一件事
2. **可组合**：小 Hook 组合成大 Hook，而不是一个大 Hook 做所有事
3. **参数可配置**：提供合理的默认值，同时支持自定义
4. **返回值稳定**：返回的引用尽量稳定（用 `useCallback` / `useMemo`）

```tsx
// ✅ 好：单一职责，可组合
function useUserData(userId: string) {
  const { data, loading } = useFetch(`/api/users/${userId}`);
  return { user: data, loading };
}

// ❌ 不好：一个 Hook 做太多事
function useUserPage(userId: string) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 三个不相关的状态混在一起
}
```

### 3. 返回值设计：数组 vs 对象

#### 数组返回值

```tsx
// useToggle 返回数组
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(prev => !prev);
  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);

  return [value, toggle, setTrue, setFalse] as const;
}

// 使用方：按需解构命名
const [isOn, toggle] = useToggle();
const [isVisible, show, hide] = useToggle(); // 重命名为语义化名称
```

| 优点 | 缺点 |
|------|------|
| 调用方可自由重命名 | 位置敏感，不能跳过中间项 |
| 使用方式统一（类似 `useState`） | 返回项超过 3 个时容易混淆 |
| 适合 2-3 个返回值 | 类型推导需要 `as const` |

#### 对象返回值

```tsx
// useMediaQuery 返回对象
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return { matches };
}

// 使用方：解构属性名
const { matches: isLargeScreen } = useMediaQuery('(min-width: 1024px)');
const { matches: isMobile } = useMediaQuery('(max-width: 768px)');
```

| 优点 | 缺点 |
|------|------|
| 属性名明确，不依赖顺序 | 调用方无法重命名（需要 `as` 语法） |
| 适合 3+ 个返回值 | 解构时容易命名冲突 |
| 扩展性好（新增字段不破坏已有代码） | 结构稍复杂 |

#### 选择建议

```
返回 ≤ 2 个值 → 数组（简洁）
返回 ≥ 3 个值 → 对象（清晰）
返回值中函数占多数 → 对象（按名调用）
和 useState 返回风格一致 → 数组
```

---

## 核心自定义 Hook 实现

### 4. useToggle — 布尔状态切换

最简单的自定义 Hook，是 `useState` 的专项封装：

```tsx
import { useState, useCallback } from 'react';

function useToggle(initialValue = false) {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse] as const;
}
```

**为什么要用 `useCallback`？** 因为返回的函数可能作为 props 传给子组件，用 `useCallback` 保证引用稳定。

**使用示例**：

```tsx
function ThemeSwitch() {
  const [isDark, toggleDark] = useToggle(false);

  return (
    <div style={{
      background: isDark ? '#333' : '#fff',
      color: isDark ? '#fff' : '#333',
      padding: 20,
    }}>
      <p>当前主题：{isDark ? '暗色' : '亮色'}</p>
      <button onClick={toggleDark}>切换</button>
    </div>
  );
}

function Modal() {
  const [isOpen, open, close] = useToggle(false);

  return (
    <>
      <button onClick={open}>打开弹窗</button>
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <p>弹窗内容</p>
            <button onClick={close}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### 5. useDebounce — 防抖值

防抖的核心思想：**延迟更新值**，直到停止变化一段时间后才真正更新。

```tsx
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 在 delay 毫秒后更新 debouncedValue
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 如果 value 或 delay 变化，清除上一个定时器（重新计时）
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

> **扩展：另一种常见实现**——用 `useRef` 保存定时器 ID，适合需要手动清除定时器的场景。两种实现等价，`useState` 版本更简洁，`useRef` 版本在需要读取/取消定时器时更灵活。

**工作原理**：

```
用户输入： "r" → "re" → "rea" → "reac" → "react" → （停顿 500ms）
定时器：    重置   重置   重置   重置     开始    →  触发更新
debounced值:初始值  初始值  初始值  初始值   初始值  →  "react"
```

**使用示例 — 搜索输入框**：

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      console.log(`执行搜索：${debouncedQuery}`);
      // fetch(`/api/search?q=${debouncedQuery}`)
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="输入搜索关键词..."
    />
  );
}
```

**为什么要 debounce API 请求？** 避免每次按键都发请求——假设用户输入 "react" 需要 300ms，如果不防抖会发 5 次请求；防抖后只发 1 次。

### 6. useFetch — 数据请求封装

`useFetch` 是自定义 Hook 的典型代表，它组合了 `useState` + `useEffect` + `useReducer`：

```tsx
import { useReducer, useEffect, useCallback, useState } from 'react';

// 1. 定义状态和 action 类型
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type FetchAction<T> =
  | { type: 'loading' }
  | { type: 'success'; payload: T }
  | { type: 'error'; payload: string };

// 2. reducer — 纯函数，集中管理状态变更
function fetchReducer<T>(
  state: FetchState<T>,
  action: FetchAction<T>
): FetchState<T> {
  switch (action.type) {
    case 'loading':
      return { data: null, loading: true, error: null };
    case 'success':
      return { data: action.payload, loading: false, error: null };
    case 'error':
      return { data: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

// 3. useFetch Hook
function useFetch<T = unknown>(url: string) {
  const [state, dispatch] = useReducer(fetchReducer<T>, {
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      dispatch({ type: 'loading' });

      try {
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (!cancelled) {
          dispatch({ type: 'success', payload: data });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'error',
            payload: err instanceof Error ? err.message : '请求失败',
          });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true; // 防止组件卸载后更新状态
    };
  }, [url]);

  return state;
}
```

**使用示例**：

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useFetch<User>(
    `/api/users/${userId}`
  );

  if (loading) return <p>加载中...</p>;
  if (error) return <p style={{ color: 'red' }}>错误：{error}</p>;
  if (!user) return null;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

#### useFetch 进阶 — 手动刷新

上面的实现自动在 `url` 变化时请求。但有时需要手动重新请求（比如提交表单后刷新列表）：

> 以下为增强版本，可直接替换上面的 `useFetch`（函数名改为 `useFetchWithRefresh` 以避免命名冲突）。

```tsx
function useFetchWithRefresh<T = unknown>(url: string) {
  const [state, dispatch] = useReducer(fetchReducer<T>, {
    data: null,
    loading: true,
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      dispatch({ type: 'loading' });

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          dispatch({ type: 'success', payload: data });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'error',
            payload: err instanceof Error ? err.message : '请求失败',
          });
        }
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [url, refreshKey]); // refreshKey 变化时重新请求

  return { ...state, refresh };
}
```

---

## 组合自定义 Hook

### 7. useDebounce + useFetch 组合搜索

这是自定义 Hook 可组合性的最佳演示——两个小 Hook 组合成一个完整功能：

```tsx
function SearchUsers() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  // 只有在 debouncedQuery 非空时才发起请求
  const { data: users, loading, error } = useFetch<User[]>(
    debouncedQuery
      ? `/api/users?q=${encodeURIComponent(debouncedQuery)}`
      : '' // 空字符串时不会发送请求
  );

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索用户..."
      />
      {loading && <p>搜索中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {users && (
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name} - {user.email}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**数据流**：

```
用户输入 "alice"
  └→ query 变更为 "alice"
      └→ useDebounce 开始 500ms 倒计时
          └→ 500ms 后 debouncedQuery 变为 "alice"
              └→ useFetch url 变为 "/api/users?q=alice"
                  └→ dispatch({ type: 'loading' })
                  └→ fetch('/api/users?q=alice')
                      └→ dispatch({ type: 'success', payload: data })
```

**为什么分开而不是一个 `useSearch`？**
- 单一职责：`useDebounce` 只做防抖，`useFetch` 只做请求
- `useDebounce` 可以复用到其他场景（保存草稿、变化通知等）
- `useFetch` 可以单独用于不需要防抖的请求

---

## 常见踩坑点

### 1. 自定义 Hook 中忘记 useCallback

```tsx
// ❌ 问题：每次渲染都创建新函数，传入子组件时破坏 memo 优化
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(prev => !prev); // 每次渲染新函数
  return [value, toggle] as const;
}

// ✅ 正确：用 useCallback 稳定引用
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(prev => !prev), []);
  return [value, toggle] as const;
}
```

### 2. 没有正确处理竞态条件

```tsx
// ❌ 问题：快速切换 userId 时，旧请求可能覆盖新数据
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData); // 旧请求先发后到，覆盖新数据
  }, [url]);

  return data;
}

// ✅ 正确方案一：cancelled 标志位
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then(res => res.json())
      .then(result => {
        if (!cancelled) setData(result);
      });

    return () => { cancelled = true; };
  }, [url]);

  return data;
}

// ✅ 正确方案二（推荐）：AbortController — 实际取消网络请求
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetch(url, { signal: abortController.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => abortController.abort(); // 卸载时实际取消请求
  }, [url]);

  return data;
}
```

### 3. 自定义 Hook 在条件语句中调用

```tsx
// ❌ 错误：违反 Hooks 调用规则
function UserProfile({ userId }: { userId: string }) {
  if (userId) {
    const { data } = useFetch(`/api/users/${userId}`); // 条件调用
  }
}

// ✅ 正确：在顶层调用，参数传空值
function UserProfile({ userId }: { userId: string }) {
  const { data } = useFetch(userId ? `/api/users/${userId}` : '');
}
```

### 4. 过度耦合：一个 Hook 做太多事

```tsx
// ❌ 问题：三个不相关的状态耦合在一起
function useFormManager() {
  const [data, setData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState('light'); // 不相关！

  return { data, isSaving, theme };
}

// ✅ 正确：拆分为独立 Hook
function useFormData() { /* ... */ }
function useSavingState() { /* ... */ }
function useTheme() { /* ... */ }
```

### 5. 依赖数组遗漏

```tsx
// ❌ 问题：url 变化后不会重新请求
function useFetch<T>(url: string) {
  useEffect(() => {
    fetch(url).then(/* ... */);
  }, []); // 缺少 url 依赖

  // ✅ 正确
  useEffect(() => {
    fetch(url).then(/* ... */);
  }, [url]);
}
```

---

## 面试高频问题

### Q1：自定义 Hook 和 HOC 有什么区别？

**答**：自定义 Hook 是函数组合，HOC 是组件包装。自定义 Hook 没有额外的组件层级，props 来源透明，TypeScript 类型推导自然。HOC 会引入额外组件层级，props 来源不透明（合并 props 时命名冲突），且组合多个 HOC 时形成嵌套地狱。自定义 Hook 是 React 推荐的逻辑复用方式，HOC 已基本被取代。

### Q2：自定义 Hook 的参数和返回值设计有什么最佳实践？

**答**：参数方面，提供合理的默认值，可选参数用 options 对象。返回值方面，2 个以下返回值用数组（类似 `useState`），3 个以上用对象。返回的函数应该用 `useCallback` 稳定引用，派生数据用 `useMemo` 缓存。

### Q3：自定义 Hook 内部使用 useReducer 的好处？

**答**：(1) reducer 是纯函数，可以独立于组件编写和测试；(2) 多个状态变更逻辑集中管理，避免 useState 分散在多个 setState 中；(3) action 类型清晰，便于追踪状态变更来源；(4) 状态逻辑可以在不同 Hook 间复用（如 fetchReducer 可用于多个数据请求 Hook）。

### Q4：自定义 Hook 可以调用其他自定义 Hook 吗？

**答**：可以。自定义 Hook 内部可以调用其他自定义 Hook（以及所有内置 Hook），这正是自定义 Hook 的可组合性所在。比如 `useDebounce` + `useFetch` 可以组合成搜索功能。这是一种函数组合模式，比 HOC 链式嵌套更清晰。

### Q5：自定义 Hook 如何做单元测试？

**答**：用 `@testing-library/react-hooks` 的 `renderHook` 函数，在隔离环境中渲染 Hook，然后断言其返回值和行为。reducer 可以单独测试（纯函数）。对于涉及异步的 Hook（如 `useFetch`），用 Mock Service Worker 模拟网络请求。

---

## 面试回答模板

> **问：介绍一下自定义 Hook？**
>
> 自定义 Hook 是以 `use` 开头的函数，内部可以调用其他 Hooks，用于抽取组件中的可复用逻辑。对比 HOC 和 Render Props，自定义 Hook 没有额外组件层级，props 来源透明，TypeScript 类型推导自然。
>
> 设计原则是单一职责、可组合、返回值引用稳定。返回值设计上，2 个以下推荐数组（可自由重命名），3 个以上推荐对象（属性名清晰）。
>
> 典型例子包括：`useToggle` 封装布尔切换逻辑、`useDebounce` 防抖输入值、`useFetch` 封装请求生命周期。这些小 Hook 可以自由组合，比如 `useDebounce` + `useFetch` 实现带防抖的搜索功能。
>
> **追问：自定义 Hook 和工具函数的区别？**
>
> 工具函数是纯函数，不能使用 `useState`、`useEffect` 等 React Hooks。自定义 Hook 内部可以使用 Hooks，因此可以管理状态、处理副作用。如果逻辑不涉及状态或副作用，就应该是工具函数而不是自定义 Hook。

---

## 练习

### 练习 1：useToggle 实现可折叠面板

**要求**：用 `useToggle` 实现一个可折叠的面板组件，支持展开/收起

**提示**：`useToggle` 直接返回布尔值和切换函数，面板内容用条件渲染控制

**预期效果**：点击标题栏切换展开/收起状态，展开时显示内容区域

```tsx
function CollapsiblePanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, toggleOpen] = useToggle(false);

  return (
    <div style={{ border: '1px solid #ccc', marginBottom: 8 }}>
      <button
        onClick={toggleOpen}
        style={{
          width: '100%',
          padding: 12,
          background: '#f5f5f5',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {isOpen ? '▼' : '▶'} {title}
      </button>
      {isOpen && <div style={{ padding: 12 }}>{children}</div>}
    </div>
  );
}
```

### 练习 2：useDebounce + useFetch 实现搜索（完整版）

**要求**：将上面组合搜索的示例完整实现，并增加"空查询时显示提示"和"加载状态展示"

**提示**：`useDebounce(query, 500)` 防抖输入，`useFetch(url)` 仅在防抖值非空时请求

**预期效果**：输入关键词后延迟 500ms 发起请求，加载中显示 loading，返回结果后展示列表，空查询时显示"请输入搜索关键词"

```tsx
interface SearchResult {
  id: number;
  title: string;
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { data: results, loading, error } = useFetch<SearchResult[]>(
    debouncedQuery
      ? `/api/search?q=${encodeURIComponent(debouncedQuery)}`
      : ''
  );

  return (
    <div>
      <h2>搜索</h2>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="输入关键词..."
        style={{ width: '100%', padding: 8, fontSize: 16 }}
      />

      {!debouncedQuery && (
        <p style={{ color: '#999', marginTop: 16 }}>请输入搜索关键词</p>
      )}

      {loading && <p>搜索中...</p>}

      {error && (
        <p style={{ color: 'red' }}>
          搜索失败：{error}
          <button onClick={() => window.location.reload()}>重试</button>
        </p>
      )}

      {results && results.length === 0 && (
        <p>未找到与 "{debouncedQuery}" 相关的结果</p>
      )}

      {results && results.length > 0 && (
        <ul>
          {results.map(item => (
            <li key={item.id} style={{ padding: '8px 0' }}>
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**关键点**：
- `useDebounce` 和 `useFetch` 各自独立，通过组件组合
- 空 URL 时 `useFetch` 不发起请求（可在内部添加 `if (!url) return` 提前返回）
- 完整的 UI 状态覆盖：空输入、加载中、错误、空结果、有结果

---

## 本模块完成标准

- [ ] 理解自定义 Hook 的命名规范和设计原则
- [ ] 能根据场景选择合适的返回值形式（数组 vs 对象）
- [ ] 能独立实现 `useToggle`、`useDebounce`、`useFetch`
- [ ] 能用多个自定义 Hook 组合实现完整功能
- [ ] 面试时能解释自定义 Hook 与 HOC / Render Props 的区别
