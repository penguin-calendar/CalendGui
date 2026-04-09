import '../styles/comp_calendario.css'

// ── Calendario ─────────────────────────────────────────────
//
// uso:
//   const cal = crearCalendario(contenedor, slots, opciones)
//   cal.actualizar(nuevosSlots)   → re-renderiza con nuevos datos
//   cal.getMes()                  → { anho, mes } actual visible
//
// opciones:
//   onDiaClick(fechaStr, slotsDia)  → callback al clickear un día
//   onMesCambia(anho, mes)          → callback al navegar de mes
//   marcarPasados  = true           → días pasados sin interacción
//   soloLibres     = false          → solo cuenta slots con estado:false

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]
const DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export function crearCalendario(contenedor, slotsIniciales = [], opciones = {}) {

  const {
    onDiaClick    = () => {},
    onMesCambia   = () => {},
    marcarPasados = true,
    soloLibres    = false,
  } = opciones

  // ── estado interno ─────────────────────────────────────
  let fechaVista = new Date()
  fechaVista.setDate(1)
  let slots = slotsIniciales

  // ── estructura DOM fija (no se re-crea al navegar) ─────
  const wrapper = document.createElement('div')
  wrapper.className = 'cal-wrapper'

  wrapper.innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" id="calPrev">&#8249;</button>
      <span class="cal-nav-label" id="calLabel"></span>
      <button class="cal-nav-btn" id="calNext">&#8250;</button>
    </div>
    <div class="cal-weekdays">
      ${DIAS_CORTO.map(d => `<span class="cal-weekday">${d}</span>`).join('')}
    </div>
    <div class="cal-grid" id="calGrid"></div>
  `

  contenedor.appendChild(wrapper)

  // ── eventos de navegación ──────────────────────────────
  wrapper.querySelector('#calPrev').addEventListener('click', () => {
    fechaVista.setMonth(fechaVista.getMonth() - 1)
    renderizar()
    onMesCambia(fechaVista.getFullYear(), fechaVista.getMonth() + 1)
  })

  wrapper.querySelector('#calNext').addEventListener('click', () => {
    fechaVista.setMonth(fechaVista.getMonth() + 1)
    renderizar()
    onMesCambia(fechaVista.getFullYear(), fechaVista.getMonth() + 1)
  })

  // ── renderizado de la grilla ───────────────────────────
  function renderizar() {
    const anho      = fechaVista.getFullYear()
    const mes       = fechaVista.getMonth()
    const hoy       = new Date()
    const primerDia = new Date(anho, mes, 1).getDay()
    const totalDias = new Date(anho, mes + 1, 0).getDate()

    wrapper.querySelector('#calLabel').textContent =
      `${MESES[mes]} ${anho}`

    const grid = wrapper.querySelector('#calGrid')
    grid.innerHTML = ''

    // celdas vacías antes del primer día
    for (let i = 0; i < primerDia; i++) {
      const el = document.createElement('div')
      el.className = 'cal-cell cal-cell--empty'
      grid.appendChild(el)
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const fechaStr = toFechaStr(anho, mes + 1, dia)
      const fecha    = new Date(anho, mes, dia)

      const esPasado = marcarPasados &&
        fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const esHoy    = hoy.getFullYear() === anho &&
        hoy.getMonth() === mes && hoy.getDate() === dia

      const slotsDia = slots.filter(s => {
        if (s.fecha !== fechaStr) return false
        return soloLibres ? s.estado === false : true
      })

      const tieneSlots = slotsDia.length > 0
      const libres     = slotsDia.filter(s => s.estado === false).length
      const reservados = slotsDia.filter(s => s.estado === true).length

      const el = document.createElement('div')
      el.dataset.fecha = fechaStr

      // clases de estado
      const clases = ['cal-cell']
      if (esHoy) clases.push('cal-cell--hoy')
      else       clases.push('cal-cell--normal')
      if (tieneSlots) clases.push('cal-cell--activo')
      el.className = clases.join(' ')

      // contenido
      el.innerHTML = `<span class="cal-cell-num">${dia}</span>`

      // indicadores de slots
      if (tieneSlots) {
        const dots = document.createElement('div')
        dots.className = 'cal-cell-dots'
        if (libres > 0) {
          const d = document.createElement('span')
          d.className = 'cal-dot cal-dot--libre'
          dots.appendChild(d)
        }
        if (reservados > 0) {
          const d = document.createElement('span')
          d.className = 'cal-dot cal-dot--reservado'
          dots.appendChild(d)
        }
        el.appendChild(dots)
      }

      // click siempre habilitado
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => onDiaClick(fechaStr, slotsDia))

      grid.appendChild(el)
    }
  }

  // ── API pública ────────────────────────────────────────
  renderizar()

  return {
    actualizar(nuevosSlots) {
      slots = nuevosSlots
      renderizar()
    },
    getMes() {
      return {
        anho: fechaVista.getFullYear(),
        mes:  fechaVista.getMonth() + 1
      }
    },
    irAMes(anho, mes) {
      fechaVista = new Date(anho, mes - 1, 1)
      renderizar()
    }
  }
}

// ── helper ─────────────────────────────────────────────────
function toFechaStr(anho, mes, dia) {
  return `${anho}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
}