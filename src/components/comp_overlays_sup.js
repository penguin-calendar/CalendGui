import '../styles/comp_overlays_sup.css'
import { nombreSpot } from '../services/catalog_service.js'

const HORAS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6
  return String(h).padStart(2, '0') + ':00'
})

export function crearOverlaysSupervisor(callbacks = {}) {
  const {
    onCrearConfirm = () => {},
  } = callbacks

  const root = document.createElement('div')
  root.id = 'overlaysSupervisor'

  root.innerHTML = `
    <!-- ══ CREAR SLOT ══ -->
    <div class="ovl-bg" id="ovlCrear">
      <div class="ovl-card">

        <div class="ovl-header">
          <h3 class="ovl-titulo" id="ovlCrearTitulo">Nuevo slot</h3>
          <button class="ovl-close" id="ovlCrearClose">✕</button>
        </div>

        <label class="ovl-label">Spot</label>
        <select class="ovl-select" id="ovlCrearSpot"></select>

        <label class="ovl-label">Hora</label>
        <select class="ovl-select" id="ovlCrearHora">
          ${HORAS.map(h => `<option value="${h}">${h}</option>`).join('')}
        </select>

        <div class="ovl-actions">
          <button class="ovl-btn ovl-btn--ghost" id="ovlCrearCancelar">Cancelar</button>
          <button class="ovl-btn ovl-btn--primary" id="ovlCrearConfirm">Crear</button>
        </div>

      </div>
    </div>
  `

  document.body.appendChild(root)

  const ovlCrear = root.querySelector('#ovlCrear')

  let spotsCargados = []
  let fechaActual = ''

  // ── helpers ────────────────────────────────
  const abrir = el => el.classList.add('ovl-bg--open')
  const cerrar = el => el.classList.remove('ovl-bg--open')

  function mostrarToast(msg) {
    import('./comp_toast.js').then(({ mostrarToast }) =>
      mostrarToast(msg, 'error')
    )
  }

  // ── set spots ──────────────────────────────
  function setSpots(lista) {
    spotsCargados = lista

    const select = root.querySelector('#ovlCrearSpot')
    select.innerHTML = spotsCargados.length
      ? spotsCargados.map(s =>
          `<option value="${s.id}">${s.nombre}</option>`
        ).join('')
      : '<option value="">Sin spots</option>'
  }

  // ── abrir ──────────────────────────────────
  function abrirCrear({ fechaPreset = '', horaPreset = '', slotsExistentes = [] } = {}) {
    fechaActual = fechaPreset

    const [a, m, d] = fechaPreset ? fechaPreset.split('-') : []
    root.querySelector('#ovlCrearTitulo').textContent =
      fechaPreset ? `${d}/${m}/${a} · ${horaPreset}` : 'Nuevo slot'

    const selectHora  = root.querySelector('#ovlCrearHora')
    const labelHora   = selectHora.previousElementSibling
    selectHora.value  = horaPreset
    selectHora.style.display = horaPreset ? 'none' : ''
    labelHora.style.display  = horaPreset ? 'none' : ''

    const idsOcupados = new Set(slotsExistentes.map(s => s.id_spot))
    const select = root.querySelector('#ovlCrearSpot')
    select.innerHTML = spotsCargados
      .filter(s => !idsOcupados.has(s.id))
      .map(s => `<option value="${s.id}">${s.nombre}</option>`)
      .join('') || '<option value="">Sin spots disponibles</option>'

    abrir(ovlCrear)
  }

  // ── cerrar ────────────────────────────────
  function cerrarCrear() {
    cerrar(ovlCrear)
  }

  // ── confirm ───────────────────────────────
  root.querySelector('#ovlCrearConfirm').addEventListener('click', async () => {
    const hora = root.querySelector('#ovlCrearHora').value
    const id_spot = root.querySelector('#ovlCrearSpot').value

    if (!fechaActual || !hora || !id_spot) {
      mostrarToast('Completa todos los campos')
      return
    }

    cerrarCrear()

    await onCrearConfirm({
      fecha: fechaActual,
      hora,
      id_spot
    })
  })

  // ── cerrar UI ─────────────────────────────
  root.querySelector('#ovlCrearClose').addEventListener('click', cerrarCrear)
  root.querySelector('#ovlCrearCancelar').addEventListener('click', cerrarCrear)

  ovlCrear.addEventListener('click', e => {
    if (e.target === ovlCrear) cerrarCrear()
  })

  return {
    abrirCrear,
    setSpots,
  }
}