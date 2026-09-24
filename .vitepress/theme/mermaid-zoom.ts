// Mermaid 点击放大查看器
// 点击图示打开全屏 overlay：滚轮缩放、拖拽平移、双击复位、Esc / 关闭按钮 / 点击背景退出。
// 用事件委托绑定（.vp-doc .mermaid svg），与 mermaid 客户端渲染时机解耦，无需 MutationObserver。

export function setupMermaidZoom(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector('.mermaid-zoom-overlay')) return // 防重复初始化

  const overlay = document.createElement('div')
  overlay.className = 'mermaid-zoom-overlay'
  overlay.innerHTML =
    '<button class="mermaid-zoom-close" aria-label="关闭">✕</button>' +
    '<div class="mermaid-zoom-stage"></div>'
  document.body.appendChild(overlay)

  const stage = overlay.querySelector('.mermaid-zoom-stage') as HTMLElement
  const closeBtn = overlay.querySelector('.mermaid-zoom-close') as HTMLElement

  let scale = 1
  let tx = 0
  let ty = 0
  let dragging = false
  let startX = 0
  let startY = 0

  const apply = () => {
    stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
  }

  const open = (svg: SVGSVGElement) => {
    const cloned = svg.cloneNode(true) as SVGSVGElement
    cloned.style.cursor = 'grab'
    stage.innerHTML = ''
    stage.appendChild(cloned)
    // 初始缩放：大图适配到 90% 视口，小图最多放大到 1.5 倍
    const rect = cloned.getBoundingClientRect()
    scale = Math.min(
      1.5,
      (window.innerWidth * 0.9) / Math.max(rect.width, 1),
      (window.innerHeight * 0.9) / Math.max(rect.height, 1),
    )
    tx = 0
    ty = 0
    apply()
    overlay.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  const close = () => {
    overlay.classList.remove('open')
    document.body.style.overflow = ''
  }

  // 事件委托：正文里点击 mermaid 即打开
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    if (overlay.classList.contains('open')) return // overlay 打开期间由 overlay 自己的事件处理
    const svg = target.closest('.vp-doc .mermaid svg') as SVGSVGElement | null
    if (svg) open(svg)
  })

  closeBtn.addEventListener('click', close)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close() // 仅点击背景关闭，拖拽不误触
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })

  overlay.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      scale = Math.min(10, Math.max(0.2, scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
      apply()
    },
    { passive: false },
  )

  stage.addEventListener('pointerdown', (e) => {
    dragging = true
    startX = e.clientX - tx
    startY = e.clientY - ty
    stage.style.cursor = 'grabbing'
    stage.setPointerCapture(e.pointerId)
  })
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return
    tx = e.clientX - startX
    ty = e.clientY - startY
    apply()
  })
  stage.addEventListener('pointerup', () => {
    dragging = false
    stage.style.cursor = 'grab'
  })
  stage.addEventListener('dblclick', () => {
    scale = 1
    tx = 0
    ty = 0
    apply()
  })
}
