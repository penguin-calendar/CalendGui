import '../styles/vista_participante.css'
import { crearNav } from '../components/nav.js'

// ── Vista Participante ─────────────────────────────────────
export function cargarVista(app, estado) {

  // limpiar el contenido anterior
  app.innerHTML = ''

  const page = document.createElement('div')
  page.className = 'page'

  // ── nav ───────────────────────────────────────────────────
  const nav = crearNav(estado.usuario, {
    onLogin:    () => recargar(),
    onLogout:   () => recargar(),
    onSupervisor: () => {
      // próximamente: cargar vista supervisor
      console.log('ir a supervisor')
    },
    onMisReservas: () => {
      // próximamente: abrir mis reservas
      console.log('mis reservas')
    }
  })

  // ── contenido ─────────────────────────────────────────────
  const contenido = document.createElement('div')
  contenido.className = 'page-content'
  contenido.innerHTML = renderContenido(estado.usuario)

  page.appendChild(nav)
  page.appendChild(contenido)
  app.appendChild(page)

  // ── helpers ───────────────────────────────────────────────
  function recargar() {
    cargarVista(app, estado)
  }
}

// ── Contenido según estado del usuario ────────────────────
function renderContenido(usuario) {

  if (!usuario) {
    return `
      <div class="bienvenida">
        <h1 class="bienvenida-titulo">Reservá tu turno</h1>
        <p class="bienvenida-texto">
          Iniciá sesión para ver tus reservas o continúa como invitado para explorar los turnos disponibles.
        </p>
      </div>
    `
  }

  const mensajes = {
    participante: {
      titulo: `¡Hola, ${usuario.nombre.split(' ')[0]}!`,
      texto:  'Sos participante. Próximamente vas a poder ver tus reservas acá.',
      badge:  'Participante'
    },
    supervisor: {
      titulo: `¡Hola, ${usuario.nombre.split(' ')[0]}!`,
      texto:  'Sos supervisor. Podés ir a la vista supervisor desde el menú.',
      badge:  'Supervisor'
    },
    admin: {
      titulo: `¡Hola, ${usuario.nombre.split(' ')[0]}!`,
      texto:  'Sos admin. Tenés acceso completo.',
      badge:  'Admin'
    }
  }

  const info = mensajes[usuario.rol] || {
    titulo: 'Acceso pendiente',
    texto:  'Tu cuenta está siendo revisada. Contactá a un administrador.',
    badge:  'Sin rol'
  }

  return `
    <div class="bienvenida">
      <span class="bienvenida-badge bienvenida-badge--${usuario.rol || 'none'}">${info.badge}</span>
      <h1 class="bienvenida-titulo">${info.titulo}</h1>
      <p class="bienvenida-texto">${info.texto}</p>
    </div>
  `
}