export class LayerManager {
    constructor(stage, state, history) {
        this.stage = stage
        this.state = state
        this.history = history
        this.layers = []
        this.currentIndex = 0
    }

    activeLayer() {
        return this.layers[this.currentIndex]
    }

    activeTr() {
        return this.activeLayer()?.findOne('Transformer') || null
    }

    addLayer(name) {
        name = name || `图层 ${this.layers.length + 1}`
        this.history?.saveState()
        const layer = new Konva.Layer({ name })
        const tr = new Konva.Transformer()
        layer.add(tr)
        this.stage.add(layer)
        this.layers.push(layer)
        this.currentIndex = this.layers.length - 1
        this._syncState()
        this.renderPanel()
        return layer
    }

    removeLayer(index) {
        if (index === 0 || this.layers.length <= 1) return
        this.layers[index].destroy()
        this.layers.splice(index, 1)
        this.currentIndex = Math.min(this.currentIndex, this.layers.length - 1)
        this._syncState()
        this.history?.saveState()
        this.renderPanel()
    }

    switchLayer(index) {
        if (index === this.currentIndex) return
        const oldTr = this.activeTr()
        if (oldTr) oldTr.nodes([])

        this.currentIndex = index
        this._syncState()

        this.history.undoStack = []
        this.history.redoStack = []
        this.history.saveState()

        this.renderPanel()
    }

    toggleVisibility(index) {
        this.layers[index].visible(!this.layers[index].visible())
        this.renderPanel()
    }

    moveUp(index) {
        if (index >= this.layers.length - 1) return;
        [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]]
        this.stage.setChildren(this.layers)
        this.currentIndex = index + 1
        this._syncState()
        this.renderPanel()
    }

    moveDown(index) {
        if (index <= 0) return;
        [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]]
        this.stage.setChildren(this.layers)
        this.currentIndex = index - 1
        this._syncState()
        this.renderPanel()
    }

    _syncState() {
        const layer = this.activeLayer()
        const tr = this.activeTr()
        if (layer) this.state.layer = layer
        if (tr) this.state.tr = tr
    }

    renderPanel() {
        const panel = document.getElementById('layer-panel')
        if (!panel) return
        panel.innerHTML = ''

        this.layers.forEach((layer, i) => {
            const item = document.createElement('div')
            item.className = 'layer-item' + (i === this.currentIndex ? ' active' : '')

            const visBtn = document.createElement('button')
            visBtn.textContent = layer.visible() ? '👁' : '👁‍🗨'
            visBtn.onclick = (e) => { e.stopPropagation(); this.toggleVisibility(i) }

            const nameSpan = document.createElement('span')
            nameSpan.textContent = layer.name()
            nameSpan.style.flex = '1'
            nameSpan.onclick = () => this.switchLayer(i)

            const delBtn = document.createElement('button')
            delBtn.textContent = '✕'
            delBtn.style.fontSize = '11px'
            delBtn.style.color = '#999'
            if (i === 0) {
                delBtn.style.visibility = 'hidden'
            }
            delBtn.onclick = (e) => { e.stopPropagation(); this.removeLayer(i) }

            item.appendChild(visBtn)
            item.appendChild(nameSpan)
            item.appendChild(delBtn)
            panel.appendChild(item)
        })
    }
}
