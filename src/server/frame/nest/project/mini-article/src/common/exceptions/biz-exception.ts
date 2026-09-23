import { HttpException, HttpStatus } from '@nestjs/common'

// 业务异常基类：HTTP 语义 + 机器可读错误码
// ⚠️ code 必须挂实例属性（readonly 参数属性）——Filter 侧读 e.code，漏了就是 undefined（README 陷阱 #3）
export class BizException extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status, { errorCode: code })
  }
}
