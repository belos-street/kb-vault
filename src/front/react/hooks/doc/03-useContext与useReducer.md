# 03 - useContext 与 useReducer

> 对应大纲模块 3 | 预计时间：1 天
> 面试可答：`useContext` 消灭层层传递的 Props，`useReducer` 用 dispatch 管理复杂状态逻辑。

---

## 学习目标

- 掌握 `createContext` + `useContext` 的基本模式
- 理解 Context 的性能问题与拆分方案
- 掌握 `useReducer` 的用法及其与 `useState` 的区别
- 能用 Context + Reducer 模拟简易 Redux
- 面试时能解释 Context 的适用场景和局限性

---

## 核心概念

### 1. 什么是 Context？

Context 解决了 **Props Drilling**（逐层传递 props）的问题：

```
// Props Drilling 问题
<App theme="dark">
  <Layout theme="dark">          {/* 不需要 theme，但必须传递 */}
    <Sidebar theme="dark">        {/* 不需要 theme，但必须传递 */}
      <Button theme="dark" />     {/* 终于用到了 */}
    </Sidebar>
  </Layout>
</App>

// 使用 Context
<App>
  <Layout>                        {/* 不关心 theme */}
    <Sidebar>                     {/* 不关心 theme */}
      <Button />                  {/* 直接从 Context 获取 */}
    </Sidebar>
  </Layout>
</App>
```

### 2. 创建与使用 Context

```tsx
import { createContext, useContext, useState } from 'react';

// 1. 创建 Context（附带默认值）
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// 2. 提供 Context（Provider）
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. 消费 Context
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
      }}
    >
      当前主题：{theme}
    </button>
  );
}

// 4. 使用
function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

**核心流程**：`createContext` → `Provider` 包裹 → `useContext` 消费。

### 3. 自定义 Hook 封装 Context

直接暴露 `useContext(ThemeContext)` 容易出现**忘记包裹 Provider** 的情况。推荐用自定义 Hook 封装：

```tsx
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}

// 使用
function ThemedButton() {
  const { theme, toggleTheme } = useTheme(); // 更语义化，且有错误提示
  return <button onClick={toggleTheme}>{theme}</button>;
}
```

### React 19 新增：`use()` API

React 19 引入了 `use()` 函数，可以在**条件语句和循环中**读取 Context，突破了 `useContext` 必须在顶层调用的限制：

```tsx
import { use } from 'react';

function StatusIcon({ isAdmin }: { isAdmin: boolean }) {
  // ✅ React 19：可以在条件语句中读取 Context
  if (isAdmin) {
    const theme = use(ThemeContext);
    return <AdminBadge theme={theme} />;
  }
  return <UserIcon />;
}
```

| 维度 | `useContext`（React 18-） | `use()`（React 19+） |
|------|--------------------------|---------------------|
| 调用位置 | 只能顶层调用 | 可在条件/循环中调用 |
| 本质 | Hook | 特殊函数（不受 Hooks 规则约束） |
| 兼容性 | 所有版本 | 仅 React 19+ |

> **注意**：`use()` 目前只能读取 Context 和 Promise，不能替代所有 Hook。在 React 18 项目中仍应使用 `useContext`。

---

## Context 性能问题与拆分

### 4. Context 会导致不必要的重渲染

**问题**：当 Provider 的 `value` 变化时，所有消费该 Context 的组件都会重渲染，即使它们只用了 `value` 的一部分。

```tsx
const AppContext = createContext<{
  user: User;
  theme: string;
  locale: string;
}>({ user: null, theme: 'light', locale: 'zh' });

// ❌ 问题：locale 变化时，只用了 theme 的组件也会重渲染
function ThemeDisplay() {
  const { theme } = useContext(AppContext); // 只关心 theme
  return <p>{theme}</p>;
}
```

### 5. 拆分 Context

将不同职责的数据放入不同的 Context：

```tsx
const UserContext = createContext<User | null>(null);
const ThemeContext = createContext<string>('light');
const LocaleContext = createContext<string>('zh');

