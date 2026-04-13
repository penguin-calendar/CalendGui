import { crearNav }     from '../components/comp_nav.js'
import { enrutar }      from '../router.js'

export function cargarVista(app, estado) {
  app.innerHTML = ''

  const page = document.createElement('div')
  page.className = 'page'

  const nav = crearNav(estado.usuario, {
    onLogin:  () => enrutar(app, estado),
    onLogout: () => enrutar(app, estado),
  })

  const contenido = document.createElement('div')
  contenido.className = 'page-content'

  montarBienvenida(contenido)

  page.appendChild(nav)
  page.appendChild(contenido)
  app.appendChild(page)
}

function montarBienvenida(contenedor) {
  contenedor.innerHTML = `
    <div class="bienvenida">
      <h1 class="bienvenida-titulo">Reservá tu turno</h1>
      <p class="bienvenida-texto">Iniciá sesión para ver tus reservas o explorá los turnos disponibles.</p>
    </div>
  `
}