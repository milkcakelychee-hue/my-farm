// ตัวคำนวณของแท็บคำนวณ (สเปกข้อ 4) — ทุกตัวเลขมาจากฐานข้อมูลเกม + เซฟ
import { useEffect, useState } from 'preact/hooks'
import { query } from './gamedb'
import { applyFormula, capacity, SEASONS } from './farmdata'
import type { SaveData, SkillName } from './save'

export type Profession = { id: string; skill: SkillName | 'Combat'; level: 5 | 10; parent_id: string | null; name_en: string; name_th: string | null; description_en: string | null; bonus_kind: string | null; bonus_value: number | null }
export type CropInfo = {
  id: string; name_en: string; name_th: string | null; category: string; sell_price: number; growth_days: number; regrow_days: number | null
  min_harvest: number; seed_id: string; seed_name: string; seed_price: number | null; shop: string | null; img: string | null; seed_img: string | null; seasons: string
}
export type Rule = { machine_id: string; input_item_id: string | null; input_category: string | null; output_name: string; output_id: string; time_minutes: number | null; price_formula: string | null; input_qty: number }
export type AnimalInfo = { id: string; name_en: string; name_th: string | null; building: 'Coop' | 'Barn'; building_level: number; price: number; produce_id: string; produce_name: string; produce_price: number | null; produce_days: number | null; img: string | null }
export type CalcData = {
  c: Record<string, number>; professions: Profession[]; crops: CropInfo[]; rules: Rule[]; animals: AnimalInfo[]
  fertilizers: { id: string; name_en: string; price: number; img: string | null }[]
  machineNames: Record<string, string>; img: Record<string, string>
}

const IMG = (col: string) => `(SELECT file_path FROM image WHERE id = ${col} AND status = 'downloaded')`
// ร้านที่ใช้หาราคาเมล็ด: ไม่นับร้านที่มาเป็นครั้งคราว (Traveling Cart, เทศกาล)
const SHOP_FILTER = `shop NOT IN ('Traveling Cart','Egg Festival','Adventurer Ledger') AND currency = 'g'`

