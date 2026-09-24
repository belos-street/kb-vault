// 自定义主题：扩展默认主题，附加 Mermaid 缩放增强与全局样式
import DefaultTheme from 'vitepress/theme'
import { setupMermaidZoom } from './mermaid-zoom'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof window !== 'undefined') setupMermaidZoom()
  },
}
