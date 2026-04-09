import { crearNav }               from '../components/comp_nav.js'
import { crearCalendario }         from '../components/comp_calendario.js'
import { crearPanelDia }           from '../components/comp_panel_dia.js'
import { crearOverlaysSupervisor } from '../components/comp_overlays_sup.js'
import { mostrarToast }            from '../components/comp_toast.js'
import { obtenerEstaciones } from '../services/catalog_service.js'
import { obtenerMisSlotsPorMes, crearSlot, crearSlotRango, editarSlot, eliminarSlot, liberarSlot } from '../services/slots_service.js'

const ROLES = { 0: 'participante', 1: 'supervisor', 2: 'admin' }


// carga inicial
obtenerEstaciones().then(est => overlays.setEstaciones(est))




// ── entry point ────────────────────────────────────────────
export function cargarVista(app, estado) {
  app.innerHTML = ''

  const page = document.createElement('div')
  page.className = 'page'

  const contenido = document.createElement('div')
  contenido.className = 'page-content'

  // nav siempre presente
  const nav = crearNav(estado.usuario, {
    onLogin:  () => cargarVista(app, estado),
    onLogout: () => cargarVista(app, estado),
  })

  page.appendChild(nav)
  page.appendChild(contenido)
  app.appendChild(page)

  // montar sección según rol
  const rol = ROLES[estado.usuario?.rol]

  if (rol === 'supervisor' || rol === 'admin') {
    page.classList.add('page--supervisor')
    montarSupervisor(contenido, estado.usuario)
    return
  }

  // participante o sin sesión → bienvenida simple por ahora
  montarBienvenida(contenido, estado.usuario)
}

// ══════════════════════════════════════════════════════════
//  VISTA SUPERVISOR
// ══════════════════════════════════════════════════════════
function montarSupervisor(contenedor, usuario) {

  // ── estado local ───────────────────────────────────────
  let slotsDelMes = []

  // ── overlays (crear / editar / eliminar) ───────────────
  const overlays = crearOverlaysSupervisor({

    onCrearConfirm: async ({ fecha, hora, id_estacion }) => {
      const res = await crearSlot(usuario.uid, { fecha, hora, id_estacion })
      if (!res.ok) { mostrarToast(res.error, 'error'); return }
      mostrarToast('Slot creado')
      await refrescarMes()
      // si el panel está abierto en esa fecha, actualizar su lista
      sincronizarPanel(fecha)
    },

    onRangoConfirm: async (datos) => {
      const res = await crearSlotRango(usuario.uid, datos)
      if (!res.ok) { mostrarToast(res.error, 'error'); return }
      mostrarToast(`${res.creados} slot${res.creados !== 1 ? 's' : ''} creado${res.creados !== 1 ? 's' : ''}, ${res.omitidos} omitido${res.omitidos !== 1 ? 's' : ''}`)
      await refrescarMes()
    },

    onEditarConfirm: async ({ idSlot, fecha, hora, id_estacion }) => {
      const res = await editarSlot(idSlot, { fecha, hora, id_estacion })
      if (!res.ok) { mostrarToast(res.error, 'error'); return }
      mostrarToast('Slot actualizado')
      await refrescarMes()
      sincronizarPanel(fecha)
    },

    onEliminarConfirm: async ({ idSlot, motivo }) => {
      const res = await eliminarSlot(idSlot)
      if (!res.ok) { mostrarToast(res.error, 'error'); return }
      // si tenía reserva y hay motivo, acá iría el mail (Cloud Function futura)
      if (res.slotEliminado?.estado && motivo) {
        console.log('TODO: notificar cancelación →', motivo, res.slotEliminado)
      }
      mostrarToast('Slot eliminado')
      await refrescarMes()
      panel.cerrar()
    },

    
  })

  // ── calendario ─────────────────────────────────────────
  const calendario = crearCalendario(contenedor, [], {
    onDiaClick:  (fechaStr, slotsDia) => panel.abrir(fechaStr, slotsDia),
    onMesCambia: (anho, mes) => cargarSlots(anho, mes),
    marcarPasados: false,  // agregar esto
  })

  // ── panel del día ──────────────────────────────────────
  const panel = crearPanelDia(contenedor, {
    modo: 'supervisor',


    onCrear: (fechaStr) => {
      overlays.abrirCrear({ fechaPreset: fechaStr })
    },

    onEditar: (slot) => {
      overlays.abrirEditar(slot)
    },

    onEliminar: (slot) => {
      overlays.abrirEliminar(slot)
    },

    onLiberar: async (slot) => {
      const res = await liberarSlot(usuario.uid, slot.id)
      if (!res.ok) { mostrarToast(res.error, 'error'); return }
      mostrarToast('Slot liberado')
      await refrescarMes()
      sincronizarPanel(slot.fecha)
    },

    onEliminarBulk: async (ids) => {
      for (const id of ids) {
        await eliminarSlot(id)
      }
      mostrarToast(`${ids.length} slot${ids.length > 1 ? 's' : ''} eliminado${ids.length > 1 ? 's' : ''}`)
      const fecha = panel.getFecha()
      await refrescarMes()
      if (fecha) sincronizarPanel(fecha)
    },
  })

  // ── carga inicial ──────────────────────────────────────
  const { anho, mes } = calendario.getMes()

  obtenerEstaciones().then(est => overlays.setEstaciones(est))

  obtenerMisSlotsPorMes(usuario.uid, anho, mes).then(slots => {
    slotsDelMes = slots
    calendario.actualizar(slots)
  })

  // ── helpers ────────────────────────────────────────────
  async function cargarSlots(anho, mes) {
    slotsDelMes = await obtenerMisSlotsPorMes(usuario.uid, anho, mes)
    calendario.actualizar(slotsDelMes)
  }

  async function refrescarMes() {
    const { anho, mes } = calendario.getMes()
    await cargarSlots(anho, mes)
  }  // actualiza la lista del panel si está abierto en esa fecha
  function sincronizarPanel(fecha) {
    const slotsDia = slotsDelMes.filter(s => s.fecha === fecha)
    panel.actualizarSlots(slotsDia)
  }
}

// ══════════════════════════════════════════════════════════
//  BIENVENIDA (participante / sin sesión)
// ══════════════════════════════════════════════════════════
function montarBienvenida(contenedor, usuario) {
  const rol = ROLES[usuario?.rol]

  const textos = {
    participante: {
      badge:  'Participante',
      titulo: `¡Hola, ${usuario.nombre.split(' ')[0]}!`,
      texto:  'Próximamente vas a poder ver y gestionar tus reservas acá.',
    },
    default: {
      badge:  null,
      titulo: 'Reservá tu turno',
      texto:  'Iniciá sesión para ver tus reservas o explorá los turnos disponibles.',
    },
  }

  const info = textos[rol] ?? textos.default

  const div = document.createElement('div')
  div.className = 'bienvenida'
  div.innerHTML = `
    ${info.badge ? `<span class="bienvenida-badge bienvenida-badge--${rol}">${info.badge}</span>` : ''}
    <h1 class="bienvenida-titulo">${info.titulo}</h1>
    <p class="bienvenida-texto">${info.texto}</p>
  `
  contenedor.appendChild(div)
}

function fechaActualPanel() {
  return panel.getFecha()
}