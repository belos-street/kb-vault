# 02 IoC 容器与 DI

> 所属大纲：[readme.md](../readme.md) ｜ 预计：1 天 ｜ 前置：01

**一句话定位**：一切的基础——Provider 怎么被解析、三种作用域的代价、循环依赖怎么破。读完能手写一个迷你 IoC 容器验证心智模型。

**面试可答**：Nest 通过 `@Injectable()` 装饰器 + `reflect-metadata` 收集构造参数类型元数据，容器启动时构建依赖图，按 token 拓扑解析并缓存单例；DI 的直接红利是可测试性——测试时在模块级 `.overrideProvider()` 换掉任意 Provider 即可。

---

## 1. 原理：Nest 怎么知道该注入什么

两个前提条件：

1. `tsconfig.json` 开启 `emitDecoratorMetadata: true`（脚手架默认开启）——TS 编译器给**有装饰器的类**的构造函数参数发射 `design:paramtypes` 元数据，值是各参数的构造函数引用数组
2. `@Injectable()` 让类成为「可被容器管理」的合法目标

自己验证一遍元数据长什么样：

```ts
import 'reflect-metadata'
import { Injectable } from '@nestjs/common'

@Injectable()
class Db {}

@Injectable()
class UserService {
  constructor(private readonly db: Db) {}
}

Reflect.getMetadata('design:paramtypes', UserService)
// => [ [class Db] ]  ← 构造参数的构造函数引用数组
```

启动期容器做的事就是**读这张表 → 建依赖图 → 按拓扑序 `new` → 缓存**。装饰器本身不干活，只往 `Reflect` 里塞标签——这就是「Nest 的 DI 是纯运行时机制，不依赖 emit 转译魔法」的准确说法（依赖的是编译期发射的元数据）。

> 💡 `@Injectable()` 只是 `Reflect.defineMetadata` 的封装之一。Nest 里所有装饰器（`@Controller`、`@Module`…）本质都是元数据标签，容器是唯一的读标签人——这个视角贯穿 03 篇的动态模块。

## 2. Provider 五种形态

Provider = 「token + 怎么造出实例」的登记项。`@Injectable()` 类只是其中最常见的一种：

| 形态 | 写法 | 适用场景 |
|------|------|---------|
| class provider | `@Injectable()` + 注册进 providers | 默认，绝大多数 Service |
| value | `{ provide: 'CONFIG', useValue: {...} }` | 常量、测试注入的假对象 |
| existing | `{ provide: 'ALIAS', useExisting: Db }` | token 别名、复用已有实例 |
| factory（同步） | `{ provide: 'POOL', useFactory: () => create() }` | 需要构造逻辑的实例 |
| factory（异步） | `{ provide: 'DB', useFactory: () => prisma.$connect(), inject: [...] }` | 连接池、SDK 初始化 |

```ts
@Module({
  providers: [
    UserService,                          // class token：类自己就是 token
    { provide: 'APP_NAME', useValue: 'kb-api' },
    { provide: 'DbAlias', useExisting: Db },
    {
      provide: 'DB_POOL',
      inject: [ConfigService],            // 工厂还能自己声明依赖
      useFactory: (config: ConfigService) =>
        createPool(config.get('dbUrl')),
    },
  ],
})
export class AppModule {}
```

非类 token 注入时必须显式 `@Inject()`（构造参数类型推导只对类 token 生效）：

```ts
constructor(
  @Inject('APP_NAME') private readonly appName: string,
  @Inject('DB_POOL') private readonly pool: Pool,
) {}
```

**异步 Provider**：`useFactory` 返回 Promise 时，容器会在应用启动（`listen` 之前）await 它——这就是 PrismaService 用 `onModuleInit` 连库、或直接用异步工厂预热的两条路线的由来（08 篇落地）。

## 3. 三种作用域：DEFAULT / REQUEST / TRANSIENT

