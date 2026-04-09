import { collection, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase.js'

export async function obtenerChallenges() {
  const snap = await getDocs(collection(db, 'challenges'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

let _estaciones = []

export async function obtenerEstaciones() {
  if (_estaciones.length) return _estaciones  // cache simple
  const snap = await getDocs(collection(db, 'estaciones'))
  _estaciones = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return _estaciones
}

export function nombreEstacion(id) {
  return _estaciones.find(e => e.id === id)?.nombre ?? id
}