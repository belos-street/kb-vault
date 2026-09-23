# 16 备查：CLI 与装饰器速查

> 所属大纲：[readme.md](../readme.md) ｜ 速查层，不占课时 ｜ 用法：随用随查，每行标注正式讲解篇目

**一句话定位**：CLI 日常工作台 + 全部常用装饰器按类分组速查——写作/实操时当字典用，不必通读。

---

## 1. CLI 工作台

### 1.1 项目生命周期命令

```bash
nest new hello-nest      # 新建项目（交互选包管理器与 CJS/ESM，教程基线选 ESM）→ 00 篇
nest start --watch       # 开发运行，文件变更自动重启 → 00 篇
nest build               # 构建产物（标准项目默认 tsc；v12 起 monorepo 默认 Rspack）→ 12 篇
nest upgrade             # 大版本一键迁移（含依赖与代码修改建议）→ 大纲「版本与安全基线」
```

> ⚠️ CLI schematics 的 Node 版本门槛高于运行时：`nest new` / `nest generate` / `nest upgrade` 需 Node 22.22.3+ / 24.15+ / 26+，低版本直接拒跑。见大纲「版本与安全基线」。

### 1.2 generate 全家桶

`nest g <schematic> <name>`——日常 90% 的文件生成，**不再手写文件**：

| 命令 | 产物 | 用途（讲解篇目） |
|------|------|------|
| `nest g module user` | `user.module.ts` | 模块边界声明（03） |
| `nest g controller user` | `user.controller.ts` + spec | 路由声明（04） |
| `nest g service user` | `user.service.ts` + spec | 业务 Provider（02） |
| `nest g middleware logger` | `logger.middleware.ts` | 请求链第一环（04） |
| `nest g pipe trim` | `trim.pipe.ts` | 参数校验/变换（04） |
| `nest g guard roles` | `roles.guard.ts` | 认证授权决策（07） |
| `nest g interceptor logging` | `logging.interceptor.ts` | AOP 横切：日志/缓存/超时（05） |
| `nest g filter http-exception` | `http-exception.filter.ts` | 统一异常出口（05） |
| `nest g decorator public` | `public.decorator.ts` | 自定义装饰器（04/07） |
| `nest g class cat` | `cat.class.ts` + spec | 通用类（DTO 建议手写，Zod schema 同源更优，04） |
| `nest g interface person` | `person.interface.ts` | 纯类型定义 |
| `nest g resource user` | 模块+controller+service+DTO+entity 全套 | CRUD 模块一键脚手架（09 实战提速用） |

### 1.3 常用 flags

| flag | 作用 | 典型场景 |
|------|------|------|
| `--no-spec` | 不生成 `.spec.ts` 测试文件 | 生成装饰器/过滤器等无测试价值的文件 |
| `--flat` | 不建子目录，文件直接放当前目录 | `common/decorators/` 下的零散小文件 |
| `--dry-run` | 只打印将生成/修改的文件，不落盘 | 不确定 schematic 行为先预览 |
| `--skip-import` | 生成 module 时不自动 import 进所属模块 | 手动编排模块结构时 |

### 1.4 monorepo vs standard 一句话选型

- **standard（默认）**：单应用单包，`nest g app` / `nest g library` 不涉及——本教程全部实战用这个
- **monorepo**：同仓多应用 + 共享库（`nest g app admin` / `nest g lib shared`），v12 起构建默认 Rspack——多个部署单元共享领域代码时再启用，13/15 篇不展开

## 2. 装饰器速查表

> 用法说明：速查表按「贴在哪 → 干什么 → 正式讲解篇目」组织。生命周期那组是**接口**而非装饰器（实现后由容器回调），放在一起便于对照。

### 2.1 模块与 Provider（→ 02 / 03）

| 装饰器 | 贴在哪 | 作用 |
|--------|--------|------|
| `@Module({ imports, controllers, providers, exports })` | 类 | 声明模块边界与依赖图 |
| `@Injectable()` | 类 | 标记为 Provider，纳入容器管理与注入 |
| `@Inject(token)` | 构造参数 | 非 class token（字符串/Symbol）注入，如 `'REDIS_CLIENT'` |
| `@Optional()` | 构造参数 | 依赖缺省不报错，注入 `undefined` |
| `@Global()` | 模块类 | 该模块 exports 全局可见（慎用，03 篇讲代价） |

