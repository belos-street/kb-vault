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
          const json = evt.target.result
          const loaded = Konva.Node.create(json)

          // 清除当前所有图层
          stage.find('Layer').forEach(l => l.destroy())
          layerManager.layers = []

          // 从加载的 Stage 中取出各 Layer 添加到当前 Stage
          loaded.find('Layer').forEach(l => {
            l.remove()
            // 确保每个 Layer 有 Transformer
            if (!l.findOne('Transformer')) {
              l.add(new Konva.Transformer())
            }
            stage.add(l)
            layerManager.layers.push(l)
          })

          layerManager.currentIndex = layerManager.layers.length - 1
          layerManager.renderPanel()
          alert('项目已加载')
        } catch (err) {
          alert('文件格式错误')
        }
      }
      reader.readAsText(e.target.files[0])
    }
    input.click()
  }

  document.getElementById('clearBtn').onclick = () => {
    if (!confirm('确定清空画布？')) return
    layerManager.layers.forEach(l => l.destroyChildren())
  }
}