let cache: Promise<CalcData> | null = null
async function load(): Promise<CalcData> {
  const has = async (t: string) => (await query<{ n: number }>(`SELECT count(*) n FROM sqlite_master WHERE name = ?`, [t]))[0].n > 0
  const [consts, profs, crops, rules, animals, ferts, machines, imgs] = await Promise.all([
    query<{ key: string; value: number }>('SELECT key, value FROM game_constant'),
    (await has('profession')) ? query<Profession>('SELECT id, skill, level, parent_id, name_en, name_th, description_en, bonus_kind, bonus_value FROM profession ORDER BY rowid') : Promise.resolve([]),
    query<CropInfo>(`SELECT i.id, i.name_en, i.name_th, i.category, i.sell_price, c.growth_days, c.regrow_days, c.min_harvest,
        c.seed_item_id AS seed_id, s.name_en AS seed_name,
        (SELECT min(price) FROM shop_price WHERE item_id = c.seed_item_id AND ${SHOP_FILTER}) AS seed_price,
        (SELECT shop FROM shop_price WHERE item_id = c.seed_item_id AND ${SHOP_FILTER} ORDER BY price LIMIT 1) AS shop,
        ${IMG('i.image_id')} AS img, ${IMG('s.image_id')} AS seed_img,
        (SELECT group_concat(season) FROM crop_season WHERE crop_id = c.item_id) AS seasons
      FROM crop c JOIN item i ON i.id = c.item_id JOIN item s ON s.id = c.seed_item_id
      WHERE i.sell_price IS NOT NULL AND i.category IN ('Fruit','Vegetable','Flower')`),
    query<Rule>(`SELECT r.machine_id, r.input_item_id, r.input_category, o.name_en AS output_name, o.id AS output_id, r.time_minutes, r.price_formula, r.input_qty
      FROM processing_rule r JOIN item o ON o.id = r.output_item_id`),
    query<AnimalInfo>(`SELECT a.id, a.name_en, a.name_th, a.building, a.building_level, a.price, a.produce_item_id AS produce_id, p.name_en AS produce_name,
        p.sell_price AS produce_price, a.produce_days, ${IMG('a.image_id')} AS img
      FROM animal a JOIN item p ON p.id = a.produce_item_id WHERE a.price IS NOT NULL AND a.building IN ('Coop','Barn')`),
    query<{ id: string; name_en: string; price: number; img: string | null }>(`SELECT i.id, i.name_en, min(sp.price) AS price, ${IMG('i.image_id')} AS img
      FROM shop_price sp JOIN item i ON i.id = sp.item_id WHERE i.id IN ('basic_fertilizer','quality_fertilizer','deluxe_fertilizer') AND sp.${SHOP_FILTER}
      GROUP BY i.id ORDER BY price`),
    query<{ id: string; name_en: string }>('SELECT id, name_en FROM machine'),
    query<{ id: string; f: string }>(`SELECT i.id, im.file_path f FROM item i JOIN image im ON im.id = i.image_id AND im.status = 'downloaded' WHERE i.id IN ('keg','preserves_jar','mayonnaise_machine','cheese_press','loom','oil_maker')`),
  ])
  const file = (p: string | null) => (p ? p.split('/').pop()! : null)
  return {
    c: Object.fromEntries(consts.map((r) => [r.key, r.value])),
    professions: profs,
    crops: crops.map((c) => ({ ...c, img: file(c.img), seed_img: file(c.seed_img) })),
    rules, animals: animals.map((a) => ({ ...a, img: file(a.img) })),
    fertilizers: ferts.map((f) => ({ ...f, img: file(f.img) })),
    machineNames: Object.fromEntries(machines.map((m) => [m.id, m.name_en])),
    img: Object.fromEntries(imgs.map((r) => [r.id, file(r.f)!])),
  }
}
export function useCalcData(): CalcData | Error | null {
  const [d, setD] = useState<CalcData | Error | null>(null)
  useEffect(() => { (cache ??= load()).then(setD, (e) => { cache = null; setD(e instanceof Error ? e : new Error(String(e))) }) }, [])
  return d
}

/* ---------- โบนัสอาชีพ ---------- */
export type Bonus = { crop: number; artisan: number; animal: number; speed: number; any: boolean; set: boolean }
export function bonus(d: CalcData, s: SaveData): Bonus {
  const chosen = d.professions.filter((p) => s.skills.professions.includes(p.id))
  const mult = (k: string) => chosen.filter((p) => p.bonus_kind === k).reduce((a, p) => a * (p.bonus_value ?? 1), 1)
  const speed = chosen.filter((p) => p.bonus_kind === 'growth_speed').reduce((a, p) => a + (p.bonus_value ?? 0), 0)
  const b = { crop: mult('crop_price'), artisan: mult('artisan_price'), animal: mult('animal_product_price'), speed }
  return { ...b, any: b.crop !== 1 || b.artisan !== 1 || b.animal !== 1 || speed > 0, set: s.skills.levels.Farming > 0 || s.skills.professions.length > 0 }
}

