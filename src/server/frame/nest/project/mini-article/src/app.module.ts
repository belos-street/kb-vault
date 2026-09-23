import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { envSchema } from './config/env.schema.js'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js'
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js'
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js'
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js'
import { PrismaModule } from './infra/prisma/prisma.module.js'
import { PostRepository } from './modules/post/post.repository.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  // 全局注册顺序 = 洋葱层级：先注册的在外层
  // Interceptor：Transform(包装) → Audit(审计) → Timing(计时，最贴 handler)
  providers: [
    AppService,
    PostRepository,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
  ],
})
export class AppModule {}
