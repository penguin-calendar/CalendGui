import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

// ── Configuración ──────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID
}

const app      = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)

const provider = new GoogleAuthProvider()

// ── Login con Google ───────────────────────────────────────
export async function loginConGoogle() {
  try {
    const resultado = await signInWithPopup(auth, provider)
    const usuario   = resultado.user

    // buscar si ya existe en Firestore
    const ref  = doc(db, 'usuarios', usuario.uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      // primer login → crear con rol participante
      await setDoc(ref, {
        email:  usuario.email,
        nombre: usuario.displayName,
        foto:   usuario.photoURL,
        rol:    'participante'
      })
    }

    return { ok: true }

  } catch (error) {
    console.error('Error login:', error)
    return { ok: false, error: error.message }
  }
}

// ── Logout ─────────────────────────────────────────────────
export async function logout() {
  try {
    await signOut(auth)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

// ── Obtener datos del usuario actual ───────────────────────
export async function getUsuarioActual(uid) {
  try {
    const snap = await getDoc(doc(db, 'usuarios', uid))
    if (!snap.exists()) return null
    return { uid, ...snap.data() }
  } catch (error) {
    return null
  }
}

// ── Observer: detecta cambios de sesión ───────────────────
// uso: onAuthChange(usuario => { si usuario es null → no logueado })
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}