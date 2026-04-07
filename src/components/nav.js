import { loginConGoogle, logout } from '../config/firebase.js'
import '../styles/nav.css'

// ── Nav ────────────────────────────────────────────────────
// uso: crearNav(usuario, { onLogin, onLogout, onMisReservas, onSupervisor })
export function crearNav(usuario, callbacks = {}) {

  const { onLogin, onLogout, onMisReservas, onSupervisor } = callbacks

  const nav = document.createElement('nav')
  nav.className = 'nav'
  nav.innerHTML = `
    <div class="nav-brand">
      <img src="https://lh3.googleusercontent.com/d/1ZFVOuBX8oWOlM53Q4AzTXH60wvwoWUHU" alt="CalendGüi" class="nav-logo" />
    </div>

    <div class="nav-right">
      ${usuario ? `
        <img src="${usuario.foto}" alt="${usuario.nombre}" class="nav-avatar" referrerpolicy="no-referrer" />
      ` : ''}
      <button class="nav-menu-btn" id="navMenuBtn">☰</button>
    </div>

    <!-- menu -->
    <div class="nav-menu" id="navMenu">
      <div class="nav-menu-header">
        <span class="nav-menu-titulo">Menú</span>
        <button class="nav-menu-close" id="navMenuClose">✕</button>
      </div>

      ${!usuario ? `
        <button class="nav-menu-item" id="navItemLogin">
          Iniciar sesión con Google
        </button>
      ` : ''}

      ${usuario ? `
        <div class="nav-menu-user">
          <img src="${usuario.foto}" alt="${usuario.nombre}" class="nav-menu-avatar" referrerpolicy="no-referrer" />
          <div>
            <p class="nav-menu-nombre">${usuario.nombre}</p>
            <p class="nav-menu-email">${usuario.email}</p>
          </div>
        </div>
        <hr class="nav-menu-divider" />
        <button class="nav-menu-item" id="navItemMisReservas">Mis reservas</button>
      ` : ''}

      ${usuario?.rol === 'supervisor' || usuario?.rol === 'admin' ? `
        <button class="nav-menu-item" id="navItemSupervisor">Vista supervisor</button>
      ` : ''}

      ${usuario ? `
        <hr class="nav-menu-divider" />
        <button class="nav-menu-item nav-menu-item-danger" id="navItemLogout">Cerrar sesión</button>
      ` : ''}
    </div>

    <!-- backdrop -->
    <div class="nav-backdrop" id="navBackdrop"></div>
  `

  // ── eventos internos ──────────────────────────────────────
  const menuBtn   = nav.querySelector('#navMenuBtn')
  const menuClose = nav.querySelector('#navMenuClose')
  const menu      = nav.querySelector('#navMenu')
  const backdrop  = nav.querySelector('#navBackdrop')

  function abrirMenu() {
    menu.classList.add('open')
    backdrop.classList.add('open')
  }

  function cerrarMenu() {
    menu.classList.remove('open')
    backdrop.classList.remove('open')
  }

  menuBtn.addEventListener('click', abrirMenu)
  menuClose.addEventListener('click', cerrarMenu)
  backdrop.addEventListener('click', cerrarMenu)

  // ── callbacks ─────────────────────────────────────────────
  nav.querySelector('#navItemLogin')?.addEventListener('click', async () => {
    cerrarMenu()
    const res = await loginConGoogle()
    if (!res.ok) console.error(res.error)
    if (onLogin) onLogin()
  })

  nav.querySelector('#navItemLogout')?.addEventListener('click', async () => {
    cerrarMenu()
    await logout()
    if (onLogout) onLogout()
  })

  nav.querySelector('#navItemMisReservas')?.addEventListener('click', () => {
    cerrarMenu()
    if (onMisReservas) onMisReservas()
  })

  nav.querySelector('#navItemSupervisor')?.addEventListener('click', () => {
    cerrarMenu()
    if (onSupervisor) onSupervisor()
  })

  return nav
}