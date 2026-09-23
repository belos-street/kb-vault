# 00 预备：设计理念与 CLI 上手

> 所属大纲：[readme.md](../readme.md) ｜ 预计：0.5 天 ｜ 前置：无（本篇是整套教程的起点）

**一句话定位**：写给没接触过 Nest/Angular 式设计理念的人——先把「装饰器是什么、DI 在解决什么问题」铺平，再用 CLI 跑起第一个项目，02 篇直接进原理不卡壳。

**面试可答**：装饰器是 TS 的实验性语法特性（类/方法/参数/属性装饰器），配合 `reflect-metadata` 把元数据写到类与方法上；Nest 用装饰器做声明式注册，DI 容器按元数据自动完成依赖的创建与接线——把「业务逻辑」和「对象组装」分离。

---

## 1. 为什么需要架构框架：裸写的三个痛点

用一个 Hono 例子复现日常（Express 同理）。假设有 `UserRepository` / `AuditLogger` / `UserService` 三个类：

```ts
// 裸框架的日常：组装靠手，边界靠自觉
import { Hono } from 'hono'
import { UserService } from './user.service'
import { UserRepository } from './user.repository'
import { AuditLogger } from './audit.logger'

const app = new Hono()

app.post('/users', async (c) => {
  // 痛点 1：每个路由手动组装依赖，接错线只有运行时才知道
  const repo = new UserRepository(c.env.DB)
  const audit = new AuditLogger(c.env.DB)   // AuditLogger 内部很可能又自己 new 了一遍 repo
  const svc = new UserService(repo, audit)
  // 痛点 2：鉴权、审计、耗时日志这类横切逻辑，只能在每个路由里复制粘贴
  // 痛点 3：UserService 构造参数一变，全项目每个 new 它的地方都要跟着改
  return c.json(await svc.create(await c.req.json()))
})
```

三个痛点的共性：**「对象怎么造、怎么接线」散落在业务代码里**。服务一多，组装逻辑比业务逻辑还多。架构框架要做的事只有一件——把「对象组装」从业务代码里抽出去，集中交给一个**容器**。Nest 的全部魔法都建立在这一点上。

## 2. 装饰器语法 15 分钟补课

Nest 代码里铺天盖地的 `@Injectable()` / `@Get()` 都是装饰器。不搞懂它，后面每篇都在「背咒语」。

```json
// tsconfig.json —— 装饰器是 TS 实验性语法，需显式开启
// （Nest 脚手架已配好，这里只需知道两个开关在干什么）
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

```ts
import 'reflect-metadata'

// 类装饰器：拿到类本身——Nest 用它把类「登记」成 Provider/Controller
function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('role', 'provider', target)
  }
}

// 方法装饰器：拿到「原型 + 方法名 + 描述符」——Nest 用它注册路由
function Get(path: string): MethodDecorator {
  return (target, key) => {
    Reflect.defineMetadata('route', `GET ${path}`, target, key)
  }
}

// 参数装饰器：拿到「参数下标」——@Body/@Param 的本体
function Body(): ParameterDecorator {
  return (target, key, index) => {
    Reflect.defineMetadata('source', 'body', target, key, index)
  }
}

@Injectable()
class UserController {
  @Get('/users')
  create(@Body() dto: unknown) {}
}
```

两个关键角色：

- **装饰器 = 声明处执行的函数**：`@Get('/users')` 不「处理」任何请求，它只在类被定义时执行一次，把「这个方法管 `/users`」写进元数据表。请求的真正分发是 Nest 容器启动后读表完成的——这就是「声明式注册」。
- **`emitDecoratorMetadata` + `reflect-metadata`**：TS 编译时把「设计时类型」（构造参数类型等）作为元数据写进代码；`reflect-metadata` 是 `Reflect.defineMetadata/getMetadata` 这套 API 的 polyfill。二者合起来，容器的「按类型自动注入」才有数据可读——02 篇原理的地基。

## 3. DI 心智预演：30 行极简容器

先看容器解决痛点 1 的最小形态（第 1 节同一套业务角色，可直接跑）：

```ts
class UserRepository {
  find(id: number) {
    return { id, name: 'anonym' }
  }
}
class AuditLogger {
  constructor(private repo: UserRepository) {}
  log(action: string) {
    console.log(`[audit] ${action}`)
  }
}
class UserService {
  constructor(private repo: UserRepository, private audit: AuditLogger) {}
  get(id: number) {
    this.audit.log(`query user ${id}`)
    return this.repo.find(id)
  }
}

// ---- 极简容器：注册 → 解析 → 缓存 ----
type Factory<T> = (c: Container) => T

class Container {
  private factories = new Map<Function, Factory<object>>()
  private cache = new Map<Function, object>()

  register<T extends object>(token: Function, factory: Factory<T>): this {
    this.factories.set(token, factory)
    return this
  }

  resolve<T extends object>(token: Function): T {
    if (this.cache.has(token)) return this.cache.get(token) as T  // 单例：二次解析命中缓存
    const factory = this.factories.get(token)
    if (!factory) throw new Error(`未注册的依赖：${token.name}`)   // 接错线在「解析期」就炸，不留到线上
    const instance = factory(this)
    this.cache.set(token, instance)
    return instance as T
  }
}

// 组装逻辑集中一处；业务类只声明「我要什么」，不关心「它从哪来」
const c = new Container()
c.register(UserRepository, () => new UserRepository())
c.register(AuditLogger, () => new AuditLogger(c.resolve(UserRepository)))
c.register(UserService, () => new UserService(c.resolve(UserRepository), c.resolve(AuditLogger)))

