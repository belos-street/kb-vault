// 将 Markdown 文本节点（含行内代码）中的 {{ 转义为 HTML 实体，
// 防止 Vue 把笔记里的模板引擎示例（{{var}}、{{#if}}）当成插值表达式，
// 否则非法表达式直接炸构建、合法表达式（{{var}}）被静默求值为空。
// 代码块（fence）由 VitePress 自动 v-pre，不经过此处理，无需转义。
// 注意：不能改 Vue delimiters（plugin-vue 的 compilerOptions 是全局的，
// 会把 VitePress 主题组件的 {{ site.title }} 等一起破坏掉）。
interface MdLike {
  core: { ruler: { push(name: string, fn: (state: any) => void): void } }
  utils: { escapeHtml(s: string): string }
}

export function escapeVueInterpolation(md: MdLike): void {
  md.core.ruler.push('escape_vue_interpolation', (state) => {
    const Token = state.Token
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue
      const children: any[] = []
      for (const child of token.children) {
        if (child.type === 'text' && child.content.includes('{{')) {
          // 纯文本：在 {{ 处拆分，切出的实体用 html_inline 原样输出
          const parts = child.content.split(/(\{\{)/)
          for (const part of parts) {
            if (part === '{{') {
              const t = new Token('html_inline', '', 0)
              t.content = '&#123;&#123;'
              children.push(t)
            } else if (part) {
              const t = new Token('text', '', 0)
              t.content = part
              children.push(t)
            }
          }
        } else if (child.type === 'code_inline' && child.content.includes('{{')) {
          // 行内代码：markdown-it 不转义 {，Vue 仍会解析，整体转为手工 <code> 输出
          const t = new Token('html_inline', '', 0)
          t.content = `<code>${md.utils.escapeHtml(child.content).replaceAll('{{', '&#123;&#123;')}</code>`
          children.push(t)
        } else {
          children.push(child)
        }
      }
      token.children = children
    }
  })
}
