import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, deleteField,} from 'firebase/firestore'
import { db } from '../config/firebase.js'

const SLOTS = 'slots'

// ── Helpers ────────────────────────────────────────────────

function slotDesdeDoc(snap) {
  return { id: snap.id, ...snap.data() }
}

// ── Queries ────────────────────────────────────────────────

export async function obtenerSlotsPorMes(anho, mes) {
  const desde = `${anho}-${String(mes).padStart(2, '0')}-01`
  const hasta = `${anho}-${String(mes).padStart(2, '0')}-31`

  const q = query(
    collection(db, SLOTS),
    where('fecha', '>=', desde),
    where('fecha', '<=', hasta),
    orderBy('fecha'),
    orderBy('hora')
  )

  const snap = await getDocs(q)
  return snap.docs.map(slotDesdeDoc)
}

export async function obtenerMisSlotsPorMes(uid, anho, mes) {
  const desde = `${anho}-${String(mes).padStart(2, '0')}-01`
  const hasta = `${anho}-${String(mes).padStart(2, '0')}-31`

  const q = query(
    collection(db, SLOTS),
    where('id_supervisor', '==', uid),
    where('fecha', '>=', desde),
    where('fecha', '<=', hasta),
    orderBy('fecha'),
    orderBy('hora')
  )

  const snap = await getDocs(q)
  return snap.docs.map(slotDesdeDoc)
}

export async function obtenerSlotPorId(idSlot) {
  const snap = await getDoc(doc(db, SLOTS, idSlot))
  if (!snap.exists()) return null
  return slotDesdeDoc(snap)
}

// ── Crear slot individual ──────────────────────────────────

export async function crearSlot(uid, datos) {
  const { fecha, hora, id_spot } = datos

  if (!fecha || !hora || !id_spot)
    return { ok: false, error: 'Datos incompletos' }

  const q = query(
    collection(db, SLOTS),
    where('fecha',   '==', fecha),
    where('hora',    '==', hora),
    where('id_spot', '==', id_spot)
  )
  const existe = await getDocs(q)
  if (!existe.empty)
    return { ok: false, error: 'Ya existe un slot en esa fecha, hora y spot' }

  await addDoc(collection(db, SLOTS), {
    id_supervisor:   uid,
    fecha, hora, id_spot,
    estado:          false,
    evaluado_mail:   null,
    evaluado_nombre: null,
    batch:           null,
    evento_id:       null,
  })

  return { ok: true }
}

// ── Eliminar slot individual ──────────────────────────────────

export async function eliminarSlot(idSlot) {
  const slotRef = doc(db, SLOTS, idSlot)
  const snap    = await getDoc(slotRef)
  const slotData = slotDesdeDoc(snap)
  await deleteDoc(slotRef)
  return { ok: true, slotEliminado: slotData }
}