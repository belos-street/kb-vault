export function setupToolbar(state) {
  const buttons = document.querySelectorAll('#toolbar button')
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.currentTool = btn.dataset.tool
      state.tr.nodes([])
    })
  })
}
