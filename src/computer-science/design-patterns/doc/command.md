# 命令模式（Command）

> 📍 **导航**：前置 [chain-of-responsibility.md](./chain-of-responsibility.md) ｜ 后续 [interpreter.md](./interpreter.md) ｜ 优先级 **P1**

## 意图

将请求封装为对象，从而可以用不同的请求对客户端进行参数化，支持请求的排队、记录、撤销与重做。

## 结构（UML 类图）

```mermaid
classDiagram
    class Invoker {
        -history: Command[]
        +execute(cmd: Command): void
        +undo(): void
    }
    class Command {
        <<interface>>
        +execute(): void
        +undo(): void
    }
    class InsertTextCommand {
        -editor: Editor
        -text: string
        -position: number
        +execute(): void
        +undo(): void
    }
    class DeleteTextCommand {
        -editor: Editor
        -start: number
        -end: number
        -deleted: string
        +execute(): void
        +undo(): void
    }
    class Editor {
        +content: string
        +insert(pos: number, text: string): void
        +delete(start: number, end: number): string
    }

    Invoker --> Command
    Command <|.. InsertTextCommand
    Command <|.. DeleteTextCommand
    InsertTextCommand --> Editor
    DeleteTextCommand --> Editor
```

核心思想：
- 将"做什么"和"怎么做"封装为对象
- Invoker 不关心具体操作内容，只负责调度
- 命令对象携带执行所需的全部上下文

## 适用场景

**该用：**
- 需要撤销/重做（Undo/Redo）功能
- 需要操作日志、事务回滚
- 需要将操作排队、延迟执行或远程发送
- 宏命令（批量操作组合）

**不该用：**
- 简单的函数调用就能解决——无需额外封装
- 操作不可逆（如发送邮件），undo 无意义
- 状态变更极其频繁（每帧 60 次），命令对象开销过大

> 🔍 **对应 Code Smell**：需要撤销/重做但操作散落各处、操作日志难以维护

## 代价与权衡

| 维度 | 说明 |
|------|------|
| 复杂度 | 中。每个操作需要一个 Command 类/对象 |
| 内存 | 历史栈会持续增长，需要限制或压缩 |
| 可测试性 | **好**。命令是纯数据对象，易于序列化和断言 |
| 可追溯性 | **好**。所有操作有记录，可审计 |
| 替代方案 | 直接函数调用、Event Sourcing、Redux-style reducer |

> **TS/JS 特化**：Redux 的 Action 就是命令模式的函数式变体——`{ type: 'ADD_TODO', payload: {...} }` 是一个可序列化的命令对象。不需要 class，plain object + type 字面量即可。

## TypeScript 实现

### 经典 Command + Undo/Redo

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  content = '';

  insert(position: number, text: string): void {
    this.content =
      this.content.slice(0, position) + text + this.content.slice(position);
  }

  delete(start: number, end: number): string {
    const deleted = this.content.slice(start, end);
    this.content = this.content.slice(0, start) + this.content.slice(end);
    return deleted;
  }
}

class InsertCommand implements Command {
  constructor(
    private editor: TextEditor,
    private position: number,
    private text: string
  ) {}

  execute(): void {
    this.editor.insert(this.position, this.text);
  }

  undo(): void {
    this.editor.delete(this.position, this.position + this.text.length);
  }
}

class DeleteCommand implements Command {
  private deleted = '';

  constructor(
    private editor: TextEditor,
    private start: number,
    private end: number
  ) {}

  execute(): void {
    this.deleted = this.editor.delete(this.start, this.end);
  }

  undo(): void {
    this.editor.insert(this.start, this.deleted);
  }
}

class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  execute(cmd: Command): void {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack = []; // 新操作清空 redo 栈
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.undoStack.push(cmd);
  }
}

// 使用
const editor = new TextEditor();
const history = new CommandHistory();

history.execute(new InsertCommand(editor, 0, 'Hello World'));
console.log(editor.content); // "Hello World"

history.execute(new DeleteCommand(editor, 5, 11));
console.log(editor.content); // "Hello"

history.undo();
console.log(editor.content); // "Hello World"

