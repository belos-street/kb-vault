# 桥接模式（Bridge）

> 📍 **导航**：前置 [adapter.md](./adapter.md) ｜ 后续 [composite.md](./composite.md) ｜ 优先级 **P2**

## 意图

将抽象部分与它的实现部分分离，使它们都可以独立地变化。核心解决：多维度变化导致的类爆炸问题。

## 结构（UML 类图）

```mermaid
classDiagram
    class Abstraction {
        #impl: Implementor
        +operation(): void
    }
    class RefinedAbstraction {
        +operation(): void
    }
    class Implementor {
        <<interface>>
        +operationImpl(): void
    }
    class ConcreteImplementorA {
        +operationImpl(): void
    }
    class ConcreteImplementorB {
        +operationImpl(): void
    }

    Abstraction --> Implementor : delegates
    Abstraction <|-- RefinedAbstraction
    Implementor <|.. ConcreteImplementorA
    Implementor <|.. ConcreteImplementorB
```

核心思想：用**组合**（持有 Implementor 引用）替代**继承**，将两个独立变化维度拆成两棵类层次。

## 适用场景

**该用：**
- 一个类存在两个或多个独立变化维度（如 UI 组件 × 渲染平台）
- 需要在运行时切换实现（如切换数据库驱动）
- 继承层次因多维度组合而爆炸（M × N 个子类）

**不该用：**
- 只有一个变化维度——普通继承或策略模式即可
- 变化维度在编译期已确定且不会扩展——过度设计

> 🔍 **对应 Code Smell**：多维度变化导致子类爆炸（M×N 个子类）

## 代价与权衡

| 维度 | 说明 |
|------|------|
| 复杂度 | 中高。需要预先识别独立变化维度并设计两层接口 |
| 可扩展性 | **好**。新增抽象或新增实现互不影响，符合开闭原则 |
| 运行时开销 | 多一层间接调用（委托），通常可忽略 |
| 替代方案 | 策略模式（Strategy 更侧重算法替换，Bridge 侧重整体架构分层）；插件系统（更动态但更重） |

> **TS/JS 特化**：React 本身就是 Bridge 的典型案例——组件（抽象）与渲染器（实现）完全分离。`react-dom`、`react-native`、`react-three-fiber` 都是同一抽象的不同 Implementor。

## TypeScript 实现

### 经典实现：消息发送（抽象 × 渠道）

```typescript
// Implementor: 发送渠道
interface MessageChannel {
  send(to: string, content: string): void;
}

class EmailChannel implements MessageChannel {
  send(to: string, content: string): void {
    console.log(`[Email] To: ${to}, Content: ${content}`);
  }
}

class SmsChannel implements MessageChannel {
  send(to: string, content: string): void {
    console.log(`[SMS] To: ${to}, Content: ${content}`);
  }
}

class SlackChannel implements MessageChannel {
  send(to: string, content: string): void {
    console.log(`[Slack] #${to}: ${content}`);
  }
}

// Abstraction: 消息类型
abstract class Message {
  constructor(protected channel: MessageChannel) {}

  abstract send(to: string): void;
}

class TextMessage extends Message {
  constructor(channel: MessageChannel, private readonly text: string) {
    super(channel);
  }

  send(to: string): void {
    this.channel.send(to, this.text);
  }
}

class UrgentMessage extends Message {
  constructor(channel: MessageChannel, private readonly text: string) {
    super(channel);
  }

  send(to: string): void {
    // 紧急消息：重复发送 + 加前缀
    const content = `[URGENT] ${this.text}`;
    this.channel.send(to, content);
    this.channel.send(to, `[Reminder] ${content}`);
  }
}

// 使用：抽象和实现自由组合
const email = new EmailChannel();
const slack = new SlackChannel();

new TextMessage(email, 'Hello').send('alice@example.com');
new UrgentMessage(slack, 'Server down!').send('ops-team');
```

### React 风格的 Bridge（抽象与渲染器分离）

```typescript
// 环境：浏览器环境（使用了 document API）+ Node.js 18+（使用了 process.stdout API）
// Implementor: 渲染器接口
interface Renderer {
  createElement(type: string, props: Record<string, unknown>, children: VNode[]): VNode;
  render(vnode: VNode, container: unknown): void;
}

interface VNode {
  type: string;
  props: Record<string, unknown>;
  children: VNode[];
}

