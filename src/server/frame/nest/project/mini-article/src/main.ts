import { StandardSchemaValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  app.setGlobalPrefix('api')
  // 装饰器只挂元数据，校验靠这根全局管道真正执行（doc/04 §3）
  app.useGlobalPipes(new StandardSchemaValidationPipe())
  await app.listen(process.env.PORT ?? 3000)
}
await bootstrap()
