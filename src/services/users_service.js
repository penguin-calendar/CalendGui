import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'

export async function getOCrearUsuario(firebaseUser) {
  try {
    const ref  = doc(db, 'registro_usuarios', firebaseUser.uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      const nuevoUsuario = {
        email:  firebaseUser.email,
        nombre: firebaseUser.displayName,
        foto:   firebaseUser.photoURL,
        rol:    0
      }
      await setDoc(ref, nuevoUsuario)
      return { uid: firebaseUser.uid, ...nuevoUsuario }
    }

    return { uid: firebaseUser.uid, ...snap.data() }

  } catch (error) {
    console.error('Error usuario:', error)
    return null
  }
}