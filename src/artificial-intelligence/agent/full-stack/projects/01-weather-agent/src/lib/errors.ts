// AppError 允许的 HTTP 状态码：400 入参非法、401 未鉴权、403 无权限、
// 422 业务失败（如 max_steps_exceeded）、429 上游限流、
// 500 配置或内部错误、502 上游错误、504 上游超时。
export type AppErrorStatus = 400 | 401 | 403 | 422 | 429 | 500 | 502 | 504

export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: AppErrorStatus,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}
