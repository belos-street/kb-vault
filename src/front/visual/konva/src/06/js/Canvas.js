export function bindShapeEvents(shape, state, history) {
  shape.on('mouseover', () => { document.body.style.cursor = 'pointer' })
  shape.on('mouseout', () => { document.body.style.cursor = 'default' })

  shape.on('click', (e) => {
    e.cancelBubble = true
    if (state.tr) state.tr.nodes([shape])
  })

  shape.on('dblclick dbltap', () => {
    if (shape.getClassName() !== 'Text') return
    const newText = prompt('修改文字：', shape.text())
    if (newText !== null && newText.trim()) {
      shape.text(newText)
      if (history) history.saveState()
    }
  })

  shape.on('dragstart', () => {
    if (state.tr) state.tr.nodes([shape])
  })

  shape.on('dragend', () => {
    if (history) history.saveState()
  })

  shape.on('transformend', () => {
    const sx = shape.scaleX()
    const sy = shape.scaleY()
    const cls = shape.getClassName()

    if (cls === 'Rect') {
      shape.setAttrs({
        width: shape.width() * sx,
        height: shape.height() * sy,
        scaleX: 1, scaleY: 1,
      })
    } else if (cls === 'Ellipse') {
      shape.setAttrs({
        radiusX: shape.radiusX() * sx,
        radiusY: shape.radiusY() * sy,
        scaleX: 1, scaleY: 1,
      })
    } else if (cls === 'Line') {
      const pts = shape.points().slice()
      shape.setAttrs({
        points: pts.map((v, i) => v * (i % 2 === 0 ? sx : sy)),
        scaleX: 1, scaleY: 1,
      })
    } else {
      // 兜底：其他图形不做合并，仅重置 scale 并设置宽高
      const w = shape.width() * sx
      const h = shape.height() * sy
      shape.setAttrs({ width: w, height: h, scaleX: 1, scaleY: 1 })
    }
    if (history) history.saveState()
  })
}

export function setupCanvas(state, history) {
  const stage = state.stage
  let isDrawing = false
  let currentShape = null
  let startPos = null

  // 图形绘制（矩形/圆形/文字）
  stage.on('mousedown', (e) => {
    const tr = state.tr
    if (e.target === stage) {
      if (tr) tr.nodes([])
    }

    if (state.currentTool === 'select' || state.currentTool === 'pen' || e.target !== stage) return

    isDrawing = true
    startPos = stage.getPointerPosition()

    switch (state.currentTool) {
      case 'rect':
        currentShape = new Konva.Rect({
          x: startPos.x, y: startPos.y,
          width: 0, height: 0,
          fill: state.currentColor + '4D',
          stroke: state.currentColor, strokeWidth: 2,
          draggable: true, name: 'shape',
        })
        break
      case 'circle':
        currentShape = new Konva.Ellipse({
          x: startPos.x, y: startPos.y,
          radiusX: 0, radiusY: 0,
          fill: state.currentColor + '4D',
          stroke: state.currentColor, strokeWidth: 2,
          draggable: true, name: 'shape',
        })
        break
      case 'text':
        const text = prompt('请输入文字：', '文字')
        if (text) {
          currentShape = new Konva.Text({
            x: startPos.x, y: startPos.y,
            text, fontSize: 24, fill: state.currentColor,
            draggable: true, name: 'shape',
          })
          state.layer.add(currentShape)
          bindShapeEvents(currentShape, state, history)
          if (history) history.saveState()
        }
        isDrawing = false
        return
    }

    if (currentShape) state.layer.add(currentShape)
  })

  stage.on('mousemove', () => {
    if (!isDrawing || !currentShape) return
    const pos = stage.getPointerPosition()

    if (state.currentTool === 'rect') {
      currentShape.setAttrs({
        width: pos.x - startPos.x,
        height: pos.y - startPos.y,
      })
    } else if (state.currentTool === 'circle') {
      const rx = Math.abs(pos.x - startPos.x) / 2
      const ry = Math.abs(pos.y - startPos.y) / 2
      currentShape.setAttrs({
        radiusX: rx, radiusY: ry,
        x: (startPos.x + pos.x) / 2,
        y: (startPos.y + pos.y) / 2,
      })
    }
  })

  stage.on('mouseup', () => {
    if (!isDrawing || !currentShape) return

    if (Math.abs(currentShape.width()) < 5 && Math.abs(currentShape.height()) < 5) {
      currentShape.destroy()
    } else {
      bindShapeEvents(currentShape, state, history)
      if (history) history.saveState()
    }

    currentShape = null
    isDrawing = false
  })

  // 自由画笔
  let isPenDown = false
  let penPoints = []
  let penLine = null

  stage.on('mousedown', (e) => {
    if (state.currentTool !== 'pen' || e.target !== stage) return

    isPenDown = true
    const pos = stage.getPointerPosition()
    penPoints = [pos.x, pos.y]

    penLine = new Konva.Line({
      points: penPoints,
      stroke: state.currentColor, strokeWidth: 3,
      lineCap: 'round', lineJoin: 'round',
      tension: 0.5, draggable: true, name: 'shape',
    })
    state.layer.add(penLine)
  })

  stage.on('mousemove', () => {
    if (!isPenDown) return
    const pos = stage.getPointerPosition()
    penPoints.push(pos.x, pos.y)
    penLine.points(penPoints)
  })

  stage.on('mouseup', () => {
    if (state.currentTool !== 'pen' || !isPenDown) return

    isPenDown = false
    bindShapeEvents(penLine, state, history)
    if (history) history.saveState()
    penLine = null
  })
}
