import '../styles/comp_panel_dia.css'
import { nombreEstacion } from '../services/catalog_service.js'

// ── Panel Día ──────────────────────────────────────────────
//
// uso:
//   const panel = crearPanelDia(contenedor, opciones)
//   panel.abrir(fechaStr, slots)
//   panel.cerrar()
//   panel.actualizarSlots(slots)   → recarga la lista sin cerrar
//
// opciones:
//   modo         = 'supervisor' | 'participante'
//   onCrear(fechaStr)              → click en "Nuevo slot"
//   onEditar(slot)                 → click en editar
//   onEliminar(slot)               → click en eliminar
//   onReservar(slot)               → click en un slot (participante)
//   nombreSupervisor(idSupervisor) → fn async para resolver nombre

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']



export function crearPanelDia(contenedor, opciones = {}) {

  let seleccionados = new Set()

  const {
    modo              = 'participante',
    onCrear           = () => {},
    onEditar          = () => {},
    onEliminar        = () => {},
    onEliminarBulk   = () => {},
    onReservar        = () => {},
    onLiberar        = () => {},  // ← agregar esto
  } = opciones

  // ── estado interno ─────────────────────────────────────
  let fechaActual = null
  let slotsActuales = []

  // ── estructura DOM ─────────────────────────────────────
  const panel = document.createElement('div')
  panel.className = 'panel-dia'
  panel.setAttribute('aria-hidden', 'true')

  panel.innerHTML = `
    <div class="panel-dia-header">
      <div class="panel-dia-header-left">
        <h3 class="panel-dia-titulo" id="panelDiaTitulo"></h3>
      </div>
      <button class="panel-dia-close" id="panelDiaClose" aria-label="Cerrar">✕</button>
    </div>
    ${modo === 'supervisor' ? `
      <div class="panel-dia-crear-row">
        <input type="checkbox" id="panelDiaCheckAll" class="panel-dia-check">
        <button class="panel-dia-crear" id="panelDiaCrear">
          <span class="panel-dia-crear-icon">+</span>
          <span>Nuevo slot</span>
        </button>
        <div class="panel-dia-acciones" id="panelDiaAcciones" style="display:none">
          <button class="panel-dia-btn panel-dia-btn--delete" id="panelDiaBtnEliminar">Eliminar</button>
          <button class="panel-dia-btn panel-dia-btn--edit" id="panelDiaBtnLiberar">Liberar</button>
        </div>
      </div>
    ` : ''}
    <div class="panel-dia-lista" id="panelDiaLista"></div>
  `

  contenedor.appendChild(panel)

  // ── eventos fijos ──────────────────────────────────────
  panel.querySelector('#panelDiaClose').addEventListener('click', cerrar)

  if (modo === 'supervisor') {
    panel.querySelector('#panelDiaCrear').addEventListener('click', () => {
      if (fechaActual) onCrear(fechaActual)
    })
  }

  // ── renderizado de slots ───────────────────────────────
  function renderizarSlots(slots) {



    const lista = panel.querySelector('#panelDiaLista')
    lista.innerHTML = ''

    seleccionados.clear()
    const checkAll = panel.querySelector('#panelDiaCheckAll')
    if (checkAll) checkAll.checked = false  // ← agregar esto
    actualizarBarraAcciones()

    if (!slots.length) {
      lista.innerHTML = `<p class="panel-dia-vacio">Sin slots este día</p>`
      return
    }

    // ordenar por hora
    const ordenados = [...slots].sort((a, b) => a.hora.localeCompare(b.hora))

    ordenados.forEach(slot => {
      const item = document.createElement('div')
      item.className = `panel-dia-slot ${slot.estado ? 'panel-dia-slot--reservado' : 'panel-dia-slot--libre'}`

      if (modo === 'supervisor') {
        item.innerHTML = `
          
          <div class="panel-dia-slot-info">
          <input type="checkbox" class="panel-dia-check panel-dia-check-slot" data-id="${slot.id}">
            <span class="panel-dia-slot-hora">${slot.hora}</span>
            <span class="panel-dia-slot-est">${nombreEstacion(slot.id_estacion)}</span>
            ${slot.estado
              ? `<span class="panel-dia-slot-badge panel-dia-slot-badge--ocupado">Reservado</span>`
              : `<span class="panel-dia-slot-badge panel-dia-slot-badge--libre">Libre</span>`
            }
          </div>
          ${slot.estado
            ? `<span class="panel-dia-slot-mail">${slot.evaluado_nombre ?? slot.evaluado_mail ?? ''}</span>`
            : ''
          }
          <div class="panel-dia-slot-actions">
            ${!slot.estado
              ? `<button class="panel-dia-btn panel-dia-btn--edit" data-id="${slot.id}">Editar</button>`
              : ''
            }
            <button class="panel-dia-btn panel-dia-btn--delete" data-id="${slot.id}">Eliminar</button>
          </div>
        `

        item.querySelector('[data-id].panel-dia-btn--edit')
          ?.addEventListener('click', () => onEditar(slot))

        item.querySelector('[data-id].panel-dia-btn--delete')
          ?.addEventListener('click', () => onEliminar(slot))

        item.querySelector('.panel-dia-check-slot')?.addEventListener('change', e => {
          toggleCheck(slot.id, e.target.checked)
})

      } else {
        // modo participante — slot es un botón completo
        item.innerHTML = `
          <span class="panel-dia-slot-hora">${slot.hora}</span>
          <span class="panel-dia-slot-est">${nombreEstacion(slot.id_estacion)}</span>
          <span class="panel-dia-slot-sup">${slot.nombre_supervisor ?? ''}</span>
          <span class="panel-dia-slot-arrow">›</span>
        `
        item.style.cursor = 'pointer'
        item.addEventListener('click', () => onReservar(slot))
      }

      lista.appendChild(item)
    })
  }

  // ── API pública ────────────────────────────────────────
  function abrir(fechaStr, slots) {
    
    fechaActual   = fechaStr
    slotsActuales = slots

    seleccionados.clear()

    // título
    const [a, m, d] = fechaStr.split('-')
    const fecha = new Date(parseInt(a), parseInt(m) - 1, parseInt(d))
    panel.querySelector('#panelDiaTitulo').textContent =
      `${DIAS[fecha.getDay()]} ${d} de ${MESES_CORTO[parseInt(m) - 1]}`

    renderizarSlots(slots)

    panel.classList.add('panel-dia--open')
    panel.setAttribute('aria-hidden', 'false')
  }

  function cerrar() {
    panel.classList.remove('panel-dia--open')
    panel.setAttribute('aria-hidden', 'true')
    fechaActual = null
    seleccionados.clear()
    const checkAll = panel.querySelector('#panelDiaCheckAll')
    if (checkAll) checkAll.checked = false
  }

  function actualizarSlots(slots) {
    slotsActuales = slots
    renderizarSlots(slots)
  }

  function actualizarBarraAcciones() {
    const barra = panel.querySelector('#panelDiaAcciones')
    if (!barra) return
    barra.style.display = seleccionados.size > 0 ? 'flex' : 'none'
  }

  function toggleCheck(id, checked) {
    checked ? seleccionados.add(id) : seleccionados.delete(id)
    actualizarBarraAcciones()
  }

  panel.querySelector('#panelDiaCheckAll')?.addEventListener('change', e => {
    const checks = panel.querySelectorAll('.panel-dia-check-slot')
    checks.forEach(ch => {
      ch.checked = e.target.checked
      toggleCheck(ch.dataset.id, e.target.checked)
    })
  })

  panel.querySelector('#panelDiaBtnLiberar')?.addEventListener('click', async () => {
    const ids = [...seleccionados]
    for (const id of ids) {
      const slot = slotsActuales.find(s => s.id === id)
      if (slot?.estado) await onLiberar(slot)
    }
    seleccionados.clear()
    actualizarBarraAcciones()
  })

  panel.querySelector('#panelDiaBtnEliminar')?.addEventListener('click', async () => {
    const ids = [...seleccionados]
    await onEliminarBulk(ids)
    seleccionados.clear()
    actualizarBarraAcciones()
  })

  return { abrir, cerrar, actualizarSlots, getFecha: () => fechaActual }
}
