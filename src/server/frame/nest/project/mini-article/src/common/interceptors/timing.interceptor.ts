import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'

// 耗时日志：tap 只做旁路记录，不改响应值（05 篇）
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing')

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      method?: string
      url?: string
    }>()
    const start = Date.now()
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start
        this.logger.log(`${req.method ?? '?'} ${req.url ?? '?'} +${ms}ms`)
      }),
    )
  }
}