| 作用域 | 实例生命周期 | 代价 |
|--------|-------------|------|
| DEFAULT（默认） | 应用级单例，启动时解析缓存 | 无 |
| REQUEST | **每个请求**新实例，请求结束丢弃 | 每请求重建整条注入链 + GC 压力 |
| TRANSIENT | **每次注入点**新实例，永不共享 | 消费方各自持有独立实例 |

```ts
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {}
```

两条铁律：

1. **注入链向下传染**：注入 REQUEST provider 的宿主也必须声明 REQUEST（或 TRANSIENT），否则 Nest 会拒绝启动——单例缓存一个请求级实例是逻辑错误
2. **REQUEST 是性能税**：请求级图重建发生在热路径上。高频误用是「把 userId 塞进 REQUEST provider 传给 Service」——正确姿势是 CLS（AsyncLocalStorage，08 篇的 `@nestjs-cls`），零作用域传染拿到请求上下文

> ⚠️ 面试追问高发：「什么时候真需要 REQUEST？」——实例内聚合了请求态且方法签名不便传参的场景（如多租户上下文聚合器）。默认答案应该是「能用 DEFAULT + 显式传参就不用 REQUEST」。

## 4. 循环依赖：机制与设计层解法

A 注入 B、B 注入 A 时，两边都还在半初始化状态，`design:paramtypes` 读不到对方。运行期解法是 `forwardRef`——延迟解析：

```ts
// a.service.ts
@Injectable()
export class AService {
  constructor(
    @Inject(forwardRef(() => BService))
    private readonly bService: BService,
  ) {}
}

// b.service.ts —— 双向都要标
@Injectable()
export class BService {
  constructor(
    @Inject(forwardRef(() => AService))
    private readonly aService: AService,
  ) {}
}
```

`forwardRef` 是**止痛药不是处方**——它掩盖了设计问题。设计层解法按优先级：

1. **重新划分模块边界**：A、B 互相依赖说明它们同属一个域，合并模块
2. **抽公共依赖**：共享逻辑下沉到第三个模块，两者都依赖它（DAG 化）
3. **事件解耦**：A 发事件、B 订阅，调用链变通知链（14 篇 EventEmitter2 落地）

> 💡 03 篇会看到循环依赖在**模块层**同样存在（Module A imports B、B imports A）——解法同构。

## 5. ModuleRef 与全局 Provider

- `ModuleRef`：运行时按 token 手动解析，典型用途是「按配置决定实例化哪个实现」：

```ts
@Injectable()
export class StorageFactory {
  constructor(private readonly moduleRef: ModuleRef) {}

  create(driver: 's3' | 'oss'): StorageClient {
    return this.moduleRef.get(driver === 's3' ? S3Client : OssClient)
  }
}
```

- 全局 Provider：`@Global()` 模块（如 ConfigModule）导出的 Provider 全应用可见，免逐模块 imports（03 篇展开）；跨模块注册 Guard/Interceptor/Filter 用 `APP_GUARD` / `APP_INTERCEPTOR` / `APP_FILTER` token（05/07 篇用）。

## 6. 可测试性红利：DI 的最终目的

容器让「替换依赖」变成模块级配置，而不是 monkey-patch：

```ts
const moduleRef = await Test.createTestingModule({
  providers: [UserService],
})
  .overrideProvider(Db)                    // 类 token 直接换
  .useValue({ query: () => Promise.resolve([]) })
  .compile()

const service = moduleRef.get(UserService) // 拿到的是注入了 mock 的实例
```

这正是 12 篇单测范式的全部基础——Nest 单测好写的根因不在测试库，在 DI。

---

## 7. ✍️ 练习：手写一个迷你 IoC 容器（50 行内）

**要求**：只依赖 `reflect-metadata`，实现 `register`（按 `design:paramtypes` 收集依赖）与 `resolve`（递归实例化 + 单例缓存），跑通三层的 `UserService → Db` 注入。

**提示**：

