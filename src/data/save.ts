// ข้อมูลเซฟของผู้ใช้ (1–3 เซฟ) — เก็บใน IndexedDB แยกจากฐานข้อมูลเกม
// เนื้อหาตามสเปกข้อ 5: แอปจด "ความจุ" ไม่ใช่ log
import { createStore, get, set, del, keys } from 'idb-keyval'

export const SAVE_SCHEMA_VERSION = 1
export const MAX_SAVES = 3
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'
export type SprinklerKind = 'basic' | 'quality' | 'iridium' | 'iridium_pressure'

export interface Plot {
  id: string
  name: string                                   // ผู้ใช้ตั้งเองตอนเพิ่มแปลง
  location: 'farm' | 'ginger_island'
  sprinklers: { kind: SprinklerKind; count: number }[]
  split: { flower: number; once: number; regrow: number } // ส่วนที่เหลือ = ช่องว่าง
}

export interface Todo {
  id: string
  title: string
  status: 'open' | 'done'
  due?: { season: Season; day: number; year: number }   // ไม่มี = งานลอย
  template?: string
  createdAt: string
  doneAt?: string
}

export interface SaveData {
  schema_version: number
  id: string
  name: string
  date: { season: Season; day: number; year: number }
  plots: Plot[]
  machines: { keg: number; preserves_jar: number }
  greenhouse: { crop_id: 'ancient_fruit'; planted?: { season: Season; day: number; year: number }; plants: number } | null
  animal_housing: { coop: 0 | 1 | 2 | 3; barn: 0 | 1 | 2 | 3 }  // 0 = ยังไม่สร้าง, 1–3 = ขั้น
  buildings: string[]                              // building.id ที่สร้างแล้ว
  skills: { farming_level: number; professions: string[] }
  ginger_island: boolean
  todos: Todo[]
  last_backup_at: string | null
  created_at: string
  updated_at: string
}

const store = createStore('my-farm', 'saves')
const ACTIVE = '__active'

export function newSave(id: string, name: string, date: SaveData['date']): SaveData {
  const now = new Date().toISOString()
  return {
    schema_version: SAVE_SCHEMA_VERSION, id, name, date, plots: [], machines: { keg: 0, preserves_jar: 0 },
    greenhouse: null, animal_housing: { coop: 0, barn: 0 }, buildings: [],
    skills: { farming_level: 0, professions: [] }, ginger_island: false, todos: [],
    last_backup_at: null, created_at: now, updated_at: now,
  }
}

export async function listSaves(): Promise<SaveData[]> {
  const ks = (await keys(store)).filter((k) => k !== ACTIVE)
  const all = await Promise.all(ks.map((k) => get<SaveData>(k, store)))
  return all.filter((s): s is SaveData => !!s).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function putSave(s: SaveData) {
  await set(s.id, { ...s, updated_at: new Date().toISOString() }, store)
}

export async function deleteSave(id: string) {
  await del(id, store)
  if ((await get(ACTIVE, store)) === id) await del(ACTIVE, store)
}

export const getActiveId = () => get<string>(ACTIVE, store)
export const setActiveId = (id: string) => set(ACTIVE, id, store)
