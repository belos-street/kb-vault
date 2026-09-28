import { createRoute, z } from '@hono/zod-openapi'
import { optionalAuth, requireUser } from '../middleware/auth'
import { createOpenAPI, jsonContent } from '../lib/openapi'
import { ok } from '../lib/response'
import {
  createComment,
  listComments,
  softDeleteComment
} from '../services/comments'
import { getVisiblePost } from '../services/posts'
import {
  commentSchema,
  createCommentSchema,
  listCommentQuerySchema,
  listCommentResultSchema
} from '../schemas/comments'
import { failEnvelope, okEnvelope } from '../schemas/common'

export const comments = createOpenAPI()

const postIdParam = z.object({ postId: z.coerce.number().int().positive() })
const commentParam = z.object({
  postId: z.coerce.number().int().positive(),
  commentId: z.coerce.number().int().positive()
})

const listRoute = createRoute({
  method: 'get',
  path: '/posts/{postId}/comments',
  middleware: [optionalAuth],
  request: { params: postIdParam, query: listCommentQuerySchema },
  responses: {
    200: {
      description: '评论分页列表',
      content: jsonContent(okEnvelope(listCommentResultSchema))
    },
    404: {
      description: '文章不存在或不可见',
      content: jsonContent(failEnvelope)
    }
  }
})

comments.openapi(listRoute, async (c) => {
  const { postId } = c.req.valid('param')
  const query = c.req.valid('query')
  await getVisiblePost(c.get('user'), postId) // 可见性复用文章矩阵（PRD §4.1.1）
  return ok(c, await listComments(postId, query))
})

const createRouteDef = createRoute({
  method: 'post',
  path: '/posts/{postId}/comments',
  middleware: [optionalAuth],
  request: {
    params: postIdParam,
    body: { content: { 'application/json': { schema: createCommentSchema } } }
  },
  responses: {
    201: {
      description: '评论成功，commentCount 同事务 +1',
      content: jsonContent(okEnvelope(commentSchema))
    },
    400: { description: '参数校验失败', content: jsonContent(failEnvelope) },
    401: { description: '未认证', content: jsonContent(failEnvelope) },
    404: {
      description: '文章不存在或不可见',
      content: jsonContent(failEnvelope)
    },
    422: {
      description: '仅 PUBLISHED 文章可评论',
      content: jsonContent(failEnvelope)
    }
  }
})

comments.openapi(createRouteDef, async (c) => {
  const { postId } = c.req.valid('param')
  const { content } = c.req.valid('json')
  return ok(c, await createComment(requireUser(c), postId, content), 201)
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/posts/{postId}/comments/{commentId}',
  middleware: [optionalAuth],
  request: { params: commentParam },
  responses: {
    200: {
      description: '软删除成功，commentCount 同事务 -1',
      content: jsonContent(okEnvelope(z.object({ ok: z.boolean() })))
    },
    401: { description: '未认证', content: jsonContent(failEnvelope) },
    403: {
      description: '非作者且非 editor/admin',
      content: jsonContent(failEnvelope)
    },
    404: { description: '评论不存在', content: jsonContent(failEnvelope) }
  }
})

comments.openapi(deleteRoute, async (c) => {
  const { postId, commentId } = c.req.valid('param')
  return ok(c, await softDeleteComment(requireUser(c), postId, commentId))
})
