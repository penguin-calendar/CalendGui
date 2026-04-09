import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase.js'

const provider = new GoogleAuthProvider()

export async function loginConGoogle() {
  try {
    const resultado = await signInWithPopup(auth, provider)
    return { ok: true, firebaseUser: resultado.user }
  } catch (error) {
    console.error('Error login:', error)
    return { ok: false, error: error.message }
  }
}

export async function logout() {
  try {
    await signOut(auth)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}