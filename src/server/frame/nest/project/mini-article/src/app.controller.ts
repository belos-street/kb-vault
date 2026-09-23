import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { BizException } from './common/exceptions/biz-exception.js'
import { AppService } from './app.service.js'

// 管道/过滤器链路的验证 schema（M4 换成真实的 post.schema）
const echoSchema = z.object({ name: z.string().min(1) })

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  // 验证端点：非法 body → 400 VALIDATION_ERROR（README §9 第 2 项）
  @Post('echo')
  echo(@Body({ schema: echoSchema }) body: { name: string }) {
    return { echo: body.name }
  }

  // 验证端点：BizException 的 errorCode 透传（README §9 第 5 项）
  @Get('biz-error')
  bizError(): string {
    throw new BizException('POST_NOT_FOUND', '文章不存在', HttpStatus.NOT_FOUND)
  }

  // 验证端点：未知异常脱敏为 500 INTERNAL_ERROR（README §9 第 8 项）
  @Get('boom')
  boom(): string {
    throw new Error('x')
  }
}
