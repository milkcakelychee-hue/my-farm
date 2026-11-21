// ข้อมูลของแท็บ Wiki — อ่านจากฐานข้อมูลเกมตามต้องการ (ทีละหน้า)
import { query } from './gamedb'
import type { Season } from './save'

const IMG = (col: string) => `(SELECT file_path FROM image WHERE id = ${col} AND status = 'downloaded')`
export const file = (p: string | null | undefined) => (p ? p.split('/').pop()! : undefined)
const cols = async (t: string) => new Set((await query<{ name: string }>(`SELECT name FROM pragma_table_info('${t}')`)).map((r) => r.name))
const hasTable = async (t: string) => (await query<{ n: number }>(`SELECT count(*) n FROM sqlite_master WHERE name = ?`, [t]))[0].n > 0

export type Row = { kind: 'item' | 'npc' | 'building'; id: string; name_en: string; name_th: string | null; category: string | null; img: string | null; sub?: string }

/** ค้นหาทั้งไอเท็ม NPC และอาคาร (ชื่ออังกฤษหรือไทย) */
export async function search(q: string): Promise<Row[]> {
  const like = `%${q.trim()}%`
  if (!q.trim()) return []
  const [items, npcs, bs] = await Promise.all([
    query<Row>(`SELECT 'item' kind, id, name_en, name_th, category, ${IMG('image_id')} img FROM item WHERE name_en LIKE ? OR name_th LIKE ? ORDER BY length(name_en) LIMIT 40`, [like, like]),
    query<Row>(`SELECT 'npc' kind, id, name_en, name_th, 'NPC' category, ${IMG('image_id')} img FROM npc WHERE name_en LIKE ? OR name_th LIKE ? LIMIT 10`, [like, like]),
    query<Row>(`SELECT 'building' kind, id, name_en, name_th, 'อาคาร' category, ${IMG('image_id')} img FROM building WHERE name_en LIKE ? OR name_th LIKE ? LIMIT 10`, [like, like]),
  ])
  return [...npcs, ...bs, ...items]
}

/* ---------- พืช ---------- */
export type CropListRow = { id: string; name_en: string; name_th: string | null; img: string | null; growth_days: number; regrow_days: number | null }
export const cropsInSeason = (season: Season) => query<CropListRow>(`SELECT i.id, i.name_en, i.name_th, ${IMG('i.image_id')} img, c.growth_days, c.regrow_days
  FROM crop c JOIN item i ON i.id = c.item_id JOIN crop_season cs ON cs.crop_id = c.item_id WHERE cs.season = ? AND i.category IN ('Fruit','Vegetable','Flower')
  ORDER BY i.name_en`, [season])

export type ItemFull = { id: string; name_en: string; name_th: string | null; category: string | null; sell_price: number | null; img: string | null; description_en: string | null }
export const itemFull = async (id: string) => (await query<ItemFull>(`SELECT id, name_en, name_th, category, sell_price, ${IMG('image_id')} img, description_en FROM item WHERE id = ?`, [id]))[0] ?? null

export type CropFull = { growth_days: number; regrow_days: number | null; min_harvest: number; seed_id: string; seed_name: string; seasons: string; seed_price: number | null; shop: string | null }
export const cropFull = async (id: string) => (await query<CropFull>(`SELECT c.growth_days, c.regrow_days, c.min_harvest, c.seed_item_id seed_id, s.name_en seed_name,
  (SELECT group_concat(season) FROM crop_season WHERE crop_id = c.item_id) seasons,
  (SELECT min(price) FROM shop_price WHERE item_id = c.seed_item_id AND shop NOT IN ('Traveling Cart','Egg Festival','Adventurer Ledger')) seed_price,
  (SELECT shop FROM shop_price WHERE item_id = c.seed_item_id AND shop NOT IN ('Traveling Cart','Egg Festival','Adventurer Ledger') ORDER BY price LIMIT 1) shop
  FROM crop c JOIN item s ON s.id = c.seed_item_id WHERE c.item_id = ?`, [id]))[0] ?? null

