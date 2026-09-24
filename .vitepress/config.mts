import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { obsidianWikilinks } from './plugin/obsidian-wikilinks'
import { escapeVueInterpolation } from './plugin/escape-vue-interpolation'
import { nav, sidebar } from './sidebar.generated.mts'

// GitHub Pages 子路径部署，与仓库名一致
const base = '/kb-vault/'

// withMermaid 统一接管 mermaid（vite 插件 + markdown-it + 客户端组件），缺它 mermaid 块不渲染
// mermaid 配置需放在 config 的 mermaid 字段（withMermaid 只接收一个参数，内部读取 e.mermaid）
const mermaidConfig = {
  flowchart: { useMaxWidth: false },
  sequence: { useMaxWidth: false },
  class: { useMaxWidth: false },
  state: { useMaxWidth: false },
  er: { useMaxWidth: false },
  journey: { useMaxWidth: false },
  gantt: { useMaxWidth: false },
  pie: { useMaxWidth: false },
  mindmap: { useMaxWidth: false },
  timeline: { useMaxWidth: false },
  gitGraph: { useMaxWidth: false },
  requirement: { useMaxWidth: false },
}

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: 'KB Vault',
    description: 'belos-street 的个人技术知识库',
    mermaid: mermaidConfig,
    head: [
      // 字体：Inter ≈ SF Pro、Noto Sans SC ≈ 苹方、JetBrains Mono 代码字体（分片按需加载，失败回退系统字体）
      ['link', { rel: 'preconnect', href: 'https://cdn.jsdelivr.net' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/400.css' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/500.css' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/700.css' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5/400.css' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5/500.css' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5/700.css' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/400.css' }],
      ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/700.css' }],
    ],
    srcDir: 'src',
    base,
    outDir: '.vitepress/dist',
    lastUpdated: true,
    cleanUrls: false,
    vite: {
      plugins: [obsidianWikilinks()],
    },
    markdown: {
      math: true, // 内置 MathJax（VitePress ≥1.2），渲染 $...$ / $$...$$
      config(md) {
        escapeVueInterpolation(md)
      },
    },
    srcExclude: [
      '**/skills/**', // 不收录 agent skill 文档（如 pixi/skills），想收录就删掉这行
      '**/node_modules/**',
      '**/assets/.gitkeep',
      '**/{package.json,bun.lock,tsconfig.json,.oxlintrc.json,.oxfmtrc.jsonc,vite.config.ts}',
      '**/*.{ts,js}',
      '**/*.db',
    ],
    // 死链检查豁免（ASCII 正常链接仍被拦截）：
    // 1. 目录 index 链接 —— Obsidian 目录跳转习惯，站点不生成目录首页
    // 2. 仓库内非站点资源（agent skill、SQL、草稿）
    // 3. 中文路径页内链接 —— normalizeLink 编码后与页面表比对失败属误报，线上可正常跳转
    ignoreDeadLinks: [
      /index$/,
      /\.agents\//,
      /schema\.sql$/,
      /\/draft$/,
      /\/agents$/,
      (link) => /%[0-9A-Fa-f]{2}/.test(link),
      // 笔记中引用了尚未创建的内容（规划中的 kb-agent 项目、front/javascript 目录）
      /projects\/04-kb-agent/,
      /front\/javascript$/,
    ],
    themeConfig: {
      nav,
      sidebar,
      outline: { level: [2, 3], label: '本页目录' },
      search: { provider: 'local' },
      lastUpdated: { text: '更新于' },
      socialLinks: [{ icon: 'github', link: 'https://github.com/belos-street/kb-vault' }],
      docFooter: { prev: '上一篇', next: '下一篇' },
    },
  }),
)
