import { createRoute, z } from '@hono/zod-openapi'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/db'
import { apiError } from '../lib/errors'
import { createOpenAPI, jsonContent } from '../lib/openapi'
import { ok } from '../lib/response'
import {
  clearAuthCookies,
  readRefreshCookie,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../lib/token'
import { requireAuth, requireUser } from '../middleware/auth'
import { loginSchema, registerSchema } from '../schemas/auth'
import { authUserSchema, failEnvelope, okEnvelope } from '../schemas/common'
import { isRole } from '../types'

export const auth = createOpenAPI()

// 登录时序拉平：用户不存在时也执行一次 argon2 校验，
// 避免响应时间差异泄露邮箱存在性（注册接口 409 已泄露存在性，此处属纵深防御）
const DUMMY_HASH = await Bun.password.hash('timing-equalizer-dummy')

const register = createRoute({
  method: 'post',
  path: '/register',
  request: {
    body: { content: { 'application/json': { schema: registerSchema } } },
  },
  responses: {
    201: {
      description: '注册成功',
      content: jsonContent(okEnvelope(authUserSchema)),
    },
    400: { description: '参数校验失败', content: jsonContent(failEnvelope) },
    409: { description: '邮箱已被注册', content: jsonContent(failEnvelope) },
  },
})

auth.openapi(register, async (c) => {
  const { email, password } = c.req.valid('json')
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: await Bun.password.hash(password) },
    })
    return ok(c, { id: user.id, email: user.email, role: user.role }, 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw apiError.conflict('邮箱已被注册')
    }
    throw e
  }
})

const login = createRoute({
  method: 'post',
  path: '/login',
  request: {
    body: { content: { 'application/json': { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: '登录成功，双 Cookie 下发',
      content: jsonContent(okEnvelope(authUserSchema)),
    },
    400: { description: '参数校验失败', content: jsonContent(failEnvelope) },
    401: { description: '邮箱或密码错误', content: jsonContent(failEnvelope) },
  },
})

auth.openapi(login, async (c) => {
  const { email, password } = c.req.valid('json')
  const user = await prisma.user.findUnique({ where: { email } })
  const verified = user
    ? await Bun.password.verify(password, user.passwordHash)
    : await Bun.password.verify(password, DUMMY_HASH)
  if (!user || !verified) {
    throw apiError.unauthorized('邮箱或密码错误')
  }
  if (!isRole(user.role)) {
    throw apiError.unauthorized('用户角色异常') // DB 脏数据不得静默通过 RBAC
  }
  await setAuthCookies(c, await signAccessToken(user.id, user.role), await signRefreshToken(user.id))
  return ok(c, { id: user.id, email: user.email, role: user.role })
})

const refresh = createRoute({
  method: 'post',
  path: '/refresh',
  responses: {
    200: {
      description: '刷新成功，双 token 轮换',
      content: jsonContent(okEnvelope(authUserSchema)),
    },
    401: { description: 'refresh token 无效', content: jsonContent(failEnvelope) },
  },
})

auth.openapi(refresh, async (c) => {
  const token = readRefreshCookie(c)
  const payload = token ? await verifyToken(token) : null
  if (!payload || payload.typ !== 'refresh' || typeof payload.sub !== 'string') {
    throw apiError.unauthorized('refresh token 无效')
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw apiError.unauthorized('用户不存在')
  if (!isRole(user.role)) {
    throw apiError.unauthorized('用户角色异常')
  }
  await setAuthCookies(c, await signAccessToken(user.id, user.role), await signRefreshToken(user.id))
  return ok(c, { id: user.id, email: user.email, role: user.role })
})

const logout = createRoute({
  method: 'post',
  path: '/logout',
  responses: {
    200: { description: '登出成功，清除 Cookie', content: jsonContent(okEnvelope(z.object({ ok: z.boolean() }))) },
  },
})

auth.openapi(logout, (c) => {
  clearAuthCookies(c)
  return ok(c, { ok: true })
})

const meDataSchema = z.object({ id: z.string(), role: z.string() })

const me = createRoute({
  method: 'get',
  path: '/me',
  responses: {
    200: { description: '当前用户', content: jsonContent(okEnvelope(meDataSchema)) },
    401: { description: '未认证', content: jsonContent(failEnvelope) },
  },
})

// openapi() 第三参是 hook 而非中间件链——认证中间件用 use 挂在路由前
auth.use('/me', requireAuth)
auth.openapi(me, (c) => {
  const user = requireUser(c) // requireAuth 已保证有 user，requireUser 永不抛，且消灭非空断言
  return ok(c, user)
})
