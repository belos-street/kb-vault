import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { BizException } from '../exceptions/biz-exception.js'

// 跨 adapter 的最小响应接口：FastifyReply / Express Response 都满足
interface JsonResponder {
  status(code: number): JsonResponder
  send(body: unknown): void
}

interface NormalizedError {
  status: number
  code: string
  message: unknown
}

// 唯一出口：任何环节抛出的异常都汇到这里（05 篇生命周期的终点）
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<JsonResponder>()
    const { status, code, message } = this.normalize(exception)
    res.status(status).send({ code, message, data: null })
  }

  private normalize(exception: unknown): NormalizedError {
    // 业务异常：errorCode 透传
    if (exception instanceof BizException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
      }
    }
    // 框架 HTTP 异常：无 errorCode 的 400 归为校验错误（12 篇 E2E 断言依赖此处）
    if (exception instanceof HttpException) {
      const body = exception.getResponse() as {
        errorCode?: string
        message?: unknown
      }
      const code =
        body.errorCode ??
        (exception.getStatus() === HttpStatus.BAD_REQUEST
          ? 'VALIDATION_ERROR'
          : 'HTTP_ERROR')
      return {
        status: exception.getStatus(),
        code,
        message: body.message ?? exception.message,
      }
    }
    // 未知异常：吞细节（不向客户端泄漏堆栈），日志侧保留全貌（11 篇）
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
    }
  }
}
