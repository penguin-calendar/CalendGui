import { crearNav }                  from '../components/comp_nav.js'
import { crearCalendarioSup }        from '../components/comp_calendario_sup.js'
import { crearOverlaysSupervisor }   from '../components/comp_overlays_sup.js'
import { enrutar }                   from '../router.js'
import { obtenerSpots }              from '../services/catalog_service.js'
import { obtenerSlotsPorMes, obtenerMisSlotsPorMes, crearSlot } from '../services/slots_service.js'
import { mostrarToast } from '../components/comp_toast.js'
import { crearFiltrosSup } from '../components/comp_filtros_sup.js'

export function cargarVista(app, estado) {
  app.innerHTML = ''

  const page = document.createElement('div')
  page.className = 'page page--supervisor'

  const nav = crearNav(estado.usuario, {
    onLogin:  () => enrutar(app, estado),
    onLogout: () => enrutar(app, estado),
  })

  const contenido = document.createElement('div')
  contenido.className = 'page-content'

  const layout = document.createElement('div')
  layout.style.cssText = 'display:flex; gap:0; flex:1'
  contenido.appendChild(layout)

  const panelFiltros = document.createElement('div')
  const panelCal = document.createElement('div')
  panelCal.style.flex = '1'
  layout.appendChild(panelFiltros)
  layout.appendChild(panelCal)

  page.appendChild(nav)
  page.appendChild(contenido)
  app.appendChild(page)

  let mesActual = null

  const overlays = crearOverlaysSupervisor({
    onCrearConfirm: async ({ fecha, hora, id_spot }) => {
      const res = await crearSlot(estado.usuario.uid, { fecha, hora, id_spot })
      if (!res.ok) { mostrarToast(res.error, 'error'); return }
      mostrarToast('Slot creado')
      await cargarSlots(mesActual.anho, mesActual.mes)
    },
    onEditarConfirm:   async (datos) => { /* TODO */ },
    onRangoConfirm:    async (datos) => { /* TODO */ },
    onEliminarConfirm: async (datos) => { /* TODO */ },
  })

  const calendario = crearCalendarioSup(panelCal, [], [], {
    onCeldaClick: (fechaStr, hora, slotsAqui) => {
      overlays.abrirCrear({ fechaPreset: fechaStr, horaPreset: hora, slotsExistentes: slotsAqui })
    },
    onSemanaCambia: (desde, hasta) => {
      const anho = parseInt(desde.slice(0, 4))
      const mes  = parseInt(desde.slice(5, 7))
      if (!mesActual || mesActual.anho !== anho || mesActual.mes !== mes) {
        cargarSlots(anho, mes)
      }
    },
  })

  const filtros = crearFiltrosSup(panelFiltros, [], {
    onFiltrosCambia: ({ soloMios, spotsVisibles }) => {
      cargarSlots(mesActual.anho, mesActual.mes, soloMios)
      calendario.setSpotsVisibles(spotsVisibles)
    }
  })

  obtenerSpots().then(async spots => {
    console.log('spots:', spots)
    overlays.setSpots(spots)
    calendario.setSpots(spots)
    filtros.setSpots(spots)
    const { desde } = calendario.getSemana()
    const anho = parseInt(desde.slice(0, 4))
    const mes  = parseInt(desde.slice(5, 7))
    mesActual = { anho, mes }
    const slots = await obtenerSlotsPorMes(anho, mes)
    console.log('slots:', slots)
    calendario.actualizar(slots)
  })

  async function cargarSlots(anho, mes, soloMios = false) {
    mesActual = { anho, mes }
    const slots = soloMios
      ? await obtenerMisSlotsPorMes(estado.usuario.uid, anho, mes)
      : await obtenerSlotsPorMes(anho, mes)
    calendario.actualizar(slots)
  }
}