// เซฟที่ใช้อยู่ (เซฟเดียวต่อครั้ง) — ทุกหน้าอ่าน/เขียนผ่านที่นี่ แล้วบันทึกลง IndexedDB ทันที
import { useEffect, useState } from 'preact/hooks'
import { getActiveId, listSaves, newSave, putSave, setActiveId, type SaveData } from './save'

let current: SaveData | null = null
const subs = new Set<(s: SaveData) => void>()
let loading: Promise<SaveData> | null = null

async function load(): Promise<SaveData> {
  const all = await listSaves()
  const id = await getActiveId()
  let s = all.find((x) => x.id === id) ?? all[0]
  if (!s) {                       // ยังไม่มีเซฟเลย: สร้าง "เซฟ 1" เริ่มที่ Spring 1 ปี 1 (แก้วันที่ได้ที่หน้าวันนี้)
    s = newSave(crypto.randomUUID(), 'เซฟ 1', { season: 'Spring', day: 1, year: 1 })
    await putSave(s)
  }
  if (s.id !== id) await setActiveId(s.id)
  current = s
  return s
}

export function updateSave(fn: (s: SaveData) => SaveData) {
  if (!current) return
  current = fn(current)
  subs.forEach((f) => f(current!))
  putSave(current)
}

export function useSave(): SaveData | null {
  const [s, setS] = useState(current)
  useEffect(() => {
    subs.add(setS)
    if (!current) (loading ??= load()).then(setS)
    return () => { subs.delete(setS) }
  }, [])
  return s
}