/* ---------- คุณภาพพืช (สูตรจากหน้า Farming ในวิกิ เก็บใน game_constant) ---------- */
const K = (d: CalcData, key: string) => d.c[key]
/** ราคาเฉลี่ยต่อผล 1 ผล (เฉพาะผลแรก คุณภาพสุ่มได้) เป็นเท่าของราคาปกติ · null = ฐานข้อมูลยังไม่มีสูตร */
export function qualityFactor(d: CalcData, farming: number, fertLevel: number): number | null {
  const need = ['quality_gold_level_coef_x1000', 'quality_gold_level_div', 'quality_gold_fert_coef_x1000', 'quality_gold_fert_level_add', 'quality_gold_fert_div', 'quality_gold_base_x1000',
    'quality_silver_gold_mult', 'quality_silver_cap_x1000', 'quality_iridium_gold_div', 'fertilizer_level_deluxe', 'quality_price_silver_x1000', 'quality_price_gold_x1000', 'quality_price_iridium_x1000']
  if (need.some((k) => K(d, k) == null)) return null
  const gold = (K(d, 'quality_gold_level_coef_x1000') / 1000) * (farming / K(d, 'quality_gold_level_div'))
    + (K(d, 'quality_gold_fert_coef_x1000') / 1000) * fertLevel * ((farming + K(d, 'quality_gold_fert_level_add')) / K(d, 'quality_gold_fert_div'))
    + K(d, 'quality_gold_base_x1000') / 1000
  const silverRaw = Math.min(K(d, 'quality_silver_gold_mult') * gold, K(d, 'quality_silver_cap_x1000') / 1000)
  const deluxe = fertLevel >= K(d, 'fertilizer_level_deluxe')
  const pI = deluxe ? gold / K(d, 'quality_iridium_gold_div') : 0
  const pG = (1 - pI) * gold
  const pS = deluxe ? 1 - pI - pG : (1 - pI - pG) * silverRaw
  const pN = 1 - pI - pG - pS
  return pN + pS * K(d, 'quality_price_silver_x1000') / 1000 + pG * K(d, 'quality_price_gold_x1000') / 1000 + pI * K(d, 'quality_price_iridium_x1000') / 1000
}

/* ---------- แนะนำปลูกสด ---------- */
export type Group = 'flower' | 'once' | 'regrow'
export const groupOf = (c: CropInfo): Group => (c.category === 'Flower' ? 'flower' : c.regrow_days ? 'regrow' : 'once')
export type FreshRow = { crop: CropInfo; group: Group; harvests: number; lastDay: number; plain: number; fert: number | null; best: 'plain' | 'fert' }

export function daysLeft(s: SaveData) { return 28 - s.date.day }
/** วันที่ต้องใช้โตเมื่อมีโบนัสโตเร็ว (Agriculturist) — ปัดขึ้นจำนวนวันที่ลดได้ */
export const growDays = (g: number, speed: number) => g - Math.ceil(g * speed)

export function freshPlan(d: CalcData, s: SaveData, tiles: Record<Group, number>, fertId: string | null): FreshRow[] {
  const b = bonus(d, s)
  const left = daysLeft(s)
  const fert = d.fertilizers.find((f) => f.id === fertId) ?? null
  const fertLevel = fert ? K(d, `fertilizer_level_${fert.id.replace('_fertilizer', '')}`) ?? null : null
  const qPlain = qualityFactor(d, s.skills.levels.Farming, 0)
  const qFert = fertLevel == null ? null : qualityFactor(d, s.skills.levels.Farming, fertLevel)
  const out: FreshRow[] = []
  for (const c of d.crops) {
    if (!c.seasons?.split(',').includes(s.date.season) || c.seed_price == null) continue
    const g = growDays(c.growth_days, b.speed)
    if (g > left) continue                                       // เก็บไม่ทันก่อนสิ้นฤดู
    const harvests = c.regrow_days ? 1 + Math.floor((left - g) / c.regrow_days) : 1
    const lastDay = s.date.day + g + (harvests - 1) * (c.regrow_days ?? 0)
    const grp = groupOf(c)
    const n = tiles[grp]
    const perHarvest = (q: number) => c.sell_price * b.crop * (q + (c.min_harvest - 1))
    const plain = qPlain == null ? null : Math.round(n * (harvests * perHarvest(qPlain) - c.seed_price))
    const fertP = qFert == null || !fert ? null : Math.round(n * (harvests * perHarvest(qFert) - c.seed_price - fert.price))
    if (plain == null) continue
    out.push({ crop: c, group: grp, harvests, lastDay, plain, fert: fertP, best: fertP != null && fertP > plain ? 'fert' : 'plain' })
  }
  const val = (r: FreshRow) => Math.max(r.plain, r.fert ?? -Infinity)
  return out.sort((a, z) => val(z) - val(a))
}
export const bestValue = (r: FreshRow) => Math.max(r.plain, r.fert ?? -Infinity)

