export type Role = 'reader' | 'editor' | 'admin'

export const ROLES: readonly Role[] = ['reader', 'editor', 'admin']

/** 运行时守卫：JWT payload 与 DB 的 role 都是裸 string，脏数据不得静默通过 RBAC */
export const isRole = (v: unknown): v is Role =>
  typeof v === 'string' && (ROLES as readonly string[]).includes(v)

export type AuthUser = { id: string; role: Role }

export type Env = {
  Variables: {
    requestId: string
    user?: AuthUser
  }
}