const userService = c.resolve(UserService)   // 整条依赖链一次性接好
userService.get(1)                           // [audit] query user 1
```

> 💡 **Nest = 把上面这件事自动化**：① 注册代码不用写——`@Injectable()` 装饰器就是登记动作；② token 不用手填——`emitDecoratorMetadata` 把构造参数类型写成元数据，容器「按类型」递归解析；③ 缓存（单例）、作用域、循环依赖检测全部内置。02 篇拆原理，03 篇讲模块怎么划分这张注册表的可见范围。

## 4. CLI 首次上手：跑起第一个项目

```bash
# Node ≥ 22.12（CLI schematics 门槛更高：22.22.3+，见大纲「版本与安全基线」）
npm i -g @nestjs/cli@latest
nest new hello-nest
# ? Which package manager would you ❤️ to use?  → 任选（本仓库惯例 Bun/npM 均可）
# ? Would you like to use ES Modules?           → Y（本教程基线 ESM）

cd hello-nest
nest start --watch   # 改代码自动重启
```

脚手架生成的 `src/` 只有四个文件，正好对应心智模型：

```
hello-nest/src/
├── main.ts              # 启动器：NestFactory.create(AppModule) → 容器在这里组装一切
├── app.module.ts        # 组装层：模块边界，声明本模块有哪些 controller / provider
├── app.controller.ts    # HTTP 层：@Controller() + @Get()，调 appService.getHello()
└── app.service.ts       # 业务层：@Injectable() Provider，返回 'Hello World!'
```

对照第 1 节的三个痛点验收：

- **痛点 1**：`AppController` 的构造函数只写了 `constructor(private appService: AppService)`，没有任何 `new`——依赖接线发生在 `NestFactory.create(AppModule)` 内部（练习 3 验证）
- **痛点 3**：给 `AppService` 加构造依赖只改 service 自己，controller 不动
- **痛点 2**：横切逻辑有统一挂载点——Guard / Interceptor / Filter（05 / 07 篇展开）

> 💡 01 篇练习会把这个项目换成 Fastify adapter——controller/service 完全不用动，这正是「架构层与 HTTP 引擎解耦」的现场演示。CLI 的日常用法（`nest generate` 全家桶）见 16 篇速查。

---

## 5. ✍️ 练习：跑通脚手架并找到「接线点」

**要求**：

1. 完成 CLI 上手，`nest start --watch` 跑通，`curl localhost:3000` 拿到 Hello World
2. 改造 `getHello(name: string)` 返回 `Hello, ${name}!`，controller 侧传入 `query.name`（缺省给 `'World'`）——体会 controller（HTTP 层）→ service（业务层）的单向调用
3. 在 `AppService` 的 `constructor` 里加一行 `console.log('AppService 被创建了')`，然后用 `--watch` 改几次代码触发重启，观察日志

**预期效果**：响应变成 `Hello, <你的名字>!`；无论重启热更多少次、请求多少次，`AppService 被创建了` 只打印一次——容器缓存了单例（第 3 节的 `cache` 的现实版）。找「接线点」：`main.ts` 的 `NestFactory.create(AppModule)`，答案在 02 篇展开。

---

## 6. 💬 面试问答

**Q1：装饰器本质上是什么？Nest 为什么重度依赖它？**

本质是「在声明处执行的函数」：类/方法/参数/属性四类，各自拿到不同的定位信息（类本身、原型+方法名、参数下标）。Nest 依赖它做两件事——**声明式注册**（`@Injectable()` 执行即登记，业务代码零组装样板）与**元数据编程**（配合 `emitDecoratorMetadata` 把类型信息写成数据，容器按类型注入）。代价是引入实验性语法与 `reflect-metadata` 依赖——换来的是 Angular/Spring 同源的架构表达力。

**Q2：没有容器的代码为什么难测？**

`new` 写死在业务代码里，替换依赖必须改源码。容器把「组装」收口到一处后，测试时只需在容器层把某个 token 换成 mock（Nest 里是 `Test.createTestingModule().overrideProvider()`，12 篇展开）——被测类源码零改动。这是「依赖注入」与「依赖查找」的本质区别：前者被动接收依赖，主动权在外部。

**Q3：30 行手写容器和 Nest 容器的差距在哪？**

三点：① **按类型自动解析**——Nest 读 `design:paramtypes` 元数据递归构造依赖树，手写容器每个 token 要手动登记；② **生命周期作用域**——DEFAULT/REQUEST/TRANSIENT 三种（02 篇），手写容器只有全局单例；③ **模块可见性**——Provider 不全局可见，由模块 imports/exports 管控边界（03 篇），外加循环依赖检测。手写容器的价值在建立心智模型，生产直接用 Nest。

---

## 7. 🔗 参考资料

- TS 装饰器：https://www.typescriptlang.org/docs/handbook/decorators.html
- reflect-metadata：https://github.com/rbuckton/reflect-metadata
- Nest Overview（第一屏就是本篇的脚手架结构）：https://docs.nestjs.com/
- CLI 概览：https://docs.nestjs.com/cli/overview

---

## 📌 小结

- 架构框架解决的是「对象组装」散落问题：痛点 1（手动 new）、痛点 2（横切复制粘贴）、痛点 3（改构造牵连全局）
- 装饰器 = 声明处执行的函数 + 元数据写入；`emitDecoratorMetadata` + `reflect-metadata` 让容器按类型注入成为可能
- 30 行极简容器覆盖 DI 三步：注册 → 解析 → 缓存；Nest 把三步全部自动化
- 脚手架四文件各就各位：main（启动）/ module（组装）/ controller（HTTP）/ service（业务）——这套结构贯穿全部 15 篇主线