### 2.2 HTTP 路由与参数（→ 04）

| 装饰器 | 贴在哪 | 作用 |
|--------|--------|------|
| `@Controller('users')` | 类 | 路由前缀 |
| `@Get / @Post / @Put / @Patch / @Delete(':id')` | 方法 | 路由声明 |
| `@Param('id')` / `@Params()` | 参数 | 单个/全部路径参数 |
| `@Query('page')` / `@Query()` | 参数 | 单个/全部查询参数 |
| `@Body()` / `@Body({ schema: zodSchema })` | 参数 | 请求体；v12 可接 Standard Schema 校验 |
| `@Headers('authorization')` | 参数 | 请求头取值 |
| `@Req()` | 参数 | 原生请求对象（Fastify 下为 `FastifyRequest`） |
| `@Res()` / `@Res({ passthrough: true })` | 参数 | 原生响应对象；直注会脱离响应管线，除非 passthrough |
| `@HttpCode(204)` / `@Header('X-K', 'v')` | 方法 | 覆盖状态码 / 追加响应头 |

### 2.3 AOP 挂载与元数据（→ 05 / 07）

| 装饰器 | 贴在哪 | 作用 |
|--------|--------|------|
| `@UseGuards(...)` | 方法/类 | 挂守卫（认证授权，07） |
| `@UsePipes(...)` | 方法/参数 | 挂管道 |
| `@UseInterceptors(...)` | 方法/类 | 挂拦截器（05） |
| `@UseFilters(...)` | 方法/类 | 挂异常过滤器（05） |
| `@SetMetadata('key', value)` | 方法/类 | 打元数据标记，`Reflector` 读取——07 篇 `@Public()` 的本体 |
| `@Catch(...)` | 类 | ExceptionFilter 声明捕获范围（05） |

### 2.4 生命周期接口（→ 03 / 11）

> 注意：这组是**接口**（类 implements 后容器回调），不是装饰器。

| 接口 → 方法 | 回调时机 | 典型用途 |
|------|------|------|
| `OnModuleInit → onModuleInit()` | 依赖注入完成、模块初始化 | `PrismaService` 建连（08） |
| `OnApplicationBootstrap → onApplicationBootstrap()` | 全部模块初始化完毕 | 启动后一次性任务 |
| `OnModuleDestroy → onModuleDestroy()` | 模块销毁前 | 连接清理 |
| `OnApplicationShutdown → onApplicationShutdown()` | 收到关闭信号 | 优雅关闭（11） |

### 2.5 自定义装饰器（→ 04 / 07）

| 手段 | 产物 | 场景 |
|------|------|------|
| `createParamDecorator((data, ctx) => ...)` | 参数装饰器 | `@CurrentUser()`——从 request 取业务上下文（04） |
| `@SetMetadata` + `Reflector.getAndSet/getAllAndOverride` | 类/方法装饰器 | 权限标记类装饰器，如 `@Roles('admin')`（07） |
| Nest 10+ 的 `createDecorator()` 工厂 | 可复用元数据装饰器 | 一个 key 上绑定强类型值，替代手写 SetMetadata 样板 |

---

## 3. ✍️ 动手建议（一段式）

新建一个 playground 项目，把 1.2 表中 12 个 generate 命令各跑一遍（加 `--no-spec`，其中一个先 `--dry-run` 预览），观察产物文件与 2.x 速查表中装饰器的对应关系——生成文件里的装饰器用法就是各篇的正式讲解入口。

## 4. 🔗 参考资料

- CLI 概览与用法：https://docs.nestjs.com/cli/overview ｜ https://docs.nestjs.com/cli/usages
- Monorepo 模式：https://docs.nestjs.com/cli/monorepo
- Controller/装饰器：https://docs.nestjs.com/controllers ｜ https://docs.nestjs.com/custom-decorators
- 生命周期事件：https://docs.nestjs.com/fundamentals/lifecycle-events

---

## 📌 小结

- CLI 三类命令：生命周期（new/start/build/upgrade）、generate 全家桶（12 个 + 4 个常用 flags）、monorepo（多部署单元才启用）
- 装饰器五组：模块与 Provider、HTTP 路由与参数、AOP 挂载与元数据、生命周期接口（注意是接口不是装饰器）、自定义装饰器
- 每行都标注了正式讲解篇目——速查定位是「查」，原理回主线篇目补
