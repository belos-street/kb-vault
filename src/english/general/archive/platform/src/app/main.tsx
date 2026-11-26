import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
// 侧效导入：全局样式（无导出绑定）
// oxlint-disable-next-line import/no-unassigned-import
import './styles.css'

const root = document.getElementById('root')
if (root === null) throw new Error('#root 不存在')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
