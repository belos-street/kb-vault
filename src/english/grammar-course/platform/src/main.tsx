import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app.tsx'
// oxlint-disable-next-line import/no-unassigned-import -- Vite 样式副作用导入
import './styles.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('missing #root')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
)