- 核心只有三步：`Reflect.getMetadata('design:paramtypes', Target)` 拿依赖 → `new` 前先递归 `resolve` 每个依赖 → 用 `Map` 缓存实例
- 单例缓存是 DEFAULT 作用域的本质——缓存命中即跳过构造
- 类**必须带装饰器**才有元数据——裸类的注入结果是 `undefined`（本练习最常见的翻车点，也是第 1 节规则的镜像）
- strict 模式两个类型坑：`Function` 不可构造（要写构造签名），泛型无法从 token 推导（调用处显式标注）

**参考实现（先自己写再看）**：

```ts
// mini-ioc.ts
import 'reflect-metadata'

type Token = string | Function
type Constructable = new (...args: any[]) => object
interface Entry { factory: Constructable, deps: Token[] }

class Container {
  private registry = new Map<Token, Entry>()
  private instances = new Map<Token, object>()

  register(token: Token, factory: Constructable): this {
    const deps: Token[] =
      Reflect.getMetadata('design:paramtypes', factory) ?? []
    this.registry.set(token, { factory, deps })
    return this
  }

  resolve<T>(token: Token): T {
    const hit = this.instances.get(token)
    if (hit) return hit as T                       // DEFAULT 作用域：单例缓存
    const { factory, deps } = this.registry.get(token)!
    const instance = new factory(...deps.map(d => this.resolve(d)))
    this.instances.set(token, instance)
    return instance as T                           // object → T 需显式断言
  }
}
```

```ts
// 验证：类必须有装饰器，否则编译器不发射 design:paramtypes（删掉试试，注入变 undefined）
import { Injectable } from '@nestjs/common'

@Injectable()
class Db {}
@Injectable()
class UserService {
  constructor(private readonly db: Db) {}
  list() { return `rows from ${this.db.constructor.name}` }
}

const c = new Container()
c.register(Db, Db)
c.register(UserService, UserService)
c.resolve<UserService>(UserService).list() // 'rows from Db' —— 泛型无法从 token 推导，须显式标注
c.resolve<Db>(Db) === c.resolve<Db>(Db)    // true —— 同一实例
```

**预期效果**：能对照 30 行实现说出 Nest 容器的三个核心机制——元数据读依赖、拓扑递归构造、Map 缓存；并说出它比真容器缺什么（作用域、循环检测、模块边界、生命周期钩子）。

---

## 8. 💬 面试问答

**Q1：Nest DI 的底层原理？**

`@Injectable()` + `emitDecoratorMetadata` 让编译器发射 `design:paramtypes` 元数据；启动期容器读元数据建依赖图，按 token 拓扑解析实例并缓存。字符串 token 因为运行时丢失类型信息，必须配 `@Inject()` 显式声明。

**Q2：REQUEST 作用域的代价？什么时候用？**

每个请求重建整条注入链，热路径上多一层构造 + GC 压力；且注入链向下传染，宿主也被迫变 REQUEST。只在实例必须聚合请求态且不便显式传参时用——通常 CLS 是更好的替代。

**Q3：循环依赖怎么处理？**

运行期 `forwardRef` 双向声明延迟解析，但它是止痛药；根治靠设计——合并同域模块、下沉公共依赖、事件解耦。

**Q4：Nest 的单测为什么容易？**

DI 的副产品：`Test.createTestingModule` 起一个真实容器，`.overrideProvider()` 在模块级把任意依赖换成 mock——测试的对象是被真实容器组装的服务，mock 的注入路径和生产一致。

---

## 9. 🔗 参考资料

- Providers：https://docs.nestjs.com/providers
- Injection scopes：https://docs.nestjs.com/fundamentals/injection-scopes
- Circular dependency：https://docs.nestjs.com/fundamentals/circular-dependency
- ModuleRef：https://docs.nestjs.com/fundamentals/module-ref

---

## 📌 小结

- DI 原理三件套：装饰器发元数据 → 容器读图拓扑构造 → Map 缓存单例
- 五种 Provider 形态里，`useFactory`（含异步）是连接外部 SDK 的标准姿势
- REQUEST 作用域是热路径税，默认答案「显式传参 / CLS 优先」
- 循环依赖：`forwardRef` 止痛，模块边界设计根治
- 手写 30 行迷你容器 = 验证心智模型，不背 API