/** ไอเท็มนี้ใช้ทำอะไรได้: สูตร · Bundle · NPC ที่ชอบมาก */
export type Use = { kind: 'recipe' | 'bundle' | 'love'; id: string; name_en: string; name_th: string | null; img: string | null; tag: string }
export async function usesOf(id: string): Promise<Use[]> {
  const [recipes, bundles, loves] = await Promise.all([
    query<Use>(`SELECT 'recipe' kind, o.id, o.name_en, o.name_th, ${IMG('o.image_id')} img, CASE r.kind WHEN 'cooking' THEN 'สูตรอาหาร' ELSE 'สูตรคราฟต์' END tag
      FROM recipe_ingredient ri JOIN recipe r ON r.id = ri.recipe_id JOIN item o ON o.id = r.output_item_id WHERE ri.item_id = ? LIMIT 12`, [id]),
    query<Use>(`SELECT 'bundle' kind, b.id, b.name_en, NULL name_th, (SELECT file_path FROM image WHERE id = 'img_npc_junimos' AND status = 'downloaded') img, b.room tag FROM bundle_item bi JOIN bundle b ON b.id = bi.bundle_id WHERE bi.item_id = ?`, [id]),
    query<Use>(`SELECT 'love' kind, n.id, n.name_en, n.name_th, ${IMG('n.image_id')} img, 'ชอบมาก' tag FROM gift_taste g JOIN npc n ON n.id = g.npc_id WHERE g.item_id = ? AND g.taste = 'love' ORDER BY n.name_en`, [id]),
  ])
  return [...recipes, ...bundles, ...loves]
}

/** ผลิตภัณฑ์แปรรูปจากไอเท็มนี้ (ตามกฎในฐานข้อมูล) */
export type Product = { machine_id: string; output_id: string; name_en: string; name_th: string | null; img: string | null; price_formula: string | null; time_minutes: number | null }
export const productsOf = (id: string, category: string | null) => query<Product>(`SELECT r.machine_id, o.id output_id, o.name_en, o.name_th, ${IMG('o.image_id')} img, r.price_formula, r.time_minutes
  FROM processing_rule r JOIN item o ON o.id = r.output_item_id WHERE r.input_item_id = ? OR (r.input_item_id IS NULL AND r.input_category = ?)`, [id, category ?? ''])

/* ---------- ปลา ---------- */
export type FishRow = { id: string; name_en: string; name_th: string | null; img: string | null; locations: string; seasons: string; weather: string | null; time_start: number | null; time_end: number | null; sell_price: number | null; category: string | null }
export const allFish = () => query<FishRow>(`SELECT i.id, i.name_en, i.name_th, ${IMG('i.image_id')} img, f.locations, f.seasons, f.weather, f.time_start, f.time_end, i.sell_price, i.category
  FROM fish f JOIN item i ON i.id = f.item_id ORDER BY i.name_en`)

/* ---------- อาคาร ---------- */
export type BuildingFull = { id: string; name_en: string; name_th: string | null; builder: string; cost_gold: number | null; build_days: number | null; img: string | null
  size_w?: number | null; size_h?: number | null; upgrade_from?: string | null }
export async function buildingFull(id: string) {
  const c = await cols('building')
  const extra = ['size_w', 'size_h', 'upgrade_from'].filter((k) => c.has(k)).map((k) => `, ${k}`).join('')
  const b = (await query<BuildingFull>(`SELECT id, name_en, name_th, builder, cost_gold, build_days, ${IMG('image_id')} img${extra} FROM building WHERE id = ?`, [id]))[0]
  if (!b) return null
  const mats = await query<{ id: string; name_en: string; name_th: string | null; img: string | null; qty: number }>(`SELECT i.id, i.name_en, i.name_th, ${IMG('i.image_id')} img, bm.qty
    FROM building_material bm JOIN item i ON i.id = bm.item_id WHERE bm.building_id = ? ORDER BY bm.rowid`, [id])
  const next = c.has('upgrade_from') ? await query<BuildingFull & { mats: string | null }>(`SELECT b.id, b.name_en, b.name_th, b.cost_gold, ${IMG('b.image_id')} img,
    (SELECT group_concat(i.name_en || ' ×' || bm.qty, ' · ') FROM building_material bm JOIN item i ON i.id = bm.item_id WHERE bm.building_id = b.id) mats
    FROM building b WHERE b.upgrade_from = ?`, [id]) : []
  return { b, mats, next, hasCols: c }
}
export const buildingList = () => query<{ id: string; name_en: string; name_th: string | null; builder: string; img: string | null; cost_gold: number | null }>(`SELECT id, name_en, name_th, builder, ${IMG('image_id')} img, cost_gold FROM building ORDER BY builder = 'Robin' DESC, rowid`)