// ConcreteImplementor: DOM 渲染器
class DomRenderer implements Renderer {
  createElement(type: string, props: Record<string, unknown>, children: VNode[]): VNode {
    return { type, props, children };
  }

  render(vnode: VNode, container: unknown): void {
    console.log(`[DOM] Rendering <${vnode.type}> into`, container);
  }
}

// ConcreteImplementor: 终端渲染器
class TerminalRenderer implements Renderer {
  createElement(type: string, props: Record<string, unknown>, children: VNode[]): VNode {
    return { type, props, children };
  }

  render(vnode: VNode, _container: unknown): void {
    console.log(`[Terminal] Drawing "${vnode.type}" with props:`, vnode.props);
  }
}

// Abstraction: 组件系统（不关心渲染到哪里）
class Component {
  constructor(private readonly renderer: Renderer) {}

  createView(type: string, props: Record<string, unknown>, ...children: VNode[]): VNode {
    return this.renderer.createElement(type, props, children);
  }

  mount(vnode: VNode, container: unknown): void {
    this.renderer.render(vnode, container);
  }
}

// 同一组件逻辑，不同渲染目标
const webApp = new Component(new DomRenderer());
const cliApp = new Component(new TerminalRenderer());

const view = webApp.createView('div', { className: 'app' });
webApp.mount(view, document.body);       // DOM 渲染
cliApp.mount(view, process.stdout);      // 终端渲染
```

## 真实世界实例

| 框架/库 | 实现方式 |
|---------|---------|
| **React** | 组件（Abstraction）与渲染器（`react-dom` / `react-native` / `react-test-renderer`）分离 |
| **Vue 3** | `@vue/runtime-core` 是抽象层，`@vue/runtime-dom` / `@vue/runtime-test` 是具体 Implementor |
| **JDBC / TypeORM** | 应用代码（Abstraction）通过 Driver 接口（Implementor）访问不同数据库 |
| **SLF4J / Winston transports** | 日志 API（Abstraction）与输出目标（Console / File / HTTP）分离 |
| **OpenGL / WebGL** | 图形 API 抽象与具体 GPU 驱动实现的分离 |

## 易混淆对比

| 对比 | 区别 |
|------|------|
| Bridge vs Strategy | 结构相似，但意图不同：Bridge 是架构级分层（两个维度独立演化）；Strategy 是行为级替换（同一算法族） |
| Bridge vs Adapter | Bridge 是**设计时**预防类爆炸；Adapter 是**事后**让不兼容接口协作 |
| Bridge vs Abstract Factory | Abstract Factory 可用来创建 Bridge 中 Implementor 的具体实例，二者互补 |

## 面试速答

> **问：Bridge 和 Strategy 结构几乎一样，怎么区分？**
>
> 答：结构确实相似（都是持有一个接口引用并委托），但意图和粒度不同。Strategy 是行为级的——替换一个算法（排序策略、压缩策略），通常只影响一个方法；Bridge 是架构级的——将一整个抽象维度与实现维度分离，两个维度可以独立演化。简单说：Strategy 换一个"做法"，Bridge 换一整个"平台"。

> **问：什么场景下你会主动设计 Bridge，而不是事后补救？**
>
> 答：当你在设计初期就能识别出两个独立变化维度时。比如设计一个跨平台 UI 库，组件类型（Button / Dialog）和渲染目标（Web / Native / Terminal）明显是两个正交维度，如果不用 Bridge 就会产生 M×N 个子类。另一个信号是需求文档中出现"支持多种 X 的多种 Y"这种矩阵式描述时。

> **问：为什么说 React 是 Bridge 模式的典型案例？**
>
> 答：React 将组件描述（Abstraction：JSX / createElement）与渲染实现（Implementor：react-dom / react-native / react-three-fiber）完全分离。同一套组件代码可以渲染到 DOM、原生移动端、3D 场景甚至终端（ink）。`react-reconciler` 是抽象层，各 renderer 是 ConcreteImplementor，这正是 Bridge 的核心结构。

## 关联

- **常配合**：Abstract Factory（创建具体 Implementor）、Adapter（已有实现不符合 Implementor 接口时包装）
- **架构位置**：在 [software-engineering/](../../software-engineering/software-engineering-learning-outline.md) 第 6 章中，Bridge 思想对应"端口与适配器"（Hexagonal Architecture）的核心分层原则
