# 13 Swagger 与 API 文档

> 所属大纲：[readme.md](../readme.md) ｜ 预计：0.5 天 ｜ 前置：04、09

**一句话定位**：OpenAPI 自动生成——v12 起 Zod schema 可直接喂文档，校验与文档同源；鉴权接口在文档里可调试。

**面试可答**：@nestjs/swagger 从 DTO/Zod schema 自动生成 OpenAPI；v12 支持 Standard Schema 直接进 OpenAPI 生成，`@Body({ schema })` 的同一份 schema 同时驱动校验与文档——消除「文档与实现漂移」。

---

## 1. 基础装配

```ts
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const config = new DocumentBuilder()
  .setTitle('KB API')
  .setVersion('1.0')
  .addBearerAuth()                        // 全局声明 Bearer，见第 2 节
  .build()
const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('docs', app, document)
```

访问 `/docs` 得到可调试 UI。**同源红利（v12）**：04 篇的 `createPostSchema` 不用再写一遍 DTO 注解——Standard Schema 直接参与 OpenAPI 生成，字段、约束、默认值与校验逻辑零漂移。

## 2. 鉴权文档化：让接口在 UI 里可调试

```ts
// 全局 addBearerAuth 后，受控路由标注 Bearer（认证本身由 07 篇的全局 JwtAuthGuard 承担）
@ApiTags('posts')
@ApiBearerAuth()                          // 该路由的请求带 Authorization 头
@Controller('posts')
export class PostController {}
```

> 注：07 篇正解是认证/授权**全局注册**（`APP_GUARD`：Jwt → Roles → Throttler）+ 公开路由 `@Public()` 豁免——`@ApiBearerAuth()` 只负责 OpenAPI 标注，与 Guard 的注册层级解耦；公开路由不加该标注即可。

UI 右上角 Authorize 按钮填 token → 后续请求自动携带——文档驱动的联调闭环：前端拿到可交互文档，后端少写口头说明。

## 3. 全局前缀与版本化

```ts
app.setGlobalPrefix('api', { exclude: ['health'] })   // 健康检查不带 /api（K8s 探针约定）
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })   // /api/v1/posts
```

版本化策略：URI 直观（`/api/v1/`）适合对外 API；Header 版本适合内部灰度。破坏性变更升版本号而不是硬改字段——文档、路由、客户端三处同步演进。

---

## 4. ✍️ 练习：全量接口文档

**要求**：给 09 篇的 Mini API 生成完整文档：

1. 全局 `addBearerAuth` + 认证路由 `@ApiBearerAuth()`，`@ApiTags` 按模块分组
2. 登录接口的响应示例（`@ApiOkResponse` + schema）让前端能对字段
3. 全局前缀 `api` + URI 版本化，health 排除

**预期效果**：`/docs` 内完成「登录 → 带 token → 建文章 → 分页查询」全流程；无一处手写与 schema 重复的字段描述。

---

## 5. 💬 面试问答

**Q1：怎么保证文档和实现不漂移？**

让文档从代码生成而不是手写，且校验与文档消费同一份 schema——v12 的 Standard Schema 联动（`@Body({ schema })` 同源喂 OpenAPI）把「改了校验忘了改文档」这一类漂移直接消灭。

**Q2：API 版本化怎么做？**

URI 版本（`/api/v1/`）直观适合对外；Header 版本适合内部灰度。配合全局前缀与健康检查排除项。原则：破坏性变更升版本而非硬改，旧版本按 deprecation 期下线。

---

## 6. 🔗 参考资料

- OpenAPI：https://docs.nestjs.com/openapi/introduction
- Standard Schema → OpenAPI（v12）：https://docs.nestjs.com/openapi/introduction#standard-schema-zod-valibot

---

## 📌 小结

- v12 文档主线：Zod schema → OpenAPI 同源生成，04 篇埋的「schema 复用」在此兑现
- 鉴权文档化 = `addBearerAuth` + `@ApiBearerAuth`，UI 即联调台
- 前缀 + 版本化 + health 排除是对外 API 的标准门面