function App() {
  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <LocaleContext.Provider value={locale}>
          <Main />
        </LocaleContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// 只订阅 theme 的组件，locale 变化不会触发重渲染
function ThemeDisplay() {
  const theme = useContext(ThemeContext);
  return <p>{theme}</p>;
}
```

**进阶替代方案**：当 Context 拆分变得过多时，可以考虑原子化状态管理库：
- **Zustand**：轻量、无 Provider、支持选择性订阅
- **Jotai**：原子化状态、按需订阅、自动优化重渲染
- **Redux Toolkit**：大型应用、需要中间件和 DevTools

### 6. 用 useMemo/useCallback 稳定 value

`Provider` 的 `value` 每次渲染都是新对象，即使内容没变也会触发消费者重渲染：

```tsx
// ❌ 问题：每次渲染创建新对象
<ThemeContext.Provider value={{ theme, toggleTheme }}>

// ✅ 正确：用 useMemo 稳定引用
const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
<ThemeContext.Provider value={value}>
```

---

## useReducer — 复杂状态管理

### 7. 基本用法

当状态逻辑复杂（多个子值、依赖旧状态、需要集中管理）时，`useReducer` 比 `useState` 更合适。

```tsx
import { useReducer } from 'react';

interface State {
  count: number;
  step: number;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'setStep'; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'reset':
      return { ...state, count: 0 };
    case 'setStep':
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });

  return (
    <div>
      <p>count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
      <input
        type="number"
        value={state.step}
        onChange={e => dispatch({ type: 'setStep', payload: Number(e.target.value) })}
      />
    </div>
  );
}
```

### 8. useState vs useReducer

| 维度 | useState | useReducer |
|------|----------|------------|
| 适用场景 | 简单状态（1-2 个值） | 复杂状态（多个相关值） |
| 更新方式 | 直接 setState | dispatch(action) → reducer 计算新状态 |
| 状态逻辑 | 分散在各个事件处理中 | 集中在 reducer 函数中 |
| 可测试性 | 需要渲染组件测试 | reducer 是纯函数，可单独测试 |
| 下一个状态依赖上一个 | 函数式更新 `prev => ...` | reducer 天然接收当前 state |

**选择建议**：
- 状态简单（如 `isOpen`、`count`）→ `useState`
- 状态复杂（如表单多字段、多操作互相依赖）→ `useReducer`
- 状态逻辑需要复用 → `useReducer`（reducer 可以抽成独立模块）

### 9. 带初始化函数的 useReducer

类似 `useState` 的惰性初始化：

```tsx
function init(initialCount: number): State {
  return { count: initialCount, step: 1 };
}

function Counter({ initialCount }: { initialCount: number }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);
  //                                                     ^^^ 初始化函数
}
```

`useReducer(reducer, initialArg, init)` 的第三个参数 `init` 会以 `initialArg` 为参数调用，返回初始状态。

---

## Context + Reducer：简易 Redux 模式

### 10. 完整实现

这是 React 官方推荐的替代 Redux 的轻量方案：

```tsx
import { createContext, useContext, useReducer, useMemo, useCallback, useState } from 'react';

// 1. 定义类型
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

type TodoAction =
  | { type: 'add'; payload: string }
  | { type: 'toggle'; payload: number }
  | { type: 'delete'; payload: number }
  | { type: 'setFilter'; payload: TodoState['filter'] };

// 2. 定义 reducer（纯函数，可单独测试）
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: Date.now(), text: action.payload, completed: false },
        ],
      };
    case 'toggle':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    case 'delete':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };
    case 'setFilter':
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}

// 3. 创建 Context
interface TodoContextType {
  state: TodoState;
  dispatch: React.Dispatch<TodoAction>;
  filteredTodos: Todo[];
}

const TodoContext = createContext<TodoContextType | null>(null);

// 4. Provider 组件
function TodoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
  });

  // 派生数据（缓存计算结果）
  const filteredTodos = useMemo(() => {
    switch (state.filter) {
      case 'active':
        return state.todos.filter(t => !t.completed);
      case 'completed':
        return state.todos.filter(t => t.completed);
      default:
        return state.todos;
    }
  }, [state.todos, state.filter]);

  // 稳定 context value 引用
  const value = useMemo(
    () => ({ state, dispatch, filteredTodos }),
    [state, dispatch, filteredTodos]
  );

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