/* ---------- NPC ---------- */
export type NpcFull = { id: string; name_en: string; name_th: string | null; birthday_season: Season | null; birthday_day: number | null; marriageable: number; img: string | null; home?: string | null }
export async function npcFull(id: string) {
  const c = await cols('npc')
  const n = (await query<NpcFull>(`SELECT id, name_en, name_th, birthday_season, birthday_day, marriageable, ${IMG('image_id')} img${c.has('home') ? ', home' : ''} FROM npc WHERE id = ?`, [id]))[0]
  if (!n) return null
  const gifts = await query<{ id: string; name_en: string; name_th: string | null; img: string | null; taste: string }>(`SELECT i.id, i.name_en, i.name_th, ${IMG('i.image_id')} img, g.taste
    FROM gift_taste g JOIN item i ON i.id = g.item_id WHERE g.npc_id = ? ORDER BY i.name_en`, [id])
  const sc = (await hasTable('npc_schedule')) ? await cols('npc_schedule') : null
  const th = sc?.has('location_th') ? ', location_th, note_th' : ", NULL location_th, NULL note_th"
  const sched = sc ? await query<{ season: string | null; day_kind: string; time: number; location: string; note: string | null; location_th: string | null; note_th: string | null }>(
    `SELECT season, day_kind, time, location, note${th} FROM npc_schedule WHERE npc_id = ? ORDER BY time`, [id]) : null
  const pts = Object.fromEntries((await query<{ key: string; value: number }>(`SELECT key, value FROM game_constant WHERE key LIKE 'gift_%' OR key = 'friendship_points_per_heart'`)).map((r) => [r.key, r.value]))
  return { n, gifts, sched, pts }
}
export const npcList = () => query<{ id: string; name_en: string; name_th: string | null; img: string | null; birthday_season: string | null; birthday_day: number | null }>(
  `SELECT id, name_en, name_th, ${IMG('image_id')} img, birthday_season, birthday_day FROM npc ORDER BY name_en`)

/* ---------- สถานที่ SVE (หน้า Locations ของวิกิ SVE) ---------- */
export type Loc = { id: string; name_en: string; name_th: string | null; category: string; img: string | null; description_en: string | null; fish: string[] }
export async function sveLocations(): Promise<Loc[]> {
  if (!(await hasTable('location'))) return []
  const [locs, aliases, fish] = await Promise.all([
    query<Omit<Loc, 'fish'>>(`SELECT id, name_en, name_th, category, ${IMG('image_id')} img, description_en FROM location ORDER BY sort`),
    query<{ alias: string; location_id: string }>('SELECT alias, location_id FROM location_alias'),
    allFish(),
  ])
  const byName = new Map<string, string>()
  locs.forEach((l) => byName.set(l.name_en.toLowerCase(), l.id))
  aliases.forEach((a) => byName.set(a.alias.toLowerCase(), a.location_id))
  const fishAt: Record<string, string[]> = {}
  for (const f of fish) {
    let ls: string[] = []
    try { const j = JSON.parse(f.locations || '[]'); ls = Array.isArray(j) ? j : [] } catch { /* ข้อมูลเสีย */ }
    for (const l of ls) { const id = byName.get(String(l).toLowerCase()); if (id) (fishAt[id] ??= []).includes(f.id) || fishAt[id].push(f.id) }
  }
  return locs.map((l) => ({ ...l, fish: fishAt[l.id] ?? [] }))
}
