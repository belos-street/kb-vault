// 将 Obsidian wikilink（[[目标|别名]] / [[目标#锚点]] / ![[图片.png]]）
// 在渲染前改写为标准 markdown 链接，VitePress 原生不解析 [[...]]
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const WIKI_RE = /(!?)\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g

// 全库「basename → 绝对路径」索引：md 优先，再补图片附件
let fileIndex: Map<string, string> | null = null

function buildIndex(root: string): Map<string, string> {
  const index = new Map<string, string>()
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'skills') continue // 与 srcExclude 对齐
        walk(full)
      } else if (/\.(md|png|jpe?g|gif|svg|webp)$/i.test(entry.name)) {
        const base = path.basename(entry.name, path.extname(entry.name)).toLowerCase()
        if (!index.has(base)) index.set(base, full)
      }
    }
  }
  walk(path.join(root, 'src'))
  return index
}

function isFile(p: string): boolean {
  return existsSync(p) && statSync(p).isFile()
}

// 解析顺序：同目录直查 → 逐级向上（Obsidian 相对路径习惯）→ 全库 basename 匹配 → 找不到返回 null
function resolveTarget(target: string, fromDir: string, root: string): string | null {
  const clean = target.trim()
  if (!clean) return null
  const direct = path.resolve(fromDir, clean)
  for (const candidate of [direct, direct + '.md']) {
    if (isFile(candidate)) return candidate
  }
  // doc/ 里的 [[outline]] 应命中教程根的 outline.md，而非全库第一个同名文件
  // 注意：vite 的 id 是正斜杠、path.resolve 产出反斜杠，比较前必须归一
  if (!clean.includes('/') && !clean.includes('\\')) {
    const stop = path.resolve(root, 'src').replaceAll('\\', '/')
    let dir = path.dirname(fromDir).replaceAll('\\', '/')
    while (dir.startsWith(stop)) {
      for (const candidate of [path.join(dir, clean), path.join(dir, clean + '.md')]) {
        if (isFile(candidate)) return candidate
      }
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent.replaceAll('\\', '/')
    }
  }
  fileIndex ??= buildIndex(root)
  return (
    fileIndex.get(clean.toLowerCase()) ??
    fileIndex.get(path.basename(clean, path.extname(clean)).toLowerCase()) ??
    null
  )
}

export function obsidianWikilinks(root = process.cwd()): Plugin {
  return {
    name: 'obsidian-wikilinks',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.md') || !code.includes('[[')) return
      const dir = path.dirname(id)
      let inFence = false
      const out = code
        .split('\n')
        .map((line) => {
          // 代码块内的 [[...]] 是示例文本，不改写
          if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
          if (inFence) return line
          return line.replace(WIKI_RE, (m, embed, target, anchor, alias) => {
            const resolved = resolveTarget(target, dir, root)
            if (!resolved) return m
            let rel = path.relative(dir, resolved).replaceAll('\\', '/')
            if (!rel.startsWith('.')) rel = './' + rel
            const label = (alias ?? target).trim()
            const hash = anchor ? '#' + encodeURI(anchor.trim()) : ''
            return embed ? `![${label}](${rel}${hash})` : `[${label}](${rel}${hash})`
          })
        })
        .join('\n')
      return { code: out, map: null }
    },
  }
}
