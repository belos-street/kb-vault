import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[lexio] render failed', error, info)
  }

  override render() {
    if (this.state.error) {
      return (
        <main className="shell">
          <header className="masthead">
            <p className="kicker">Lexio v2</p>
            <h1>页面出错了</h1>
          </header>
          <p className="notice">
            刷新后重试。如果仍然打不开，先备份 localStorage 里的{' '}
            <code>lexio-v2:store:v2</code>，再排查。
          </p>
          <a className="backlink" href="#/">
            回到今日
          </a>
        </main>
      )
    }
    return this.props.children
  }
}
