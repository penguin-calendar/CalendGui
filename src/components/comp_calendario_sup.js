import '../styles/comp_calendario_sup.css'

const DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const HORAS = Array.from({ length: 17 }, (_, i) =>
  String(i + 6).padStart(2, '0') + ':00'
)

export function crearCalendarioSup(contenedor, slotsIniciales = [], spots = [], opciones = {}) {

  const {
    onCeldaClick   = () => {},
    onSemanaCambia = () => {},
  } = opciones

  let slots = slotsIniciales
  let spotsCache = spots
  let semanaOffset = 0
  let spotsVisiblesSet = new Set()

  const wrapper = document.createElement('div')
  wrapper.className = 'cal-sup-wrapper'
  wrapper.innerHTML = `
    <div class="cal-sup-nav">
      <button class="cal-sup-nav-btn" id="calSupPrev">&#8249;</button>
      <span class="cal-sup-nav-label" id="calSupLabel"></span>
      <button class="cal-sup-nav-btn" id="calSupNext">&#8250;</button>
    </div>
    <div class="cal-sup-grid" id="calSupGrid"></div>
  `
  contenedor.appendChild(wrapper)

  wrapper.querySelector('#calSupPrev').addEventListener('click', () => {
    semanaOffset--
    renderizar()
    const { desde, hasta } = getSemana()
    onSemanaCambia(desde, hasta)
  })

  wrapper.querySelector('#calSupNext').addEventListener('click', () => {
    semanaOffset++
    renderizar()
    const { desde, hasta } = getSemana()
    onSemanaCambia(desde, hasta)
  })

  function getSemana() {
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - hoy.getDay() + (semanaOffset * 7))
    lunes.setHours(0, 0, 0, 0)

    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes)
      d.setDate(lunes.getDate() + i)
      return d
    })

    return { dias, desde: toFechaStr(dias[0]), hasta: toFechaStr(dias[6]) }
  }

  function toFechaStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  }

  function renderizar() {
    const { dias } = getSemana()
    const hoy = new Date()

    const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
    wrapper.querySelector('#calSupLabel').textContent =
      `${fmt(dias[0])} — ${fmt(dias[6])}`

    const grid = wrapper.querySelector('#calSupGrid')
    grid.innerHTML = ''

    // cabecera
    const vacio = document.createElement('div')
    vacio.className = 'cal-sup-cell cal-sup-cell--header cal-sup-cell--hora'
    grid.appendChild(vacio)

    dias.forEach((fecha) => {
      const esHoy = fecha.toDateString() === hoy.toDateString()
      const cell = document.createElement('div')
      cell.className = `cal-sup-cell cal-sup-cell--header${esHoy ? ' cal-sup-cell--hoy' : ''}`
      cell.innerHTML = `
        <span class="cal-sup-dia-nombre">${DIAS_CORTO[fecha.getDay()]}</span>
        <span class="cal-sup-dia-num">${fecha.getDate()}</span>
      `
      grid.appendChild(cell)
    })

    // filas de horas
    HORAS.forEach(hora => {
      const horaCell = document.createElement('div')
      horaCell.className = 'cal-sup-cell cal-sup-cell--hora'
      horaCell.textContent = hora
      grid.appendChild(horaCell)

      dias.forEach(fecha => {
        const fechaStr = toFechaStr(fecha)
        const slotsAqui = slots.filter(s =>
          s.fecha === fechaStr &&
          s.hora  === hora &&
          (spotsVisiblesSet.size === 0 || spotsVisiblesSet.has(s.id_spot))
        )

        const cell = document.createElement('div')
        cell.className = 'cal-sup-cell cal-sup-cell--slot'

        slotsAqui.forEach(slot => {
          const spot = spotsCache.find(e => e.id === slot.id_spot)

          const chip = document.createElement('span')
          chip.className = 'cal-sup-chip'
          chip.style.background = spot?.color ?? '#94a3b8'
          chip.textContent = spot?.nombre ?? slot.id_spot
          cell.appendChild(chip)
        })

        cell.addEventListener('click', () =>
          onCeldaClick(fechaStr, hora, slotsAqui)
        )

        grid.appendChild(cell)
      })
    })
  }

  renderizar()

  return {
    actualizar(nuevosSlots) {
      slots = nuevosSlots
      renderizar()
    },
    setSpots(lista) {
      spotsCache = lista
      spotsVisiblesSet = new Set(lista.map(s => s.id))
      renderizar()
    },
    setSpotsVisibles(ids) {
      spotsVisiblesSet = new Set(ids)
      renderizar()
    },
    getSemana,
  }
}