import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// oxlint-disable-next-line import/no-unassigned-import -- 平台样式
import './styles.css'
import { App } from './app.tsx'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('missing #root')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
)
