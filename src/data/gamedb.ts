// ฐานข้อมูลเกม (อ่านอย่างเดียว) — stardew.sqlite ที่สร้างจาก ../stardew-db (npm run sync-db)
// service worker แคชทั้งไฟล์ .sqlite และ .wasm จึงเปิดได้ตอนออฟไลน์
import initSqlJs, { type Database, type SqlValue } from 'sql.js'

const BASE = import.meta.env.BASE_URL
let dbPromise: Promise<Database> | null = null

export function openGameDb(): Promise<Database> {
  dbPromise ??= (async () => {
    const SQL = await initSqlJs({ locateFile: () => `${BASE}data/sql-wasm.wasm` })
    const buf = await fetch(`${BASE}data/stardew.sqlite`).then((r) => {
      if (!r.ok) throw new Error(`โหลดฐานข้อมูลไม่ได้ (${r.status})`)
      return r.arrayBuffer()
    })
    return new SQL.Database(new Uint8Array(buf))
  })()
  return dbPromise
}

export async function query<T = Record<string, SqlValue>>(sql: string, params: SqlValue[] = []): Promise<T[]> {
  const db = await openGameDb()
  const st = db.prepare(sql)
  st.bind(params)
  const out: T[] = []
  while (st.step()) out.push(st.getAsObject() as T)
  st.free()
  return out
}

export type CropRow = {
  id: string; name_en: string; name_th: string | null; category: string | null
  sell_price: number | null; growth_days: number | null; regrow_days: number | null
  min_harvest: number; seasons: string | null; seed_id: string | null; seed_name: string | null
  pierre: number | null; joja: number | null; verified: number; source_url: string | null
}

export const cropsQuery = `
SELECT i.id, i.name_en, i.name_th, i.category, i.sell_price, c.growth_days, c.regrow_days, c.min_harvest,
  (SELECT group_concat(season, ',') FROM crop_season WHERE crop_id = c.item_id) AS seasons,
  c.seed_item_id AS seed_id, s.name_en AS seed_name,
  (SELECT price FROM shop_price WHERE item_id = c.seed_item_id AND shop = 'Pierre''s General Store') AS pierre,
  (SELECT price FROM shop_price WHERE item_id = c.seed_item_id AND shop = 'JojaMart') AS joja,
  (SELECT min(verified) FROM entity_source WHERE entity_type = 'crop' AND entity_id = c.item_id) AS verified,
  (SELECT url FROM entity_source WHERE entity_type = 'crop' AND entity_id = c.item_id LIMIT 1) AS source_url
FROM crop c JOIN item i ON i.id = c.item_id LEFT JOIN item s ON s.id = c.seed_item_id
ORDER BY i.name_en`

export async function meta(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM meta')
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}
