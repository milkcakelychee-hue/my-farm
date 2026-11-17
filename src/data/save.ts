// ข้อมูลเซฟของผู้ใช้ (1–3 เซฟ) — เก็บใน IndexedDB แยกจากฐานข้อมูลเกม
// เนื้อหาตามสเปกข้อ 5: แอปจด "ความจุ" ไม่ใช่ log
import { createStore, get, set, del, keys } from 'idb-keyval'

export const SAVE_SCHEMA_VERSION = 3
export const MAX_SAVES = 3
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'
export type SprinklerKind = 'basic' | 'quality' | 'iridium' | 'custom'
export type SkillName = 'Farming' | 'Fishing' | 'Foraging' | 'Mining'
export type GameDate = { season: Season; day: number; year: number }
export type HouseLevel = 1 | 2 | 3                // 1 = Coop/Barn, 2 = Big, 3 = Deluxe

export interface Plot {
  id: string
  name: string                                   // ผู้ใช้ตั้งเองตอนเพิ่มแปลง
  location: 'farm' | 'ginger_island'
  sprinkler: { kind: SprinklerKind; count: number; nozzle: boolean }
  tiles: number                                  // ช่องปลูกได้จริง (เริ่มจากจำนวน × ช่องที่รดได้ แก้เองได้)
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
  date: GameDate
  plots: Plot[]
  machines: { keg: number; preserves_jar: number }
  greenhouse: { crop_id: 'ancient_fruit'; planted: GameDate | null; plants: number }
  animal_housing: { coop: HouseLevel[]; barn: HouseLevel[] }  // หนึ่งตัวเลขต่อหนึ่งหลัง = ขั้นของหลังนั้น
  buildings: Record<string, number>                // building.id -> จำนวนที่สร้างแล้ว (ไม่รวม Coop/Barn)
  skills: { levels: Record<SkillName, number>; professions: string[] }   // professions = profession.id ที่เลือก
  calc?: { fertilizer?: string }                  // ปุ๋ยที่ใช้คำนวณ (item id)
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
    greenhouse: { crop_id: 'ancient_fruit', planted: null, plants: 0 }, animal_housing: { coop: [], barn: [] }, buildings: {},
    skills: { levels: { Farming: 0, Fishing: 0, Foraging: 0, Mining: 0 }, professions: [] }, ginger_island: false, todos: [],
    last_backup_at: null, created_at: now, updated_at: now,
  }
}

export async function listSaves(): Promise<SaveData[]> {
  const ks = (await keys(store)).filter((k) => k !== ACTIVE)
  const all = await Promise.all(ks.map((k) => get<SaveData>(k, store)))
  return all.filter((s): s is SaveData => !!s).map((s) => (s.schema_version < SAVE_SCHEMA_VERSION ? migrateSave(s, s.schema_version) : s)).sort((a, b) => a.created_at.localeCompare(b.created_at))
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

/** ย้ายเซฟเวอร์ชันเก่าขึ้นเวอร์ชันปัจจุบัน — ใช้ทั้งตอนเปิดแอปและตอนกู้ไฟล์สำรอง */
export function migrateSave(s: any, from: number): SaveData {
  if (from > SAVE_SCHEMA_VERSION) throw new Error('ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า อัปเดตแอปก่อนแล้วลองอีกครั้ง')
  let o = { ...s }
  if (from < 2) {
    const lv = (n: number) => (n > 0 ? [n] : []) as HouseLevel[]
    o = {
      ...o,
      plots: (o.plots ?? []).map((p: any) => {
        const sp = p.sprinklers?.[0] ?? { kind: 'quality', count: 0 }
        const kind = sp.kind === 'iridium_pressure' ? 'iridium' : sp.kind
        const split = p.split ?? { flower: 0, once: 0, regrow: 0 }
        return { id: p.id, name: p.name, location: p.location, sprinkler: { kind, count: sp.count, nozzle: sp.kind === 'iridium_pressure' },
          tiles: split.flower + split.once + split.regrow, split }
      }),
      greenhouse: o.greenhouse ? { crop_id: 'ancient_fruit', planted: o.greenhouse.planted ?? null, plants: o.greenhouse.plants ?? 0 } : { crop_id: 'ancient_fruit', planted: null, plants: 0 },
      animal_housing: { coop: lv(o.animal_housing?.coop ?? 0), barn: lv(o.animal_housing?.barn ?? 0) },
      buildings: Array.isArray(o.buildings) ? Object.fromEntries(o.buildings.map((b: string) => [b, 1])) : (o.buildings ?? {}),
    }
  }
  if (from < 3) {
    const lv = o.skills?.farming_level ?? 0
    o = { ...o, skills: { levels: { Farming: lv, Fishing: 0, Foraging: 0, Mining: 0 }, professions: o.skills?.professions ?? [] } }
  }
  return { ...o, schema_version: SAVE_SCHEMA_VERSION }
}
