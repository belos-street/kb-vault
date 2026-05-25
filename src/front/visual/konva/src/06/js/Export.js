import { bindShapeEvents } from './Canvas.js'

export function setupExport(stage, layerManager) {
  document.getElementById('exportPng').onclick = () => {
    const link = document.createElement('a')
    link.href = stage.toDataURL({ mimeType: 'image/png' })
    link.download = 'whiteboard.png'
    link.click()
  }

  document.getElementById('saveProject').onclick = () => {
    const json = stage.toJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'project.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  document.getElementById('loadProject').onclick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target.result)

          stage.find('Layer').forEach(l => l.destroy())
          layerManager.layers = []

          const stageData = json.className === 'Stage' ? json : { attrs: {}, children: [] }

            ; (stageData.children || []).forEach(layerData => {
              if (layerData.className !== 'Layer') return
              const layer = new Konva.Layer({ name: layerData.attrs?.name || `图层 ${layerManager.layers.length + 1}` })

                ; (layerData.children || []).forEach(childData => {
                  if (childData.className === 'Transformer') return
                  const node = Konva.Node.create(childData)
                  layer.add(node)
                  bindShapeEvents(node, layerManager.state, layerManager.history)
                })

              layer.add(new Konva.Transformer())
              stage.add(layer)
              layerManager.layers.push(layer)
            })

          layerManager.currentIndex = layerManager.layers.length - 1
          layerManager._syncState()
          layerManager.renderPanel()

          layerManager.history.undoStack = []
          layerManager.history.redoStack = []
          layerManager.history.saveState()

          alert('项目已加载')
        } catch (err) {
          console.error('加载失败:', err)
          alert('文件格式错误：' + err.message)
        }
      }
      reader.readAsText(e.target.files[0])
    }
    input.click()
  }

  document.getElementById('clearBtn').onclick = () => {
    if (!confirm('确定清空画布？')) return
    layerManager.layers.forEach(l => {
      l.children.filter(c => c.getClassName() !== 'Transformer').forEach(c => c.destroy())
      l.findOne('Transformer')?.nodes([])
    })
    layerManager.history?.saveState()
  }
}
