// ค่าจากฐานข้อมูลเกมที่หน้า My Farm ใช้ (ไม่มีตัวเลขเขียนตายในโค้ด)
import { useEffect, useState } from 'preact/hooks'
import { query } from './gamedb'
import type { GameDate, Season, SprinklerKind } from './save'

export type Building = {
  id: string; builder: string; name_en: string; name_th: string | null; cost_gold: number | null
  materials: { name_en: string; qty: number }[]
}
export type FarmData = {
  c: Record<string, number>                      // game_constant
  img: Record<string, string>                     // item id -> ไฟล์รูปใน public/img
  buildings: Building[]
  keg: { name_en: string; qty: number }[]         // วัตถุดิบสร้าง Keg 1 ตัว
  ancient: { name_en: string; name_th: string | null; growth_days: number; regrow_days: number | null; min_harvest: number; sell_price: number | null; seasons: number } | null
  wine: { time_minutes: number | null; price_formula: string | null; input_qty: number; output_name: string } | null
}

const IMG_ITEMS = ['sprinkler', 'quality_sprinkler', 'iridium_sprinkler', 'pressure_nozzle', 'keg', 'preserves_jar', 'ancient_fruit', 'ancient_seeds']

let cache: Promise<FarmData> | null = null
async function load(): Promise<FarmData> {
  const [consts, imgs, bs, mats, keg, anc, wine] = await Promise.all([
    query<{ key: string; value: number }>('SELECT key, value FROM game_constant'),
    query<{ id: string; f: string }>(`SELECT i.id, im.file_path AS f FROM item i JOIN image im ON im.id = i.image_id AND im.status = 'downloaded' WHERE i.id IN (${IMG_ITEMS.map(() => '?').join(',')})`, IMG_ITEMS),
    query<Omit<Building, 'materials'>>(`SELECT id, builder, name_en, name_th, cost_gold FROM building
      WHERE id NOT IN ('coop','big_coop','deluxe_coop','barn','big_barn','deluxe_barn') ORDER BY builder = 'Robin' DESC, builder, rowid`),
    query<{ building_id: string; name_en: string; qty: number }>('SELECT bm.building_id, i.name_en, bm.qty FROM building_material bm JOIN item i ON i.id = bm.item_id ORDER BY bm.rowid'),
    query<{ name_en: string; qty: number }>(`SELECT i.name_en, ri.qty FROM recipe_ingredient ri JOIN item i ON i.id = ri.item_id WHERE ri.recipe_id = 'keg' ORDER BY ri.rowid`),
    query<NonNullable<FarmData['ancient']>>(`SELECT i.name_en, i.name_th, c.growth_days, c.regrow_days, c.min_harvest, i.sell_price,
      (SELECT count(*) FROM crop_season WHERE crop_id = c.item_id) AS seasons FROM crop c JOIN item i ON i.id = c.item_id WHERE c.item_id = 'ancient_fruit'`),
    query<NonNullable<FarmData['wine']>>(`SELECT r.time_minutes, r.price_formula, r.input_qty, o.name_en AS output_name FROM processing_rule r JOIN item o ON o.id = r.output_item_id
      WHERE r.machine_id = 'keg' AND r.input_category = 'Fruit' LIMIT 1`),
  ])
  return {
    c: Object.fromEntries(consts.map((r) => [r.key, r.value])),
    img: Object.fromEntries(imgs.map((r) => [r.id, r.f.split('/').pop()!])),
    buildings: bs.map((b) => ({ ...b, materials: mats.filter((m) => m.building_id === b.id) })),
    keg, ancient: anc[0] ?? null, wine: wine[0] ?? null,
  }
}

/** null = กำลังโหลด · Error = เปิดฐานข้อมูลไม่ได้ */
export function useFarmData(): FarmData | Error | null {
  const [d, setD] = useState<FarmData | Error | null>(null)
  useEffect(() => { (cache ??= load()).then(setD, (e) => { cache = null; setD(e instanceof Error ? e : new Error(String(e))) }) }, [])
  return d
}

/* ---------- คำนวณ ---------- */
export const SPRINKLER_ITEM: Record<Exclude<SprinklerKind, 'custom'>, { item: string; name: string; short: string }> = {
  basic: { item: 'sprinkler', name: 'Sprinkler', short: 'Basic' },
  quality: { item: 'quality_sprinkler', name: 'Quality Sprinkler', short: 'Quality' },
  iridium: { item: 'iridium_sprinkler', name: 'Iridium Sprinkler', short: 'Iridium' },
}
/** ช่องที่สปริงเกลอร์ 1 ตัวรดได้ จาก game_constant (null = ฐานข้อมูลไม่มีค่า) */
export function reach(d: FarmData, kind: SprinklerKind, nozzle: boolean): number | null {
  if (kind === 'custom') return null
  const k = `${SPRINKLER_ITEM[kind].item}${nozzle ? '_nozzle' : ''}_tiles`
  return d.c[k] ?? null
}

export const HOUSE_KEYS = { coop: ['coop', 'big_coop', 'deluxe_coop'], barn: ['barn', 'big_barn', 'deluxe_barn'] } as const
export const HOUSE_NAMES = { coop: ['Coop', 'Big Coop', 'Deluxe Coop'], barn: ['Barn', 'Big Barn', 'Deluxe Barn'] } as const
export const capacity = (d: FarmData, kind: 'coop' | 'barn', level: number): number | null => d.c[`${HOUSE_KEYS[kind][level - 1]}_capacity`] ?? null

/** ราคาจากสูตรในฐานข้อมูล เช่น "price*3" หรือ "price*2+50" */
export function applyFormula(formula: string | null, price: number | null): number | null {
  const m = formula?.replace(/\s/g, '').match(/^price\*([\d.]+)(?:\+([\d.]+))?$/)
  if (!m || price == null) return null
  return Math.floor(price * +m[1] + (m[2] ? +m[2] : 0))
}

/* ---------- วันในเกม: 4 ฤดู × 28 วัน ---------- */
export const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter']
const DAYS = 28
export const dayIndex = (d: GameDate) => (d.year - 1) * 4 * DAYS + SEASONS.indexOf(d.season) * DAYS + (d.day - 1)
export const fromIndex = (i: number): GameDate => ({ year: Math.floor(i / (4 * DAYS)) + 1, season: SEASONS[Math.floor(i / DAYS) % 4], day: (i % DAYS) + 1 })
export const fmtDate = (d: GameDate) => `${d.season} ${d.day}`

/** วันเก็บเกี่ยวถัดไปของเรือนกระจก นับจากวันปลูก (โต growth วัน แล้วเก็บซ้ำทุก regrow วัน) */
export function harvests(planted: GameDate, today: GameDate, growth: number, regrow: number | null, n = 4): number[] {
  const first = dayIndex(planted) + growth
  const t = dayIndex(today)
  if (first >= t || !regrow) return first >= t ? (regrow ? Array.from({ length: n }, (_, i) => first + i * regrow) : [first]) : []
  const next = first + Math.ceil((t - first) / regrow) * regrow
  return Array.from({ length: n }, (_, i) => next + i * regrow)
}
