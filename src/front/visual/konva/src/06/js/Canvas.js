export function bindShapeEvents(shape, state, history) {
  shape.on('mouseover', () => { document.body.style.cursor = 'pointer' })
  shape.on('mouseout', () => { document.body.style.cursor = 'default' })

  shape.on('click', (e) => {
    e.cancelBubble = true
    if (state.tr) state.tr.nodes([shape])
  })

  shape.on('dragstart', () => {
    if (state.tr) state.tr.nodes([shape])
  })

  shape.on('dragend', () => {
    if (history) history.saveState()
  })

  shape.on('transformend', () => {
    const w = shape.width() * shape.scaleX()
    const h = shape.height() * shape.scaleY()
    shape.setAttrs({ width: w, height: h, scaleX: 1, scaleY: 1 })
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
          fill: 'rgba(74, 144, 217, 0.3)',
          stroke: '#4A90D9', strokeWidth: 2,
          draggable: true, name: 'shape',
        })
        break
      case 'circle':
        currentShape = new Konva.Ellipse({
          x: startPos.x, y: startPos.y,
          radiusX: 0, radiusY: 0,
          fill: 'rgba(231, 76, 60, 0.3)',
          stroke: '#E74C3C', strokeWidth: 2,
          draggable: true, name: 'shape',
        })
        break
      case 'text':
        const text = prompt('请输入文字：', '文字')
        if (text) {
          currentShape = new Konva.Text({
            x: startPos.x, y: startPos.y,
            text, fontSize: 24, fill: '#333',
            draggable: true, name: 'shape',
          })
          state.layer.add(currentShape)
          bindShapeEvents(currentShape, state, history)
          state.shapes.push(currentShape)
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

    if (currentShape.width() < 5 && currentShape.height() < 5) {
      currentShape.destroy()
    } else {
      bindShapeEvents(currentShape, state, history)
      state.shapes.push(currentShape)
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
      stroke: '#333', strokeWidth: 3,
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
    state.shapes.push(penLine)
    if (history) history.saveState()
    penLine = null
  })
}
