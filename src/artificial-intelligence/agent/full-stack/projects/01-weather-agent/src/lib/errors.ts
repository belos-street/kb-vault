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
