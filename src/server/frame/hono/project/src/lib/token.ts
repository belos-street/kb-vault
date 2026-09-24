import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import type { Context } from 'hono'
import { env } from './env'
import type { Role } from '../types'

export const ACCESS_TOKEN = 'access_token'
export const REFRESH_TOKEN = 'refresh_token'
export const ACCESS_TTL = 60 * 15 // 15 分钟
export const REFRESH_TTL = 60 * 60 * 24 * 7 // 7 天

const now = () => Math.floor(Date.now() / 1000)

const cookieBase = { httpOnly: true, secure: true, sameSite: 'Lax' as const, path: '/' }

export const signAccessToken = (userId: string, role: Role) =>
  sign({ sub: userId, role, typ: 'access', exp: now() + ACCESS_TTL }, env.JWT_SECRET, 'HS256')

export const signRefreshToken = (userId: string) =>
  sign({ sub: userId, typ: 'refresh', exp: now() + REFRESH_TTL }, env.JWT_SECRET, 'HS256')

/** 校验失败返回 null（不抛），由调用方决定 401 语义 */
export const verifyToken = async (token: string) => {
  try {
    return await verify(token, env.JWT_SECRET, 'HS256')
  } catch {
    return null
  }
}

/** Cookie 三件套：httpOnly + secure + sameSite */
export const setAuthCookies = (c: Context, access: string, refresh: string) => {
  setCookie(c, ACCESS_TOKEN, access, { ...cookieBase, maxAge: ACCESS_TTL })
  setCookie(c, REFRESH_TOKEN, refresh, { ...cookieBase, maxAge: REFRESH_TTL })
}

export const clearAuthCookies = (c: Context) => {
  deleteCookie(c, ACCESS_TOKEN, { path: '/' })
  deleteCookie(c, REFRESH_TOKEN, { path: '/' })
}

export const readRefreshCookie = (c: Context) => getCookie(c, REFRESH_TOKEN)
