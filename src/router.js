import { cargarVista as cargarHome }       from './views/view_home.js'
import { cargarVista as cargarSupervisor } from './views/view_supervisor.js'

export function enrutar(app, estado) {
  const rol = estado.usuario?.rol
  if (rol === 1 || rol === 2) {
    cargarSupervisor(app, estado)
  } else {
    cargarHome(app, estado)
  }
}