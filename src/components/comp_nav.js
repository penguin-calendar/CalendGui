import '../styles/comp_nav.css'
import { loginConGoogle, logout } from '../services/auth_service.js'
import { getOCrearUsuario }       from '../services/users_service.js'
import { mostrarToast } from './comp_toast.js'

// ── Nav ────────────────────────────────────────────────────
// uso: crearNav(usuario, { onLogin, onLogout, onMisReservas, onSupervisor })
export function crearNav(usuario, callbacks = {}) {

  const { onLogin, onLogout, onMisReservas, onSupervisor } = callbacks

  const nav = document.createElement('nav')
  nav.className = 'nav'
  nav.innerHTML = `
    <div class="nav-brand">
      <img
        src="https://lh3.googleusercontent.com/d/1ZFVOuBX8oWOlM53Q4AzTXH60wvwoWUHU"
        alt="CalendGüi"
        class="nav-logo"
      />
    </div>

    <div class="nav-right">
      ${usuario ? `
        <img
          src="${usuario.foto}"
          alt="${usuario.nombre}"
          class="nav-avatar"
          referrerpolicy="no-referrer"
        />
      ` : ''}
      <button class="nav-menu-btn" id="navMenuBtn">☰</button>
    </div>

    <!-- drawer -->
    <div class="nav-menu" id="navMenu">

      <div class="nav-menu-header">
        <span class="nav-menu-titulo">Menú</span>
        <button class="nav-menu-close" id="navMenuClose">✕</button>
      </div>

      ${usuario ? `
        <div class="nav-menu-user">
          <img
            src="${usuario.foto}"
            alt="${usuario.nombre}"
            class="nav-menu-avatar"
            referrerpolicy="no-referrer"
          />
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

      ${!usuario ? `
        <button class="nav-menu-item" id="navItemLogin">
          Iniciar sesión con Google
        </button>
      ` : `
        <hr class="nav-menu-divider" />
        <button class="nav-menu-item nav-menu-item-danger" id="navItemLogout">
          Cerrar sesión
        </button>
      `}

    </div>

    <!-- backdrop -->
    <div class="nav-backdrop" id="navBackdrop"></div>
  `

  // ── abrir / cerrar ────────────────────────────────────────
  const menu     = nav.querySelector('#navMenu')
  const backdrop = nav.querySelector('#navBackdrop')

  function abrirMenu()  { menu.classList.add('open');    backdrop.classList.add('open')    }
  function cerrarMenu() { menu.classList.remove('open'); backdrop.classList.remove('open') }

  nav.querySelector('#navMenuBtn').addEventListener('click', abrirMenu)
  nav.querySelector('#navMenuClose').addEventListener('click', cerrarMenu)
  backdrop.addEventListener('click', cerrarMenu)

  // ── login ─────────────────────────────────────────────────
  nav.querySelector('#navItemLogin')?.addEventListener('click', async () => {
    cerrarMenu()
    const res = await loginConGoogle()
    if (res.ok) {
      await getOCrearUsuario(res.firebaseUser)  // asegura que exista en Firestore
      if (onLogin) onLogin()
    } else {
      mostrarToast('Error al iniciar sesión', 'error')
    }
  })

  // ── logout ────────────────────────────────────────────────
  nav.querySelector('#navItemLogout')?.addEventListener('click', async () => {
    cerrarMenu()
    const res = await logout()
    if (res.ok) {
      if (onLogout) onLogout()
    } else {
      mostrarToast('Error al cerrar sesión', 'error')
    }
  })

  // ── mis reservas ──────────────────────────────────────────
  nav.querySelector('#navItemMisReservas')?.addEventListener('click', () => {
    cerrarMenu()
    if (onMisReservas) onMisReservas()
  })

  // ── vista supervisor ──────────────────────────────────────
  nav.querySelector('#navItemSupervisor')?.addEventListener('click', () => {
    cerrarMenu()
    if (onSupervisor) onSupervisor()
  })

  return nav
}