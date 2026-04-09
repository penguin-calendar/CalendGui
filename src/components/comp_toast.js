// ── Toast ──────────────────────────────────────────────────
// uso: mostrarToast('mensaje') | mostrarToast('error', 'error')

let toastEl = null

function obtenerToast() {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.id = 'toast'
    document.body.appendChild(toastEl)
  }
  return toastEl
}

export function mostrarToast(mensaje, tipo = 'ok') {
  const t = obtenerToast()
  t.textContent = mensaje
  t.className   = tipo === 'ok' ? 'toast-ok' : 'toast-error'
  t.style.display = 'block'
  clearTimeout(t._timeout)
  t._timeout = setTimeout(() => { t.style.display = 'none' }, 3000)
}