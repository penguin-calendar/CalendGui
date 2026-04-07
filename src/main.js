import './styles/main.css'
import { onAuthChange, getUsuarioActual } from './config/firebase.js'
import { cargarVista } from './views/vista_participante.js'

// ── estado global de la app ────────────────────────────────
export const estado = {
  usuario: null   // null = no logueado, objeto = usuario logueado
}

// ── punto de entrada ───────────────────────────────────────
const app = document.getElementById('app')

// detecta cambios de sesión en tiempo real
onAuthChange(async (firebaseUser) => {

  if (firebaseUser) {
    // hay sesión activa → traer datos del usuario desde Firestore
    const userData = await getUsuarioActual(firebaseUser.uid)
    estado.usuario = userData
  } else {
    // no hay sesión
    estado.usuario = null
  }

  // siempre carga la vista participante como base
  cargarVista(app, estado)
})