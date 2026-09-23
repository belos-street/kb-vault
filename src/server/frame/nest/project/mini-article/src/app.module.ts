import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { envSchema } from './config/env.schema.js'
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
  providers: [AppService, PostRepository],
})
export class AppModule {}
