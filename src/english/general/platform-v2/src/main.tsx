import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import { ErrorBoundary } from './app/components/ErrorBoundary.tsx'
import { StorageWarning } from './app/components/StorageWarning.tsx'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('缺少 #root')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <StorageWarning />
      <App />
    </ErrorBoundary>
  </StrictMode>
)
