import './styles/main.css'
import { onAuthChange }     from './services/auth_service.js'
import { getOCrearUsuario } from './services/users_service.js'
import { enrutar }          from './router.js'

export const estado = { usuario: null }

const app = document.getElementById('app')

onAuthChange(async (firebaseUser) => {
  estado.usuario = firebaseUser
    ? await getOCrearUsuario(firebaseUser)
    : null

  enrutar(app, estado)
})