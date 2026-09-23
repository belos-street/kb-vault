import { Injectable } from '@nestjs/common'
import type { Post, PrismaClient } from '@prisma/client'

export interface ListQuery {
  cursor?: string
  take: number
  keyword?: string
}

export interface ListResult {
  items: Post[]
  nextCursor: string | null
}

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: { title: string, content: string, authorId: string }): Promise<Post> {
    return this.prisma.post.create({ data })
  }

  findById(id: string): Promise<Post | null> {
    // 软删除统一过滤：deletedAt 为 null 才可见
    return this.prisma.post.findFirst({ where: { id, deletedAt: null } })
  }

  async list(q: ListQuery): Promise<ListResult> {
    // cursor 从自身起取（不 skip:1），探头行是下一页首条——两种机制勿混搭（README 陷阱 #1）
    const items = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(q.keyword
          ? { title: { contains: q.keyword, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { id: 'asc' },
      take: q.take + 1, // 探头：多取一条判断 hasNext
      ...(q.cursor ? { cursor: { id: q.cursor } } : {}),
    })
    const hasNext = items.length > q.take
    return {
      items: items.slice(0, q.take),
      nextCursor: hasNext ? items[q.take]!.id : null,
    }
  }

  softDelete(id: string): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