/* ---------- แปรรูป ---------- */
export function ruleFor(d: CalcData, machine: string, item: { id: string; category: string }): Rule | null {
  return d.rules.find((r) => r.machine_id === machine && r.input_item_id === item.id)
    ?? d.rules.find((r) => r.machine_id === machine && !r.input_item_id && r.input_category === item.category) ?? null
}
export type ProcessOpt = { machine: string; rule: Rule; days: number; price: number; perPiece: number; perDay: number }
export function processOptions(d: CalcData, s: SaveData, c: CropInfo): ProcessOpt[] {
  const b = bonus(d, s)
  const fresh = c.sell_price * b.crop
  return ['keg', 'preserves_jar'].flatMap((m) => {
    const r = ruleFor(d, m, c)
    const base = r ? applyFormula(r.price_formula, c.sell_price) : null
    if (!r || base == null || !r.time_minutes) return []
    const days = Math.max(1, Math.round(r.time_minutes / 1440))
    const price = Math.floor(base * b.artisan + 1e-6)
    const perPiece = Math.round((price - fresh * r.input_qty) / r.input_qty)
    return [{ machine: m, rule: r, days, price, perPiece, perDay: Math.round(perPiece / days) }]
  })
}

/* ---------- สัตว์ ---------- */
export type AnimalRow = { a: AnimalInfo; sell: number | null; proc: { name: string; perDay: number; machine: string } | null; payback: number | null }
export function animalRows(d: CalcData, s: SaveData, kind: 'Coop' | 'Barn'): AnimalRow[] {
  const b = bonus(d, s)
  const levels = s.animal_housing[kind === 'Coop' ? 'coop' : 'barn']
  const top = levels.length ? Math.max(...levels) : 0
  return d.animals.filter((a) => a.building === kind && a.building_level <= top).map((a) => {
    const days = a.produce_days
    const sell = a.produce_price == null || !days ? null : Math.round((a.produce_price * b.animal) / days)
    const r = d.rules.find((x) => x.input_item_id === a.produce_id)
    const pp = r ? applyFormula(r.price_formula, a.produce_price) : null
    const proc = r && pp != null && days ? { name: r.output_name, perDay: Math.round(Math.floor(pp * b.artisan + 1e-6) / r.input_qty / days), machine: r.machine_id } : null
    const best = Math.max(sell ?? 0, proc?.perDay ?? 0)
    return { a, sell, proc, payback: best > 0 ? Math.ceil(a.price / best) : null }
  }).sort((x, y) => Math.max(y.proc?.perDay ?? 0, y.sell ?? 0) - Math.max(x.proc?.perDay ?? 0, x.sell ?? 0))
}
export function housingCap(d: { c: Record<string, number> }, s: SaveData, k: 'coop' | 'barn'): number | null {
  return s.animal_housing[k].reduce<number | null>((acc, l) => { const c = capacity(d as never, k, l); return acc == null || c == null ? null : acc + c }, 0)
}
export { SEASONS }

/** คำอธิบายสั้นภาษาไทยจากโบนัสในฐานข้อมูล (ไม่มีโบนัส = ใช้คำอธิบายจากวิกิ) */
const KIND_TH: Record<string, string> = { crop_price: 'ราคาพืช', artisan_price: 'ของแปรรูป', animal_product_price: 'ผลผลิตสัตว์', fish_price: 'ราคาปลา',
  metal_bar_price: 'ราคาแท่งโลหะ', gem_price: 'ราคาอัญมณี', syrup_price: 'ราคาน้ำเชื่อม' }
export function profShort(p: Profession): string | null {
  if (p.bonus_kind === 'growth_speed' && p.bonus_value) return `พืชโตเร็วขึ้น ${Math.round(p.bonus_value * 100)}%`
  if (p.bonus_kind && KIND_TH[p.bonus_kind] && p.bonus_value) return `${KIND_TH[p.bonus_kind]} +${Math.round((p.bonus_value - 1) * 100)}%`
  return p.description_en
}
