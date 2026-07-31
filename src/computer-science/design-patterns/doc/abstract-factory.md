# 抽象工厂模式（Abstract Factory）

> 📍 **导航**：前置 [factory-method.md](./factory-method.md) ｜ 后续 [builder.md](./builder.md) ｜ 优先级 **P1**

## 意图

提供一个接口，用于创建一族相关或相互依赖的对象，而无需指定它们的具体类。

## 结构（UML 类图）

```mermaid
classDiagram
    class AbstractFactory {
        <<interface>>
        +createButton(): Button
        +createInput(): Input
    }
    class LightThemeFactory {
        +createButton(): Button
        +createInput(): Input
    }
    class DarkThemeFactory {
        +createButton(): Button
        +createInput(): Input
    }
    class Button {
        <<interface>>
    }
    class Input {
        <<interface>>
    }

    AbstractFactory <|.. LightThemeFactory
    AbstractFactory <|.. DarkThemeFactory
    AbstractFactory ..> Button : creates
    AbstractFactory ..> Input : creates
```

## 适用场景

**该用：**
- 系统需要独立于产品的创建和组合方式
- 产品族中的对象需要一起使用、保证兼容性（如 UI 主题、跨平台组件）
- 需要在运行时切换整套产品族（如切换主题、切换数据库驱动）

**不该用：**
- 只创建单一产品——用 Factory Method 足够
- 产品族之间没有约束关系——不需要捆绑创建
- 产品种类频繁增减——每加一种产品需要改所有工厂接口

> 🔍 **对应 Code Smell**：产品族对象混搭导致兼容性问题、产品创建逻辑分散（参考大纲附录速查表）

## 代价与权衡

| 维度 | 说明 |
|------|------|
| 复杂度 | **高**。新增产品种类需要修改抽象工厂接口 + 所有具体工厂 |
| 一致性 | **好**。强制产品族内对象兼容，避免混搭错误 |
| 可测试性 | 好。注入 mock 工厂即可替换整套依赖 |
| 替代方案 | 配置对象 + Factory Method 组合；DI 容器的 named binding |

## TypeScript 实现

```typescript
// 环境：Node.js 18+（使用了 process.env API）
// ===== 产品接口 =====
interface Button {
  render(): string;
}
interface Input {
  render(): string;
}

// ===== 具体产品：Light 主题 =====
class LightButton implements Button {
  render(): string {
    return '<button class="btn-light">Click</button>';
  }
}
class LightInput implements Input {
  render(): string {
    return '<input class="input-light" />';
  }
}

// ===== 具体产品：Dark 主题 =====
class DarkButton implements Button {
  render(): string {
    return '<button class="btn-dark">Click</button>';
  }
}
class DarkInput implements Input {
  render(): string {
    return '<input class="input-dark" />';
  }
}

// ===== 抽象工厂 =====
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
}

class LightThemeFactory implements UIFactory {
  createButton(): Button { return new LightButton(); }
  createInput(): Input { return new LightInput(); }
}

class DarkThemeFactory implements UIFactory {
  createButton(): Button { return new DarkButton(); }
  createInput(): Input { return new DarkInput(); }
}

// ===== 客户端代码：只依赖抽象 =====
function renderForm(factory: UIFactory): string {
  const button = factory.createButton();
  const input = factory.createInput();
  return `<form>${input.render()}${button.render()}</form>`;
}

// 运行时切换主题
const theme: UIFactory = process.env.THEME === 'dark'
  ? new DarkThemeFactory()
  : new LightThemeFactory();

console.log(renderForm(theme));
```

## 真实世界实例

| 框架/库 | 实现方式 |
|---------|---------|
| **跨平台 UI 框架**（Qt/Flutter） | 每个平台一套 Widget 工厂（MaterialFactory / CupertinoFactory） |
| **数据库驱动**（TypeORM） | `DriverFactory` 根据 type 创建 MySQL/Postgres/SQLite 驱动族（Connection + QueryRunner + SchemaBuilder） |
| **Webpack** | `Compiler` 创建一族相关对象（Compilation、Resolver、Parser），不同 target（web/node）产出不同族 |
| **AWS SDK v3** | 每个 service client 内部创建一族 signer + serializer + deserializer |

## 易混淆对比

| 对比 | 区别 |
|------|------|
| Abstract Factory vs Factory Method | Abstract Factory 创建**一族**产品（多个方法）；Factory Method 创建**一个**产品（一个方法） |
| Abstract Factory vs Builder | Abstract Factory 强调产品族的兼容性；Builder 强调单个复杂对象的分步构建 |
| Abstract Factory vs Prototype | Abstract Factory 通过 new 创建；Prototype 通过 clone 创建。当产品族初始化成本高时，可用 Prototype 实现 Abstract Factory |

## 面试速答

> **问：什么场景必须用 Abstract Factory 而不是 Factory Method？**
>
> 答：当产品之间存在兼容性约束、必须成套使用时。例如跨平台 UI：Windows 按钮必须配 Windows 输入框，不能混搭 macOS 组件。Factory Method 每次只创建一个产品，无法保证族内一致性；Abstract Factory 通过一个工厂实例创建整族产品，从结构上杜绝混搭。

> **问：Abstract Factory 的最大缺点是什么？如何缓解？**
>
> 答：最大缺点是新增产品种类时需要修改抽象工厂接口及所有具体工厂（违反 OCP）。缓解方式：用 TS 的泛型 + 映射类型让工厂接口可扩展；或用 DI 容器的 named binding 替代硬编码工厂；也可以将工厂接口拆分为多个小接口（接口隔离），新增产品只新增接口。

> **问：举一个你在工作中遇到的 Abstract Factory 实例。**
>
> 答：典型例子是多环境基础设施创建：生产环境用 Postgres + Redis + RabbitMQ，测试环境用 SQLite + 内存缓存 + 内存队列。定义一个 InfraFactory 接口（createDB / createCache / createMQ），每个环境一个具体工厂。这样切换环境只需替换工厂实例，业务代码零修改，且保证同一环境内的组件版本兼容。

## 关联

- **常配合**：Singleton（工厂实例全局唯一）、Factory Method（抽象工厂的每个方法本质是 Factory Method）
- **架构位置**：在 [software-engineering/](../../software-engineering/software-engineering-learning-outline.md) 第 9 章六边形架构中，Abstract Factory 用于创建适配器族（如同时创建 DB 适配器 + Cache 适配器 + MQ 适配器，保证环境一致性）
