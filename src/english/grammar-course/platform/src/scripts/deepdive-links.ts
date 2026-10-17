import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 深读链接解析（T11，requirements F6）：
// Gnn + title 中的 §N.M → 讲义静态页 URL + 小节锚点。
// 跳转目标 = VitePress 站点讲义页（/kb-vault/english/grammar/…），不是 grammar-play。
// 解析在构建期做（运行时无文件系统），URL 落进 deepDive.refs[].url。

const here = dirname(fileURLToPath(import.meta.url))
const grammarRoot = join(here, '..', '..', '..', '..', 'grammar')

// VitePress slugify 常量（chunk-D3CUZ4fa.js 逐字对齐；用 RegExp 构造避开源码内裸控制字符）
const rCombining = new RegExp('[\\u0300-\\u036F]', 'g')
// oxlint-disable-next-line no-control-regex -- VitePress slugify 逐字复刻，控制字符有意
const rControl = new RegExp('[\\u0000-\\u001f]', 'g')
const rSpecial = new RegExp(
  '[\\s~`!@#$%^&*()\\-_+=[\\]{}|\\\\;:"\'“”‘’<>,.?/]+',
  'g'
)

/** VitePress markdown 标题锚点 slugify（与线上实测逐字一致） */
export function slugify(heading: string): string {
  return heading
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

/** Gnn → 讲义 md 文件路径（Lnn = 原讲号，扫 grammar/<分类>/Lnn-*.md） */
function findLectureFile(ref: string): string | undefined {
  const num = ref.slice(1) // G03 → 03
  const re = new RegExp(`^L${num}-.*\\.md$`)
  for (const dir of readdirSync(grammarRoot, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    const files = readdirSync(join(grammarRoot, dir.name)).filter((f) =>
      re.test(f)
    )
    const f = files[0]
    if (f !== undefined) return join(grammarRoot, dir.name, f)
  }
  return undefined
}

/**
 * 解析深读跳转 URL：`/kb-vault/english/grammar/<分类>/<文件>.html#<锚点>`。
 * title 内 `§N.M` 对应讲义 `### N.M`（或 `§N` 对应 `## N.`）小节；
 * 找不到文件 / 小节 → undefined（调用方报硬错）。
 */
export function resolveDeepDiveUrl(
  ref: string,
  title: string
): string | undefined {
  const file = findLectureFile(ref)
  if (file === undefined) return undefined
  const secM = title.match(/§\s*(\d+(?:\.\d+)?)/)
  if (secM?.[1] === undefined) return undefined
  const sec = secM[1]
  const md = readFileSync(file, 'utf8')
  const re = new RegExp(
    `^(#{2,3})\\s+${sec.replace('.', '\\.')}\\.?\\s+(.+)$`,
    'm'
  )
  const headM = md.match(re)
  const heading = headM?.[2]?.trim()
  if (heading === undefined) return undefined
  // 相对站点根（部署 base /kb-vault/）
  const rel = file
    .replace(/\\/g, '/')
    .split('/src/english/grammar/')[1]
    ?.replace(/\.md$/, '.html')
  if (rel === undefined) return undefined
  return `/kb-vault/english/grammar/${rel}#${slugify(`${sec} ${heading}`)}`
}
