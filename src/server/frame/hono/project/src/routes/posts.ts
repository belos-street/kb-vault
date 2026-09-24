import { createRoute, z } from '@hono/zod-openapi'
import { optionalAuth, requireUser } from '../middleware/auth'
import { createOpenAPI, jsonContent } from '../lib/openapi'
import { ok } from '../lib/response'
import {
  createPost,
  getVisiblePost,
  listPosts,
  softDeletePost,
  transitionPost,
  updatePost,
} from '../services/posts'
import {
  createPostSchema,
  listPostQuerySchema,
  listPostResultSchema,
  postSchema,
  transitionPostSchema,
  updatePostSchema,
} from '../schemas/posts'
import { failEnvelope, okEnvelope } from '../schemas/common'

export const posts = createOpenAPI()

// optionalAuth 挂在各 createRoute 的 middleware 上，不用 use('*')：
// posts 经 api.route('/', posts) 合并后 '*' 会波及 auth 子路由（隐式耦合）

const idParam = z.object({ id: z.coerce.number().int().positive() })

const listRoute = createRoute({
  method: 'get',
  path: '/posts',
  middleware: [optionalAuth],
  request: { query: listPostQuerySchema },
  responses: {
    200: { description: '分页列表', content: jsonContent(okEnvelope(listPostResultSchema)) },
  },
})

posts.openapi(listRoute, async (c) => {
  const query = c.req.valid('query')
  return ok(c, await listPosts(c.get('user'), query))
})

const createRouteDef = createRoute({
  method: 'post',
  path: '/posts',
  middleware: [optionalAuth],
  request: { body: { content: { 'application/json': { schema: createPostSchema } } } },
  responses: {
    201: { description: '创建成功（DRAFT）', content: jsonContent(okEnvelope(postSchema)) },
    400: { description: '参数校验失败', content: jsonContent(failEnvelope) },
    401: { description: '未认证', content: jsonContent(failEnvelope) },
  },
})

posts.openapi(createRouteDef, async (c) => {
  const input = c.req.valid('json')
  return ok(c, await createPost(requireUser(c), input), 201)
})

const getRoute = createRoute({
  method: 'get',
  path: '/posts/{id}',
  middleware: [optionalAuth],
  request: { params: idParam },
  responses: {
    200: { description: '文章详情', content: jsonContent(okEnvelope(postSchema)) },
    404: { description: '不存在或不可见', content: jsonContent(failEnvelope) },
  },
})

posts.openapi(getRoute, async (c) => {
  const { id } = c.req.valid('param')
  return ok(c, await getVisiblePost(c.get('user'), id))
})

const updateRoute = createRoute({
  method: 'patch',
  path: '/posts/{id}',
  middleware: [optionalAuth],
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: updatePostSchema } } },
  },
  responses: {
    200: { description: '更新成功', content: jsonContent(okEnvelope(postSchema)) },
    400: { description: '参数校验失败', content: jsonContent(failEnvelope) },
    401: { description: '未认证', content: jsonContent(failEnvelope) },
    403: { description: '无权限', content: jsonContent(failEnvelope) },
    404: { description: '不存在', content: jsonContent(failEnvelope) },
    409: { description: '乐观锁冲突', content: jsonContent(failEnvelope) },
    422: { description: '归档文章不可编辑', content: jsonContent(failEnvelope) },
  },
})

posts.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param')
  const input = c.req.valid('json')
  return ok(c, await updatePost(requireUser(c), id, input))
})

const transitionRoute = createRoute({
  method: 'post',
  path: '/posts/{id}/transition',
  middleware: [optionalAuth],
  request: {
    params: idParam,
    body: { content: { 'application/json': { schema: transitionPostSchema } } },
  },
  responses: {
    200: { description: '流转成功（重复请求幂等返回当前态）', content: jsonContent(okEnvelope(postSchema)) },
    400: { description: '参数校验失败', content: jsonContent(failEnvelope) },
    401: { description: '未认证', content: jsonContent(failEnvelope) },
    403: { description: '角色 × 状态 × 操作 判定不通过', content: jsonContent(failEnvelope) },
    404: { description: '不存在', content: jsonContent(failEnvelope) },
    422: { description: '非法流转', content: jsonContent(failEnvelope) },
  },
})

posts.openapi(transitionRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { action, reason } = c.req.valid('json')
  return ok(c, await transitionPost(requireUser(c), id, action, reason))
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/posts/{id}',
  middleware: [optionalAuth],
  request: { params: idParam },
  responses: {
    200: { description: '软删除成功', content: jsonContent(okEnvelope(z.object({ ok: z.boolean() }))) },
    401: { description: '未认证', content: jsonContent(failEnvelope) },
    403: { description: '无权限', content: jsonContent(failEnvelope) },
    404: { description: '不存在', content: jsonContent(failEnvelope) },
  },
})

posts.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid('param')
  return ok(c, await softDeletePost(requireUser(c), id))
})
