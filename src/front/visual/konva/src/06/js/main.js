import { setupToolbar } from './Toolbar.js'
import { setupCanvas } from './Canvas.js'
import { HistoryManager } from './History.js'
import { LayerManager } from './LayerPanel.js'
import { setupExport } from './Export.js'

const container = document.getElementById('container')
const stage = new Konva.Stage({
  container: 'container',
  width: container.clientWidth,
  height: container.clientHeight,
})

const state = { stage, layer: null, tr: null, currentTool: 'select', currentColor: '#4A90D9' }
const history = new HistoryManager(state)
const layerManager = new LayerManager(stage, state, history)

// 快捷键
const toolKeys = { v: 'select', p: 'pen', r: 'rect', c: 'circle', t: 'text' }
document.addEventListener('keydown', (e) => {
  const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA'

  if (!isInput) {
    const tool = toolKeys[e.key.toLowerCase()]
    if (tool) {
      document.querySelectorAll('#toolbar button[data-tool]').forEach(b => {
        b.classList.toggle('active', b.dataset.tool === tool)
      })
      state.currentTool = tool
      state.tr?.nodes([])
      return
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.tr && state.tr.nodes().length > 0) {
        e.preventDefault()
        state.tr.nodes().forEach(n => n.destroy())
        state.tr.nodes([])
        history.saveState()
      }
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); history.undo()
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    e.preventDefault(); history.redo()
  }
})

setupToolbar(state)
setupCanvas(state, history)
setupExport(stage, layerManager)

// 初始图层
layerManager.addLayer('主图层')

// 添加图层按钮
document.getElementById('addLayerBtn').onclick = () => layerManager.addLayer()

// 颜色选择
document.getElementById('colorPicker').oninput = (e) => {
  state.currentColor = e.target.value
}

// 窗口 resize
window.addEventListener('resize', () => {
  stage.width(container.clientWidth)
  stage.height(container.clientHeight)
})
