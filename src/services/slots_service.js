import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, deleteField,} from 'firebase/firestore'
import { db } from '../config/firebase.js'

const SLOTS = 'slots'

// ── Helpers ────────────────────────────────────────────────

function slotDesdeDoc(snap) {
  return { id: snap.id, ...snap.data() }
}

// Genera todos los slots de un rango aplicando bloqueos de config
function generarSlots(uid, datos, config) {
  const { fechaDesde, fechaHasta, horaDesde, horaHasta, id_estacion } = datos

  const diasBloqueados   = config?.dias_bloqueados   ?? []
  const horasBloqueadas  = config?.horas_bloqueadas  ?? []
  const fechasBloqueadas = config?.fechas_bloqueadas ?? []

  const slots = []
  const fechaActual = new Date(`${fechaDesde}T00:00:00`)
  const fechaFin    = new Date(`${fechaHasta}T00:00:00`)

  while (fechaActual <= fechaFin) {
    const diaSemana = String(fechaActual.getDay())

    if (!diasBloqueados.includes(diaSemana)) {
      const anho    = fechaActual.getFullYear()
      const mes     = String(fechaActual.getMonth() + 1).padStart(2, '0')
      const dia     = String(fechaActual.getDate()).padStart(2, '0')
      const fechaStr = `${anho}-${mes}-${dia}`

      if (!fechasBloqueadas.includes(fechaStr)) {
        for (let h = parseInt(horaDesde); h <= parseInt(horaHasta); h++) {
          const horaStr = String(h).padStart(2, '0') + ':00'
          if (!horasBloqueadas.includes(horaStr)) {
            slots.push({ fecha: fechaStr, hora: horaStr, id_estacion })
          }
        }
      }
    }

    fechaActual.setDate(fechaActual.getDate() + 1)
  }

  return slots
}

// ── Queries ────────────────────────────────────────────────

// Slots de un mes (para participante y dashboard — lectura pública)
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

// Slots de un supervisor en un mes
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

// Un slot por id
export async function obtenerSlotPorId(idSlot) {
  const snap = await getDoc(doc(db, SLOTS, idSlot))
  if (!snap.exists()) return null
  return slotDesdeDoc(snap)
}

// ── Crear slot individual ──────────────────────────────────

export async function crearSlot(uid, datos) {
  const { fecha, hora, id_estacion } = datos

  if (!fecha || !hora || !id_estacion) {
    return { ok: false, error: 'Datos incompletos' }
  }

  // Verificar duplicado
  const q = query(
    collection(db, SLOTS),
    where('fecha',       '==', fecha),
    where('hora',        '==', hora),
    where('id_estacion', '==', id_estacion)
  )
  const existe = await getDocs(q)
  if (!existe.empty) {
    return { ok: false, error: 'Ya existe un slot en esa fecha, hora y estación' }
  }

  await addDoc(collection(db, SLOTS), {
    id_supervisor:   uid,
    fecha,
    hora,
    id_estacion,
    estado:          false,
    evaluado_mail:   null,
    evaluado_nombre: null,
    batch:           null,
    challenge:       null,
    evento_id:       null,
  })

  return { ok: true }
}

// ── Crear slots por rango ──────────────────────────────────

export async function crearSlotRango(uid, datos, config = null) {
  const { fechaDesde, fechaHasta, horaDesde, horaHasta, id_estacion } = datos

  if (!fechaDesde || !fechaHasta || !horaDesde || !horaHasta || !id_estacion) {
    return { ok: false, error: 'Datos incompletos' }
  }
  if (fechaHasta < fechaDesde) {
    return { ok: false, error: 'La fecha fin no puede ser anterior a la de inicio' }
  }
  if (parseInt(horaHasta) < parseInt(horaDesde)) {
    return { ok: false, error: 'La hora fin no puede ser anterior a la hora inicio' }
  }

  const candidatos = generarSlots(uid, datos, config)
  if (!candidatos.length) {
    return { ok: false, error: 'No se generaron slots con esos parámetros' }
  }

  // Traer slots existentes del rango para filtrar duplicados
  const existentes = await obtenerSlotsPorMes(
    new Date(fechaDesde).getFullYear(),
    new Date(fechaDesde).getMonth() + 1
  )

  const clavesExistentes = new Set(
    existentes.map(s => `${s.fecha}_${s.hora}_${s.id_estacion}`)
  )

  const nuevos   = []
  let   omitidos = 0

  for (const slot of candidatos) {
    const clave = `${slot.fecha}_${slot.hora}_${slot.id_estacion}`
    if (clavesExistentes.has(clave)) {
      omitidos++
    } else {
      clavesExistentes.add(clave) // evita duplicados dentro del mismo lote
      nuevos.push(slot)
    }
  }

  // Escribir en lotes de 20 (sin necesitar writeBatch importado aparte)
  const LOTE = 20
  for (let i = 0; i < nuevos.length; i += LOTE) {
    const lote = nuevos.slice(i, i + LOTE)
    await Promise.all(
      lote.map(slot =>
        addDoc(collection(db, SLOTS), {
          id_supervisor:   uid,
          fecha:           slot.fecha,
          hora:            slot.hora,
          id_estacion:     slot.id_estacion,
          estado:          false,
          evaluado_mail:   null,
          evaluado_nombre: null,
          batch:           null,
          challenge:       null,
          evento_id:       null,
        })
      )
    )
  }

  return { ok: true, creados: nuevos.length, omitidos }
}

// ── Editar slot ────────────────────────────────────────────

export async function editarSlot(idSlot, datos) {
  const { fecha, hora, id_estacion } = datos

  const q = query(
    collection(db, SLOTS),
    where('fecha',       '==', fecha),
    where('hora',        '==', hora),
    where('id_estacion', '==', id_estacion)
  )
  const existe = await getDocs(q)
  const conflicto = existe.docs.find(d => d.id !== idSlot)
  if (conflicto) return { ok: false, error: 'Ya existe un slot en esa fecha, hora y estación' }

  await updateDoc(doc(db, SLOTS, idSlot), { fecha, hora, id_estacion })
  return { ok: true }
}

// ── Eliminar slot ──────────────────────────────────────────

// motivo: string opcional — se usa externamente para notificar al evaluado
export async function eliminarSlot(idSlot) {
  const slotRef = doc(db, SLOTS, idSlot)
  const snap    = await getDoc(slotRef)
  const slotData = slotDesdeDoc(snap)
  await deleteDoc(slotRef)
  return { ok: true, slotEliminado: slotData }
}

// ── Reservar slot (participante) ───────────────────────────

export async function reservarSlot(datos) {
  const { id_slot, evaluado_mail, evaluado_nombre, challenge } = datos

  if (!id_slot || !evaluado_mail || !evaluado_nombre || !challenge) {
    return { ok: false, error: 'Datos incompletos' }
  }

  const slotRef = doc(db, SLOTS, id_slot)
  const snap    = await getDoc(slotRef)

  if (!snap.exists())          return { ok: false, error: 'Slot no encontrado' }
  if (snap.data().estado)      return { ok: false, error: 'Este slot ya fue reservado' }

  await updateDoc(slotRef, {
    estado:          true,
    evaluado_mail,
    evaluado_nombre,
    challenge,
  })

  return { ok: true, slot: slotDesdeDoc(snap) }
}


export async function liberarSlot(idSlot) {
  const slotRef = doc(db, SLOTS, idSlot)

  await updateDoc(slotRef, {
    estado:          false,
    evaluado_mail:   deleteField(),
    evaluado_nombre: deleteField(),
    challenge:       deleteField(),
    batch:           deleteField(),
  })

  return { ok: true }
}