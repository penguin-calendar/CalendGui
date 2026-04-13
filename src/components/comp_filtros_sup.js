// comp_filtros_sup.js
export function crearFiltrosSup(contenedor, spots = [], opciones = {}) {
  const { onFiltrosCambia = () => {} } = opciones

  let soloMios = false
  let spotsVisibles = new Set(spots.map(s => s.id))

  const panel = document.createElement('div')
  panel.className = 'filtros-sup'

  function render() {
    panel.innerHTML = `
      <p class="filtros-sup-titulo">Filtros</p>

      <label class="filtros-sup-item">
        <input type="checkbox" id="filtroSoloMios" ${soloMios ? 'checked' : ''}>
        <span>Solo mis slots</span>
      </label>

      <hr class="filtros-sup-divider">

      ${spots.map(s => `
        <label class="filtros-sup-item">
          <input type="checkbox" data-spot="${s.id}" ${spotsVisibles.has(s.id) ? 'checked' : ''}>
          <span class="filtros-sup-dot" style="background:${s.color}"></span>
          <span>${s.nombre}</span>
        </label>
      `).join('')}
    `

    panel.querySelector('#filtroSoloMios').addEventListener('change', e => {
      soloMios = e.target.checked
      emitir()
    })

    panel.querySelectorAll('[data-spot]').forEach(ch => {
      ch.addEventListener('change', e => {
        e.target.checked
          ? spotsVisibles.add(e.target.dataset.spot)
          : spotsVisibles.delete(e.target.dataset.spot)
        emitir()
      })
    })
  }

  function emitir() {
    onFiltrosCambia({ soloMios, spotsVisibles: [...spotsVisibles] })
  }

  render()
  contenedor.appendChild(panel)

  return {
    setSpots(lista) {
      spots = lista
      spotsVisibles = new Set(lista.map(s => s.id))
      render()
    }
  }
}