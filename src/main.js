import './styles/main.css'
import { onAuthChange }     from './services/auth_service.js'
import { getOCrearUsuario } from './services/users_service.js'
import { cargarVista }      from './views/view_home.js'

// ── estado global de la app ────────────────────────────────
export const estado = {
  usuario: null   // null = no logueado, objeto = usuario logueado
}

// ── punto de entrada ───────────────────────────────────────
const app = document.getElementById('app')

// detecta cambios de sesión en tiempo real (una sola vez)
onAuthChange(async (firebaseUser) => {
  if (firebaseUser) {
    estado.usuario = await getOCrearUsuario(firebaseUser)
  } else {
    estado.usuario = null
  }

  cargarVista(app, estado)
})