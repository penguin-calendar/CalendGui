import '../styles/comp_overlays_sup.css'
import { nombreEstacion } from '../services/catalog_service.js'

// ── Overlays Supervisor ────────────────────────────────────
//
// uso:
//   const overlays = crearOverlaysSupervisor({ onCrearConfirm, onRangoConfirm,
//                                              onEditarConfirm, onEliminarConfirm })
//   overlays.abrirCrear({ fechaPreset })   → overlay slot individual
//   overlays.abrirRango()                  → overlay rango
//   overlays.abrirEditar(slot)             → overlay editar
//   overlays.abrirEliminar(slot)           → overlay confirmar eliminación

// estados
let fechaCrear = ''

const HORAS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6 // 06:00 → 22:00
  return String(h).padStart(2, '0') + ':00'
})

export function crearOverlaysSupervisor(callbacks = {}) {
  const {
    onCrearConfirm   = () => {},
    onRangoConfirm   = () => {},
    onEditarConfirm  = () => {},
    onEliminarConfirm = () => {},
  } = callbacks

  // ── inyectar contenedor de overlays en el body ─────────
  const root = document.createElement('div')
  root.id = 'overlaysSupervisor'
  root.innerHTML = `

    <!-- ══ CREAR / EDITAR slot individual ══ -->
    <div class="ovl-bg" id="ovlCrear">
      <div class="ovl-card">
        <div class="ovl-header">
          <h3 class="ovl-titulo" id="ovlCrearTitulo">Nuevo slot</h3>
          <button class="ovl-close" id="ovlCrearClose">✕</button>
        </div>

        <label class="ovl-label">Estación</label>
        <select class="ovl-select" id="ovlCrearEstacion"></select>

        <label class="ovl-label">Hora</label>
        <select class="ovl-select" id="ovlCrearHora">
          ${HORAS.map(h => `<option value="${h}">${h}</option>`).join('')}
        </select>

        <div class="ovl-actions">
          <button class="ovl-btn ovl-btn--ghost" id="ovlCrearCancelar">Cancelar</button>
          <button class="ovl-btn ovl-btn--primary" id="ovlCrearConfirm">Guardar</button>
        </div>
      </div>
    </div>

    <!-- ══ CREAR por RANGO ══ -->
    <div class="ovl-bg" id="ovlRango">
      <div class="ovl-card">
        <div class="ovl-header">
          <h3 class="ovl-titulo">Crear por rango</h3>
          <button class="ovl-close" id="ovlRangoClose">✕</button>
        </div>

        <label class="ovl-label">Estación</label>
        <select class="ovl-select" id="ovlRangoEstacion"></select>

        <div class="ovl-row">
          <div class="ovl-col">
            <label class="ovl-label">Fecha desde</label>
            <input type="date" class="ovl-input" id="ovlRangoDesde" />
          </div>
          <div class="ovl-col">
            <label class="ovl-label">Fecha hasta</label>
            <input type="date" class="ovl-input" id="ovlRangoHasta" />
          </div>
        </div>

        <div class="ovl-row">
          <div class="ovl-col">
            <label class="ovl-label">Hora desde</label>
            <select class="ovl-select" id="ovlRangoHoraDesde">
              ${HORAS.map(h => `<option value="${h.split(':')[0]}">${h}</option>`).join('')}
            </select>
          </div>
          <div class="ovl-col">
            <label class="ovl-label">Hora hasta</label>
            <select class="ovl-select" id="ovlRangoHoraHasta">
              ${HORAS.map(h => `<option value="${h.split(':')[0]}">${h}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="ovl-actions">
          <button class="ovl-btn ovl-btn--ghost" id="ovlRangoCancelar">Cancelar</button>
          <button class="ovl-btn ovl-btn--primary" id="ovlRangoConfirm">Crear</button>
        </div>
      </div>
    </div>

    <!-- ══ ELIMINAR slot ══ -->
    <div class="ovl-bg" id="ovlEliminar">
      <div class="ovl-card">
        <div class="ovl-header">
          <h3 class="ovl-titulo">Eliminar slot</h3>
          <button class="ovl-close" id="ovlEliminarClose">✕</button>
        </div>

        <p class="ovl-resumen" id="ovlEliminarResumen"></p>

        <div id="ovlEliminarMotivoWrap">
          <label class="ovl-label">Motivo <span class="ovl-label-hint">(se notifica al evaluado)</span></label>
          <textarea class="ovl-textarea" id="ovlEliminarMotivo" rows="3"
            placeholder="Ej: El supervisor no estará disponible ese día..."></textarea>
        </div>

        <div class="ovl-actions">
          <button class="ovl-btn ovl-btn--ghost" id="ovlEliminarCancelar">Volver</button>
          <button class="ovl-btn ovl-btn--danger" id="ovlEliminarConfirm">Eliminar</button>
        </div>
      </div>
    </div>

  `
  document.body.appendChild(root)

  // ── referencias DOM ────────────────────────────────────
  const ovlCrear    = root.querySelector('#ovlCrear')
  const ovlRango    = root.querySelector('#ovlRango')
  const ovlEliminar = root.querySelector('#ovlEliminar')

  // ── estado interno ─────────────────────────────────────
  let modoEditar  = false   // false = crear, true = editar
  let slotEditar  = null
  let slotEliminar = null

  // ── poblar estaciones desde Firestore ──────────────────
  // Las estaciones se pasan como array o se cargan al abrir
  let estacionesCargadas = []

  function poblarEstaciones(selects) {
    selects.forEach(sel => {
      sel.innerHTML = estacionesCargadas.length
        ? estacionesCargadas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')
        : '<option value="" disabled>Sin estaciones</option>'
    })
  }

  // API pública para cargar estaciones desde la vista
  function setEstaciones(lista) {
    estacionesCargadas = lista
    poblarEstaciones([
      root.querySelector('#ovlCrearEstacion'),
      root.querySelector('#ovlRangoEstacion'),
    ])
  }

  // ── helpers abrir / cerrar ─────────────────────────────
  function abrir(ovl)  { ovl.classList.add('ovl-bg--open') }
  function cerrar(ovl) { ovl.classList.remove('ovl-bg--open') }

  // ── CREAR ──────────────────────────────────────────────
  function abrirCrear({ fechaPreset = '' } = {}) {
    fechaCrear = fechaPreset
    modoEditar = false
    slotEditar = null
    root.querySelector('#ovlCrearTitulo').textContent = fechaPreset || 'Nuevo slot'
    poblarEstaciones([root.querySelector('#ovlCrearEstacion')])
    abrir(ovlCrear)
  }

  // ── EDITAR ─────────────────────────────────────────────
  function abrirEditar(slot) {
    modoEditar = true
    slotEditar = slot
    fechaCrear = slot.fecha  // guardá la fecha en el estado interno
    root.querySelector('#ovlCrearTitulo').textContent = 'Editar slot'
    poblarEstaciones([root.querySelector('#ovlCrearEstacion')])
    root.querySelector('#ovlCrearHora').value     = slot.hora
    // después de poblar, setear estación
    setTimeout(() => {
      root.querySelector('#ovlCrearEstacion').value = slot.id_estacion
    }, 0)
    abrir(ovlCrear)
  }

  // ── RANGO ──────────────────────────────────────────────
  function abrirRango() {
    root.querySelector('#ovlRangoDesde').value = ''
    root.querySelector('#ovlRangoHasta').value = ''
    poblarEstaciones([root.querySelector('#ovlRangoEstacion')])
    abrir(ovlRango)
  }

  // ── ELIMINAR ───────────────────────────────────────────
  function abrirEliminar(slot) {
    slotEliminar = slot
    const [a, m, d] = slot.fecha.split('-')
    root.querySelector('#ovlEliminarResumen').textContent =
      `${d}/${m}/${a} · ${slot.hora} · Est. ${nombreEstacion(slot.id_estacion)}`

    // mostrar textarea solo si el slot tiene reserva
    root.querySelector('#ovlEliminarMotivoWrap').style.display =
      slot.estado ? 'block' : 'none'
    root.querySelector('#ovlEliminarMotivo').value = ''

    abrir(ovlEliminar)
  }

  // ── listeners: cerrar ──────────────────────────────────
  root.querySelector('#ovlCrearClose').addEventListener('click',    () => cerrar(ovlCrear))
  root.querySelector('#ovlCrearCancelar').addEventListener('click', () => cerrar(ovlCrear))
  root.querySelector('#ovlRangoClose').addEventListener('click',    () => cerrar(ovlRango))
  root.querySelector('#ovlRangoCancelar').addEventListener('click', () => cerrar(ovlRango))
  root.querySelector('#ovlEliminarClose').addEventListener('click',    () => cerrar(ovlEliminar))
  root.querySelector('#ovlEliminarCancelar').addEventListener('click', () => cerrar(ovlEliminar))

  // cerrar al click en el backdrop
  ;[ovlCrear, ovlRango, ovlEliminar].forEach(ovl => {
    ovl.addEventListener('click', e => {
      if (e.target === ovl) cerrar(ovl)
    })
  })

  // ── listeners: confirmar ───────────────────────────────

  // crear / editar
  root.querySelector('#ovlCrearConfirm').addEventListener('click', async () => {
    const hora        = root.querySelector('#ovlCrearHora').value
    const id_estacion = root.querySelector('#ovlCrearEstacion').value

    if (!hora || !id_estacion) {
      mostrarToastLocal('Completá todos los campos', 'error'); return
    }

    cerrar(ovlCrear)

    if (modoEditar) {
      await onEditarConfirm({ idSlot: slotEditar.id, fecha: fechaCrear, hora, id_estacion })
    } else {
      await onCrearConfirm({ fecha: fechaCrear, hora, id_estacion })
    }
  })

  // rango
  root.querySelector('#ovlRangoConfirm').addEventListener('click', async () => {
    const fechaDesde  = root.querySelector('#ovlRangoDesde').value
    const fechaHasta  = root.querySelector('#ovlRangoHasta').value
    const horaDesde   = root.querySelector('#ovlRangoHoraDesde').value
    const horaHasta   = root.querySelector('#ovlRangoHoraHasta').value
    const id_estacion = root.querySelector('#ovlRangoEstacion').value

    if (!fechaDesde || !fechaHasta || !horaDesde || !horaHasta || !id_estacion) {
      mostrarToastLocal('Completá todos los campos', 'error'); return
    }

    cerrar(ovlRango)
    await onRangoConfirm({ fechaDesde, fechaHasta, horaDesde, horaHasta, id_estacion })
  })

  // eliminar
  root.querySelector('#ovlEliminarConfirm').addEventListener('click', async () => {
    const motivo = root.querySelector('#ovlEliminarMotivo').value.trim()

    // motivo obligatorio solo si el slot tenía reserva
    if (slotEliminar?.estado && !motivo) {
      mostrarToastLocal('Ingresá un motivo de cancelación', 'error'); return
    }

    cerrar(ovlEliminar)
    await onEliminarConfirm({ idSlot: slotEliminar.id, motivo })
  })

  // ── toast local (reutiliza comp_toast si está disponible) ──
  function mostrarToastLocal(msg, tipo) {
    // importar dinámicamente para no crear dependencia circular
    import('./comp_toast.js').then(({ mostrarToast }) => mostrarToast(msg, tipo))
  }

  return { abrirCrear, abrirEditar, abrirRango, abrirEliminar, setEstaciones }
}