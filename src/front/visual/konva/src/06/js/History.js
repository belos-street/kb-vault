import { bindShapeEvents } from './Canvas.js'

export class HistoryManager {
  constructor(state, maxSteps = 30) {
    this.state = state
    this.maxSteps = maxSteps
    this.undoStack = []
    this.redoStack = []
  }

  saveState() {
    const { layer } = this.state
    if (!layer) return
    this.undoStack.push(layer.toJSON())
    this.redoStack = []
    if (this.undoStack.length > this.maxSteps) this.undoStack.shift()
  }

  undo() {
    if (this.undoStack.length <= 1) return
    this.redoStack.push(this.undoStack.pop())
    this._restore(this.undoStack[this.undoStack.length - 1])
  }

  redo() {
    if (this.redoStack.length === 0) return
    this.undoStack.push(this.redoStack.pop())
    this._restore(this.undoStack[this.undoStack.length - 1])
  }

  _restore(json) {
    const { layer, tr } = this.state
    if (!layer) return
    const selectedIds = tr ? tr.nodes().map(n => n.id()) : []

    // 拷贝 children 再遍历，避免 destroy() 修改内部数组导致遍历错乱
    ;[...layer.children].forEach(child => {
      if (child !== tr) child.destroy()
    })

    // 从序列化的 Layer JSON 中提取 children 数据逐个重建
    const parsed = JSON.parse(json)
    ;(parsed.children || []).forEach(childData => {
      if (childData.className === 'Transformer') return
      const node = Konva.Node.create(JSON.stringify(childData))
      layer.add(node)
      bindShapeEvents(node, this.state, this)
    })

    // 重新将 Transformer 置于顶层
    if (tr) {
      tr.moveToTop()
    }

    // 恢复选中
    if (tr && selectedIds.length > 0) {
      const nodes = selectedIds.map(id => layer.findOne('#' + id)).filter(Boolean)
      tr.nodes(nodes)
    }
  }
}
