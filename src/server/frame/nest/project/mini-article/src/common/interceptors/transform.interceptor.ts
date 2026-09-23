import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'

export interface ApiResponse<T> {
  code: string
  data: T
  message: string
}

// 统一成功响应包装：{ code, data, message }（05 篇 map）
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next
      .handle()
      .pipe(map(data => ({ code: 'OK', data, message: 'success' })))
  }
}
