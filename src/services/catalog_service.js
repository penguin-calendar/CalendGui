import { collection, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase.js'

export async function obtenerChallenges() {
  const snap = await getDocs(collection(db, 'challenges'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

let _spots = []

export async function obtenerSpots() {
  if (_spots.length) return _spots
  const snap = await getDocs(collection(db, 'spots'))
  _spots = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return _spots
}

export function nombreSpot(id) {
  return _spots.find(s => s.id === id)?.nombre ?? id
}