history.redo();
console.log(editor.content); // "Hello"
```

### Redux 风格（函数式命令）

```typescript
// Action = 命令对象（可序列化的 plain object）
type Action =
  | { type: 'ADD_TODO'; payload: { id: number; text: string } }
  | { type: 'TOGGLE_TODO'; payload: { id: number } }
  | { type: 'REMOVE_TODO'; payload: { id: number } };

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type State = { todos: Todo[] };

// Reducer = 命令处理器（纯函数）
function todoReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        todos: [
          ...state.todos,
          { id: action.payload.id, text: action.payload.text, done: false },
        ],
      };
    case 'TOGGLE_TODO':
      return {
        todos: state.todos.map((t) =>
          t.id === action.payload.id ? { ...t, done: !t.done } : t
        ),
      };
    case 'REMOVE_TODO':
      return {
        todos: state.todos.filter((t) => t.id !== action.payload.id),
      };
  }
}

// Store = Invoker（调度命令 + 保存历史）
function createStore(reducer: (s: State, a: Action) => State) {
  let state: State = { todos: [] };
  const history: Action[] = [];

  return {
    getState: () => state,
    dispatch(action: Action) {
      history.push(action);
      state = reducer(state, action);
    },
    getHistory: () => [...history],
  };
}

const store = createStore(todoReducer);
store.dispatch({ type: 'ADD_TODO', payload: { id: 1, text: 'Learn Command Pattern' } });
store.dispatch({ type: 'TOGGLE_TODO', payload: { id: 1 } });
console.log(store.getState().todos); // [{ id: 1, text: '...', done: true }]
```

## 真实世界实例

| 框架/库 | 实现方式 |
|---------|---------|
| **Redux** | Action 对象即命令，`dispatch(action)` 即 Invoker 执行命令 |
| **VS Code** | `vscode.commands.registerCommand` / `executeCommand`，支持撤销 |
| **DOM `execCommand`**（已废弃） | `document.execCommand('bold')` 将编辑操作封装为命令 |
| **Git** | 每个 commit 是一个命令记录，`git revert` 是 undo |
| **Photoshop / Figma** | 操作历史面板，每步操作是 Command 对象，支持多步撤销 |

## 易混淆对比

| 对比 | 区别 |
|------|------|
| Command vs Strategy | Command 封装**一次操作**（含上下文）；Strategy 封装**一种算法**（可替换） |
| Command vs Memento | Command 记录操作本身（可重放）；Memento 记录状态快照（不可重放） |
| Command vs Event | Event 是已发生的通知（过去时）；Command 是待执行的请求（将来时） |

## 面试速答

> **问：Redux 的 Action 是命令模式吗？为什么？**
>
> 答：是的，可以看作命令模式的函数式变体。Action 是 `{ type, payload }` 的可序列化纯数据对象，封装了"做什么"；reducer 是命令处理器，store 的 `dispatch` 扮演 Invoker 角色。区别在于经典 Command 用 class 携带 `execute/undo` 方法，而 Redux 把行为下沉到纯函数 reducer，命令本身保持无行为、可序列化，便于时间旅行调试。

> **问：Command 和 Event 有什么区别？**
>
> 答：语义时态不同：Command 是待执行的请求（将来时），表达意图，通常只有一个接收者去执行；Event 是已发生事实的通知（过去时），可被零到多个订阅者消费。Command 可以被拒绝、排队、撤销，发送方对结果有预期；Event 只是广播，发布者不关心也没法控制谁来响应。

> **问：如何实现一个支持撤销/重做的编辑器？**
>
> 答：核心是维护 undo/redo 两个栈。每次操作封装成带 `execute()` 和 `undo()` 的 Command 对象，执行时压入 undo 栈并清空 redo 栈；撤销时弹出 undo 栈顶命令调用 `undo()` 再压入 redo 栈，重做则反向。另一种思路是 Memento 快照式，直接保存状态副本，实现简单但内存开销大；命令式更省内存且可重放。

## 关联

- **常配合**：Memento（实现 undo 时保存状态快照）、Composite（宏命令 = 命令的组合）、Chain of Responsibility（命令沿链传递）
- **架构位置**：在 [software-engineering/](../../software-engineering/software-engineering-learning-outline.md) 第 10 章中，CQRS 和 Event Sourcing 是命令模式在架构层面的延伸