// 5. 自定义 Hook
function useTodo() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo 必须在 TodoProvider 内使用');
  }
  return context;
}

// 6. 使用
function TodoApp() {
  return (
    <TodoProvider>
      <TodoInput />
      <TodoFilter />
      <TodoList />
    </TodoProvider>
  );
}

function TodoInput() {
  const { dispatch } = useTodo();
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      dispatch({ type: 'add', payload: text });
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button type="submit">添加</button>
    </form>
  );
}

function TodoFilter() {
  const { state, dispatch } = useTodo();

  return (
    <div>
      {(['all', 'active', 'completed'] as const).map(f => (
        <button
          key={f}
          onClick={() => dispatch({ type: 'setFilter', payload: f })}
          style={{ fontWeight: state.filter === f ? 'bold' : 'normal' }}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

function TodoList() {
  const { filteredTodos, dispatch } = useTodo();

  return (
    <ul>
      {filteredTodos.map(todo => (
        <li key={todo.id}>
          <span
            onClick={() => dispatch({ type: 'toggle', payload: todo.id })}
            style={{
              textDecoration: todo.completed ? 'line-through' : 'none',
              cursor: 'pointer',
            }}
          >
            {todo.text}
          </span>
          <button onClick={() => dispatch({ type: 'delete', payload: todo.id })}>
            删除
          </button>
        </li>
      ))}
    </ul>
  );
}
```

**模式总结**：
- **reducer**：纯函数，集中管理状态逻辑，可单独测试
- **Context**：将 `state` 和 `dispatch` 传递给任意深层组件
- **useMemo/useCallback**：稳定引用，避免不必要的重渲染

---

## 常见踩坑点

### 1. Provider 放错位置导致状态重置

```tsx
// ❌ 问题：Provider 放在使用它的组件内部，每次重渲染都重新创建
function Page() {
  return (
    <UserProvider>  {/* 每次 Page 重渲染，UserProvider 都会重新挂载 */}
      <UserProfile />
    </UserProvider>
  );
}

// ✅ 正确：Provider 放在上层组件
function App() {
  return (
    <UserProvider>  {/* 只创建一次 */}
      <Page />
    </UserProvider>
  );
}
```

### 2. Context value 不是引用稳定

```tsx
// ❌ 问题：每次渲染创建新对象，消费者每次都重渲染
<ThemeContext.Provider value={{ theme, toggleTheme }}>

// ✅ 正确：useMemo 稳定引用
const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
<ThemeContext.Provider value={value}>
```

### 3. 用一个大 Context 存所有状态

```tsx
// ❌ 问题：任何子状态变化，所有消费者都重渲染
const AppContext = createContext({ user, theme, locale, cart, notifications });

// ✅ 正确：按职责拆分
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const LocaleContext = createContext(locale);
```

### 4. 在 reducer 中执行副作用

```tsx
// ❌ 错误：reducer 应该是纯函数
function reducer(state: State, action: Action): State {
  if (action.type === 'fetch') {
    fetch('/api/data'); // ❌ 副作用不应该在这里
    return state;
  }
  return state;
}

// ✅ 正确：副作用放在 dispatch 的调用处
const handleFetch = async () => {
  const data = await fetch('/api/data').then(r => r.json());
  dispatch({ type: 'setData', payload: data });
};
```

---

## 面试高频问题

### Q1：useContext 什么时候会导致性能问题？

**答**：当 Provider 的 `value` 变化时，**所有**消费该 Context 的组件都会重渲染，即使它们只用了 `value` 的一部分。解决方案：(1) 拆分 Context，按职责分离；(2) 用 `useMemo` 稳定 `value` 引用；(3) 将频繁变化的值和稳定值放入不同 Context。

### Q2：useReducer 和 Redux 有什么区别？

**答**：`useReducer` + Context 是 React 内置的轻量状态管理方案，适合中小型应用。Redux 额外提供了中间件（thunk/saga）、DevTools 时间旅行、状态持久化等能力，适合大型复杂应用。如果只是需要跨组件共享状态，Context + Reducer 就够了；如果需要异步流程管理、状态调试工具，Redux 更合适。

### Q3：为什么 Context 不适合高频更新的状态？

**答**：Context 没有"选择性订阅"机制——消费者无法只订阅 `value` 的某个子字段。任何 `value` 变化都会触发所有消费者重渲染。对于高频更新（如鼠标位置、输入框内容），会导致大量无关组件重渲染。这种情况更适合用 `useRef` + 事件监听，或者外部状态管理库（Zustand、Jotai）。

### Q4：reducer 为什么应该是纯函数？

**答**：纯函数保证**相同输入 → 相同输出**，这让 reducer 可以独立测试、支持时间旅行调试（Redux DevTools 的核心原理）、避免竞态条件。如果 reducer 包含副作用，就无法保证确定性，调试也会变得困难。

---

## 面试回答模板

> **问：介绍一下 useContext？**
>
> `useContext` 用于消费 Context，解决 Props Drilling 问题。通过 `createContext` 创建 Context，用 `Provider` 包裹组件树提供数据，深层组件用 `useContext` 直接获取。注意性能问题：Provider 的 `value` 变化会触发所有消费者重渲染，所以需要按职责拆分 Context，并用 `useMemo` 稳定 `value` 引用。

> **问：useReducer 适合什么场景？**
>
> `useReducer` 适合复杂状态逻辑——多个子值相互依赖、需要集中管理的状态变更。典型用法是 Context + Reducer 模式，模拟 Redux：reducer 是纯函数处理所有状态变更，Context 跨组件传递 `state` 和 `dispatch`。好处是状态逻辑集中、可测试性强，适合中型应用。

---

## 练习

### 练习 1：主题切换 Context

**要求**：实现亮/暗模式切换，支持通过自定义 Hook 在任意组件中获取和切换主题

**提示**：`createContext` + `Provider` + 自定义 `useTheme` Hook，用 `useMemo` 稳定 value 引用

**预期效果**：点击按钮后页面背景和文字颜色立即切换，多个消费组件同步更新

```tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用');
  return ctx;
}

// 使用
function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header
      style={{
        background: theme === 'dark' ? '#222' : '#f5f5f5',
        color: theme === 'dark' ? '#fff' : '#333',
      }}
    >
      <h1>我的应用</h1>
      <button onClick={toggleTheme}>切换主题</button>
    </header>
  );
}
```

### 练习 2：购物车 useReducer

**要求**：用 `useReducer` 实现购物车的增删改查

**提示**：定义 `cartReducer` 纯函数，处理 add/remove/updateQuantity/clear 四种 action

**预期效果**：点击添加按钮后商品出现在列表中，已有商品数量+1；删除按钮移除对应商品；底部显示总价

```tsx
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

type CartAction =
  | { type: 'add'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'remove'; payload: number }
  | { type: 'updateQuantity'; payload: { id: number; quantity: number } }
  | { type: 'clear' };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const existing = state.find(item => item.id === action.payload.id);
      if (existing) {
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { ...action.payload, quantity: 1 }];
    }
    case 'remove':
      return state.filter(item => item.id !== action.payload);
    case 'updateQuantity':
      return state.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    case 'clear':
      return [];
    default:
      return state;
  }
}

function Cart() {
  const [items, dispatch] = useReducer(cartReducer, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <div>
      <button onClick={() => dispatch({ type: 'add', payload: { id: 1, name: '商品A', price: 100 } })}>
        添加商品A
      </button>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} x{item.quantity} = {item.price * item.quantity}元
            <button onClick={() => dispatch({ type: 'remove', payload: item.id })}>
              删除
            </button>
          </li>
        ))}
      </ul>
      <p>总计：{total}元</p>
      <button onClick={() => dispatch({ type: 'clear' })}>清空</button>
    </div>
  );
}
```

**关键点**：
- `cartReducer` 是纯函数，可以单独写单元测试
- `add` 操作有"已存在则数量+1"的逻辑，集中在 reducer 中处理
- `useMemo` 缓存总价计算

---

## 本模块完成标准

- [ ] 能用 `createContext` + `useContext` 实现跨组件数据共享
- [ ] 理解 Context 的性能问题及拆分方案
- [ ] 能用 `useReducer` 管理复杂状态逻辑
- [ ] 能用 Context + Reducer 模式搭建轻量状态管理
- [ ] 面试时能解释 Context 与 Redux 的适用场景差异
