import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { PrismaService } from '../../infra/prisma/prisma.service.js'

// 审计：写操作自动记「谁在何时对什么做了什么」（README FR-3）
// 排除 /api/auth——认证接口虽是 POST 但无用户上下文，记了全是噪音
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit')

  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      method?: string
      url?: string
      user?: { id?: string }
    }>()
    const isWrite = ['POST', 'PATCH', 'DELETE'].includes(req.method ?? '')
    if (!isWrite || req.url?.startsWith('/api/auth')) return next.handle()

    return next.handle().pipe(
      tap(data => {
        // 审计不阻塞响应：fire-and-forget，失败仅记日志
        void this.prisma.auditLog
          .create({
            data: {
              userId: req.user?.id ?? null, // M3 接入 Guard 后自然有值
              action: `${req.method} ${req.url ?? ''}`,
              refId: (data as { id?: string } | null)?.id ?? null,
              path: req.url ?? null,
            },
          })
          .catch(err => this.logger.error(`audit failed: ${String(err)}`))
      }),
    )
  }
}
