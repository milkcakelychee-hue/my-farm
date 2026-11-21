// แท็บ Wiki — บอร์ด 15 WikiHome · 16 WikiCropList · 17 WikiCropDetail · 18 WikiFishList · 19 WikiFishDetail · 20 WikiBuildingDetail · 21 WikiNpcDetail
import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useSave } from './data/useSave'
import { applyFormula, capacity, dayIndex, SEASONS, useFarmData } from './data/farmdata'
import { useCalcData, freshPlan, bestValue, groupOf, bonus } from './data/calc'
import {
  allFish, buildingFull, buildingList, cropFull, cropsInSeason, file, itemFull, npcFull, npcList, productsOf, search, usesOf,
  type FishRow, type Row,
} from './data/wikidata'
import type { Season } from './data/save'
import { BRAND100, BRAND160, Body, Card, Divider, Head, I, Loading, NA, Slot, StageNote, card, n } from './myfarm'
import { EmptyState } from './ui'

export const goWiki = (sub?: string) => { location.hash = `#/1${sub ? '/' + sub : ''}` }
const goBack = () => (history.length > 1 ? history.back() : goWiki())
const GREEN = '#3F5510'

function useQ<T>(fn: () => Promise<T>, deps: unknown[]): T | null {
  const [v, setV] = useState<T | null>(null)
  useEffect(() => { let on = true; setV(null); fn().then((x) => on && setV(x)); return () => { on = false } }, deps)
  return v
}

/* ---------- เปิดล่าสุด (เก็บในเครื่องนี้เท่านั้น) ---------- */
type Recent = { href: string; name_en: string; name_th: string | null; img?: string; sub: string }
const RKEY = 'myfarm.wiki.recent'
const readRecent = (): Recent[] => { try { return JSON.parse(localStorage.getItem(RKEY) ?? '[]') } catch { return [] } }
function pushRecent(r: Recent) {
  try { localStorage.setItem(RKEY, JSON.stringify([r, ...readRecent().filter((x) => x.href !== r.href)].slice(0, 6))) } catch { /* ไม่มีที่เก็บ: ข้ามไป */ }
}

/* ---------- ชิ้นส่วน ---------- */
const searchIcon = <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A8F80" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
function SearchBox({ value, onInput }: { value: string; onInput: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 16px', borderRadius: 24, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)' }}>
      {searchIcon}
      <input value={value} onInput={(e) => onInput((e.target as HTMLInputElement).value)} placeholder="ค้นหาชื่อไทยหรืออังกฤษ" aria-label="ค้นหา"
        style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 16, color: '#26201A' }} />
    </label>
  )
}
function ListRow({ img, en, th, sub, onClick, size = 48 }: { img?: string | null; en: string; th: string | null; sub?: string; onClick: () => void; size?: number }) {
  return (
    <button onClick={onClick} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, border: 0, borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', color: '#26201A', textAlign: 'left' }}>
      <Slot size={size} r={12} file={img ?? undefined} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{en}</span>
        <span style={{ fontSize: 13, lineHeight: 1.3, color: '#6B6157' }}>{th ?? 'ชื่อไทย'}</span>
        {sub && <span style={{ fontSize: 12.5, lineHeight: 1.3, color: '#4F463D', marginTop: 2 }}>{sub}</span>}
      </span>
      <span style={{ flex: 'none', display: 'flex' }}>{I.chev()}</span>
    </button>
  )
}
function Back({ note }: { note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button aria-label="กลับ" onClick={goBack} style={{ flex: 'none', width: 44, height: 44, padding: 0, border: 0, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.back}</button>
      {note && <span style={{ fontSize: 12, color: '#6B6157' }}>{note}</span>}
    </div>
  )
}
function TitleRow({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button aria-label="กลับ" onClick={() => goWiki()} style={{ flex: 'none', width: 44, height: 44, padding: 0, border: 0, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.back}</button>
      <h1 style={{ margin: 0, flex: 1, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{title}</h1>
    </div>
  )
}
const CUBE = <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A10" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v10l-8 4-8-4V7z" /><path d="M4 7l8 4 8-4M12 11v10" /></svg>
const LEAF = <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A2B1B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19C4 11 9 4 20 4c0 11-6 16-13 15z" /><path d="M5 19L14 10" /></svg>
const PIN = (c = '#4B3F8F', s = 13) => <svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.200 7-11.500A7 7 0 005 9.500C5 14.800 12 21 12 21z" /><circle cx="12" cy="9.500" r="2.500" /></svg>
const PERSON = <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A3B27" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
const CHECK = (c = '#26201A') => <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.500 4.500L19 7" /></svg>
const Chip = ({ bg, icon, children }: { bg: string; icon: ComponentChildren; children: ComponentChildren }) =>
  <span style={{ height: 28, padding: '0 10px 0 8px', display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 8, background: bg, fontSize: 12, fontWeight: 600, color: '#26201A', whiteSpace: 'nowrap' }}>{icon}{children}</span>
const Stat = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: 12, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 16, background: '#FAF6EE' }}>
    <span style={{ fontSize: 12, color: '#6B6157' }}>{label}</span>
    <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25, color: color ?? '#26201A' }}>{value}</span>
    {sub && <span style={{ fontSize: 12, lineHeight: 1.35, color: '#6B6157' }}>{sub}</span>}
  </div>
)
function SeasonBar({ on }: { on: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {SEASONS.map((s) => on.includes(s)
        ? <span style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12, background: BRAND160, color: '#26201A', fontSize: 14, fontWeight: 700 }}>{CHECK()}{s}</span>
        : <span style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#ECE6DC', color: '#8F8271', fontSize: 14, fontWeight: 600 }}>{s}</span>)}
    </div>
  )
}
function Hero({ img, en, th, chips, size = 96 }: { img?: string | null; en: string; th: string | null; chips: ComponentChildren; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <Slot size={size} r={20} file={img ?? undefined} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{en}</h1>
          <span style={{ fontSize: 15, color: '#6B6157', lineHeight: 1.35 }}>{th ?? 'ชื่อไทย'}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{chips}</div>
      </div>
    </div>
  )
}
/** ป้ายแบบตาราง 3 คอลัมน์ (แทนป้ายเม็ดยา) */
function TileGrid({ children, cols = 3 }: { children: ComponentChildren; cols?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8 }}>{children}</div>
}
function GridTile({ on, onClick, icon, label, value, valueColor }: { on: boolean; onClick: () => void; icon?: ComponentChildren; label: string; value?: string; valueColor?: string }) {
  return (
    <button aria-pressed={on} onClick={onClick} style={{ minWidth: 0, minHeight: 64, boxSizing: 'border-box', padding: '8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 2, border: 0, borderRadius: 14, color: '#26201A', textAlign: 'left',
      ...(on ? { background: BRAND160, boxShadow: '0 3px 8px rgba(247,164,65,.3)' } : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5' }) }}>
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 4, minWidth: 0, maxWidth: '100%' }}>{icon && <span style={{ flex: 'none', marginTop: 1 }}>{icon}</span>}<span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{label}</span></span>
      {value && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: on ? '#26201A' : (valueColor ?? '#6B6157') }}>{value}</span>}
    </button>
  )
}
/** ราคาตามคุณภาพ (ตัวคูณจาก game_constant) */
function QualityPrices({ price, c }: { price: number | null; c: Record<string, number> }) {
  const q: [string, number | null][] = [['Normal', 1000], ['Silver', c.quality_price_silver_x1000 ?? null], ['Gold', c.quality_price_gold_x1000 ?? null], ['Iridium', c.quality_price_iridium_x1000 ?? null]]
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {q.map(([l, m]) => (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 2px 8px', borderRadius: 14, background: '#FAF6EE' }}>
          <Slot size={28} r={8} />
          <span style={{ fontSize: 12, color: '#6B6157' }}>{l}</span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{price == null || m == null ? '—' : `${n(Math.floor(price * m / 1000))}g`}</span>
        </div>
      ))}
    </div>
  )
}
function ItemLine({ img, en, th, right, onClick }: { img?: string | null; en: string; th: string | null; right: ComponentChildren; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 0, border: 0, background: 'none', color: '#26201A', textAlign: 'left' }}>
      <Slot size={40} r={10} file={img ?? undefined} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{en}</span>
        <span style={{ fontSize: 13, lineHeight: 1.3, color: '#6B6157' }}>{th ?? 'ชื่อไทย'}</span>
      </span>
      {right}
    </button>
  )
}
/** ค่า JSON จากฐานข้อมูลอาจเป็นรายการหรือข้อความเดี่ยว */
const arr = (v: string | null): string[] => {
  try {
    const j = JSON.parse(v || '[]')
    if (Array.isArray(j)) return j.map(String)
    if (j && typeof j === 'object') return /^all$/i.test(String(j.raw ?? '')) ? ['All'] : Array.isArray(j.default) ? j.default.map(String) : []   // {default, raw}
    return [String(j)]
  } catch { return v ? [v] : [] }
}
const hhmm = (t: number | null) => (t == null ? '—' : `${String(Math.floor(t / 100) % 24).padStart(2, '0')}:${String(t % 100).padStart(2, '0')}`)
const weatherTh = (w: string | null) => (!w ? null : /rain/i.test(w) ? 'ฝนตก' : /sun/i.test(w) ? 'แดดออก' : 'ทุกสภาพอากาศ')

/* ---------- 15 · หน้าหลัก Wiki ---------- */
const CATS: [string, string | null][] = [['พืชผล', 'crops'], ['ปลา', 'fish'], ['ของป่า', null], ['แร่และอัญมณี', null], ['อาหารและสูตร', null], ['เครื่องจักร', null], ['อาคาร', 'buildings'], ['NPC', 'npcs'], ['มอนสเตอร์', null]]
export function WikiHome() {
  const s = useSave()
  const [q, setQ] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const res = useQ(() => search(q), [q])
  const recent = readRecent()
  const season = s?.date.season ?? 'Spring'
  return (
    <Body>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.3 }}>Wiki</h1>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: '#6B6157' }}>ข้อมูลในเกม · ใช้ออฟไลน์ได้</span>
      </div>
      <SearchBox value={q} onInput={setQ} />
      {q.trim() ? (
        <>
          <Head title="ผลการค้นหา" note={res ? `${res.length} รายการ` : ''} />
          {res?.length === 0 && <EmptyState title="ไม่พบ" body={`ไม่มีชื่อที่ตรงกับ "${q}"`} />}
          {res?.map((r: Row) => <ListRow img={file(r.img)} en={r.name_en} th={r.name_th} sub={r.category ?? undefined} onClick={() => goWiki(`${r.kind}/${r.id}`)} />)}
        </>
      ) : (
        <>
          <button onClick={() => goWiki('crops')} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, border: 0, borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', color: '#26201A', textAlign: 'left' }}>
            <Slot size={44} r={12} />
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>ฤดูตอนนี้ · {season}</span><span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>ดูพืชและปลาที่เหมาะกับฤดูนี้</span></span>
            {I.chev()}
          </button>
          <Head title="หมวด" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 3, 6].map((i) => (
              <div style={{ display: 'flex', gap: 8 }}>
                {CATS.slice(i, i + 3).map(([l, k]) => (
                  <button onClick={() => (k ? goWiki(k) : setNote(l))} style={{ flex: 1, minWidth: 0, height: 84, boxSizing: 'border-box', padding: '8px 4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, border: 0, borderRadius: 14, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5', color: '#26201A', fontWeight: 600 }}>
                    <Slot size={32} r={8} /><span style={{ fontSize: 12.5, lineHeight: 1.2, textAlign: 'center', whiteSpace: 'nowrap' }}>{l}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          {recent.length > 0 && <Head title="เปิดล่าสุด" />}
          {recent.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{recent.map((r) => <ListRow img={r.img} en={r.name_en} th={r.name_th} sub={r.sub} onClick={() => { location.hash = r.href }} />)}</div>}
        </>
      )}
      {note && <StageNote what={`หมวด${note}`} onClose={() => setNote(null)} stage={7} />}
    </Body>
  )
}

/* ---------- แท็บฤดู ---------- */
function SeasonTabs({ value, onChange, now, compact }: { value: Season; onChange: (s: Season) => void; now: Season; compact?: boolean }) {
  return (
    <>
      {!compact && <Head title="ฤดู" note={`ตอนนี้ ${now}`} />}
      <div style={{ display: 'flex', gap: 8 }}>
        {SEASONS.map((s) => {
          const on = s === value
          return (
            <button aria-pressed={on} onClick={() => onChange(s)} style={{ flex: 1, minWidth: 0, height: compact ? 44 : 84, boxSizing: 'border-box', padding: compact ? '0 6px' : '8px 4px 6px', display: 'flex', flexDirection: compact ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 5, border: 0, borderRadius: 14, color: '#26201A', ...(on ? { background: BRAND160, boxShadow: '0 3px 8px rgba(247,164,65,.3)', fontWeight: 700 } : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5', fontWeight: 600 }) }}>
              <Slot size={compact ? 22 : 32} r={compact ? 6 : 8} on={on} /><span style={{ fontSize: 12.5, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{s}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ---------- 16 · พืชผล ---------- */
export function WikiCrops() {
  const s = useSave()
  const now = s?.date.season ?? 'Spring'
  const [season, setSeason] = useState<Season | null>(null)
  const [q, setQ] = useState('')
  const cur = season ?? now
  const rows = useQ(() => cropsInSeason(cur), [cur])
  const list = rows?.filter((r) => !q.trim() || `${r.name_en} ${r.name_th ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Body>
      <TitleRow title="พืชผล" />
      <SearchBox value={q} onInput={setQ} />
      <SeasonTabs value={cur} onChange={setSeason} now={now} />
      <Head title={`ปลูกได้ใน ${cur}`} note={list ? `${list.length} ชนิด` : ''} />
      {!list ? <Loading /> : list.length === 0 ? <EmptyState title="ไม่พบ" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((r) => <ListRow img={file(r.img)} en={r.name_en} th={r.name_th} sub={`โต ${r.growth_days} วัน · ${r.regrow_days ? `เก็บซ้ำทุก ${r.regrow_days} วัน` : 'เก็บครั้งเดียว'}`} onClick={() => goWiki('item/' + r.id)} />)}
        </div>
      )}
    </Body>
  )
}

/* ---------- 17 / 19 / ทั่วไป · รายละเอียดไอเท็ม ---------- */
export function WikiItem({ id }: { id: string }) {
  const s = useSave(); const cd = useCalcData()
  const data = useQ(async () => {
    const it = await itemFull(id)
    if (!it) return null
    const [crop, uses, prods, fish] = await Promise.all([cropFull(id), usesOf(id), productsOf(id, it.category), allFish().then((f) => f.find((x) => x.id === id) ?? null)])
    return { it, crop, uses, prods, fish }
  }, [id])
  useEffect(() => {
    if (!data?.it) return
    const sub = data.crop ? `พืชผล · ${data.crop.seasons?.split(',').join(', ')}` : data.fish ? `ปลา · ${arr(data.fish.seasons).join(', ')}` : data.it.category ?? ''
    pushRecent({ href: `#/1/item/${id}`, name_en: data.it.name_en, name_th: data.it.name_th, img: file(data.it.img), sub })
  }, [data])
  if (data === null || !s || !cd || cd instanceof Error) return <Loading />
  const { it, crop, uses, prods, fish } = data
  if (fish) return <FishDetail f={fish} uses={uses} prods={prods} c={cd.c} />
  const b = bonus(cd, s)
  // อันดับในแนะนำปลูกฤดูนี้ (ใช้ช่องของ My Farm)
  let rank: { i: number; group: string; v: number } | null = null
  if (crop) {
    const ps = s.plots.filter((p) => p.location === 'farm')
    const tiles = { flower: ps.reduce((a, p) => a + p.split.flower, 0), once: ps.reduce((a, p) => a + p.split.once, 0), regrow: ps.reduce((a, p) => a + p.split.regrow, 0) }
    const rows = freshPlan(cd, s, tiles, null)
    const c = cd.crops.find((x) => x.id === id)
    if (c) {
      const g = groupOf(c)
      const inGroup = rows.filter((r) => r.group === g)
      const i = inGroup.findIndex((r) => r.crop.id === id)
      if (i >= 0) rank = { i, group: g === 'once' ? 'โตครั้งเดียว' : g === 'regrow' ? 'เก็บซ้ำได้' : 'ไม้ดอก', v: bestValue(inGroup[i]) }
    }
  }
  const seasons = crop?.seasons?.split(',') ?? []
  const lastPlant = crop ? 28 - crop.growth_days : null
  const canPlant = crop && seasons.includes(s.date.season) && lastPlant != null && s.date.day <= lastPlant
  return (
    <Body bottom={28}>
      <Back />
      <Hero img={file(it.img)} en={it.name_en} th={it.name_th} chips={<>
        <Chip bg="#FFEBBF" icon={CUBE}>{crop ? 'พืชผล' : it.category ?? '—'}</Chip>
        {seasons.map((x) => <Chip bg="#E7EFCB" icon={LEAF}>{x}</Chip>)}
      </>} />
      {crop && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Slot size={40} r={10} />
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{rank ? `อันดับ ${rank.i + 1} ใน แนะนำปลูก ${s.date.season}` : `ไม่อยู่ในแนะนำปลูก ${s.date.season}`}</span>
              <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{rank ? `กลุ่ม${rank.group} · ${rank.v < 0 ? '−' : '+'}${n(Math.abs(rank.v))}g ทั้งแปลง` : 'ปลูกไม่ทันหรือไม่ใช่ฤดูนี้'}</span>
            </span>
            <button onClick={() => { location.hash = '#/3/fresh' }} style={{ flex: 'none', height: 44, padding: '0 8px', border: 0, background: 'none', color: '#A86E0C', fontSize: 14, fontWeight: 700 }}>ดูอันดับ</button>
          </div>
        </Card>
      )}
      {crop && (
        <>
          <Head title="ปลูกและเก็บเกี่ยว" />
          <Card>
            <SeasonBar on={seasons} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Stat label="โตเต็มที่" value={`${crop.growth_days} วัน`} />
              <Stat label="เก็บซ้ำ" value={crop.regrow_days ? `ทุก ${crop.regrow_days} วัน` : 'ไม่มี'} sub={crop.regrow_days ? undefined : 'เก็บครั้งเดียว'} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Stat label="ปลูกทันถึง" value={seasons.includes(s.date.season) && lastPlant ? `${s.date.season} ${lastPlant}` : '—'}
                sub={canPlant ? `ตอนนี้ ${s.date.season} ${s.date.day} · เหลือ ${lastPlant! - s.date.day} วัน` : seasons.includes(s.date.season) ? 'ปลูกไม่ทันแล้วฤดูนี้' : 'ไม่ใช่ฤดูนี้'} />
              <Stat label="ซื้อเมล็ด" value={crop.seed_price == null ? '—' : `${n(crop.seed_price)}g`} sub={crop.shop ?? NA} />
            </div>
          </Card>
        </>
      )}
      <Head title="ราคาขาย" />
      <Card>
        <QualityPrices price={it.sell_price == null ? null : Math.floor(it.sell_price * (crop ? b.crop : 1))} c={cd.c} />
        {prods.length > 0 && <>
          <Divider />
          <span style={{ fontSize: 13, fontWeight: 700 }}>แปรรูป</span>
          {prods.map((p) => {
            const v = applyFormula(p.price_formula, it.sell_price)
            return <ItemLine img={file(p.img)} en={p.name_en} th={p.name_th} right={<span style={{ flex: 'none', fontSize: 14, fontWeight: 700 }}>{v == null ? '—' : `${n(Math.floor(v * b.artisan + 1e-6))}g`}</span>} />
          })}
        </>}
      </Card>
      <UsesCard uses={uses} />
    </Body>
  )
}
function UsesCard({ uses }: { uses: Awaited<ReturnType<typeof usesOf>> }) {
  if (!uses.length) return null
  return (
    <>
      <Head title="ใช้ทำอะไรได้" />
      <Card gap={12}>
        {uses.map((u) => (
          <ItemLine img={file(u.img)} en={u.name_en} th={u.name_th} onClick={u.kind === 'love' ? () => goWiki('npc/' + u.id) : u.kind === 'recipe' ? () => goWiki('item/' + u.id) : undefined}
            right={u.kind === 'recipe' ? <Chip bg="#FFEBBF" icon={CUBE}>{u.tag}</Chip> : u.kind === 'bundle' ? <Chip bg="#E6E0FB" icon={PIN()}>{u.tag}</Chip> : <Chip bg="#F7D9D3" icon={PERSON}>{u.tag}</Chip>} />
        ))}
      </Card>
    </>
  )
}

/* ---------- 18 · ปลา + แผนที่ ---------- */
/** จุดบนแผนที่ (สัดส่วนของรูป) และคำที่ใช้จับกลุ่มสถานที่จากฐานข้อมูล */
export type Spot = { key: string; th: string; match: RegExp; x?: number; y?: number }
export const SPOTS: Spot[] = [
  { key: 'mountain', x: 0.7, y: 0.17, th: 'ทะเลสาบภูเขา', match: /mountain lake|the mountain$/i },
  { key: 'river', x: 0.72, y: 0.52, th: 'แม่น้ำ', match: /^river$|pelican town|cindersap forest$|forest river/i },
  { key: 'pond', x: 0.23, y: 0.62, th: 'บ่อในป่า', match: /forest pond|cindersap forest waterfalls/i },
  { key: 'ocean', x: 0.82, y: 0.86, th: 'มหาสมุทร', match: /^ocean$|the beach|beach farm/i },
  { key: 'swamp', th: 'หนองน้ำแม่มด', match: /witch's swamp/i },
  { key: 'woods', x: 0.11, y: 0.46, th: 'Secret Woods', match: /secret woods/i },
  { key: 'sewers', x: 0.57, y: 0.62, th: 'ท่อระบายน้ำ', match: /sewers|mutant bug lair/i },
  { key: 'mines', x: 0.6, y: 0.07, th: 'เหมือง', match: /mines|floor/i },
  { key: 'desert', th: 'ทะเลทราย', match: /desert/i },
  { key: 'island', th: 'Ginger Island', match: /ginger island|volcano/i },
  { key: 'market', th: 'Night Market', match: /night market/i },
]
const spotOf = (loc: string) => SPOTS.find((s) => s.match.test(loc))?.key ?? 'other'
const fishSpots = (f: FishRow) => [...new Set(arr(f.locations).map(spotOf))]
const MAP_FILE = 'img_map_world.png'

function FishMap({ value, onChange, counts }: { value: string | null; onChange: (k: string | null) => void; counts: Record<string, number> }) {
  const [ok, setOk] = useState(true)
  const H = 372, W = Math.round(H * 400 / 244)          // รูปแผนที่ 400×244 ขยายให้สูงเท่าบอร์ด แล้วเลื่อนซ้ายขวาได้
  const placed = SPOTS.filter((s) => s.x != null && s.y != null)
  const scroller = (el: HTMLDivElement | null) => { if (el && !el.dataset.init) { el.dataset.init = '1'; requestAnimationFrame(() => { el.scrollLeft = (W - el.clientWidth) / 2 }) } }
  return (
    <div style={{ position: 'relative', flex: 'none', height: H, borderRadius: 16, boxSizing: 'border-box', overflow: 'hidden', ...(ok ? { background: '#DCE7C8' } : { border: '2px dashed #CDBEA6', background: '#F6F0E4' }) }}>
      {ok && (
        <div ref={scroller} style={{ position: 'absolute', inset: 0, overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ position: 'relative', width: W, height: H }}>
            <img src={`${import.meta.env.BASE_URL}img/${MAP_FILE}`} alt="แผนที่ Stardew Valley" onError={() => setOk(false)} width={W} height={H} style={{ display: 'block', imageRendering: 'pixelated' }} />
            {placed.map((s) => {
              const on = value === s.key
              return (
                <button onClick={() => onChange(on ? null : s.key)} style={{ position: 'absolute', left: `${s.x! * 100}%`, top: `${s.y! * 100}%`, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: 0, border: 0, background: 'none' }}>
                  <span aria-hidden="true" style={{ width: on ? 30 : 24, height: on ? 30 : 24, borderRadius: '50%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(on ? { background: BRAND160, boxShadow: '0 3px 8px rgba(247,164,65,.35)' } : { background: '#FFFFFF', boxShadow: '0 2px 6px rgba(90,60,20,.2)' }) }}>{PIN(on ? '#26201A' : '#A86E0C', 14)}</span>
                  <span style={{ fontSize: 11, fontWeight: on ? 700 : 600, lineHeight: 1, padding: '3px 6px', borderRadius: 6, background: 'rgba(255,255,255,.92)', whiteSpace: 'nowrap', color: '#26201A' }}>{s.th}{counts[s.key] ? ` ${counts[s.key]}` : ''}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <span style={{ position: 'absolute', left: 12, bottom: 6, fontSize: 11, color: ok ? '#FFFFFF' : '#6B6157', textShadow: ok ? '0 1px 2px rgba(0,0,0,.6)' : 'none', pointerEvents: 'none' }}>{ok ? 'แผนที่จากเกม · เลื่อนซ้ายขวาได้ · แตะหมุดเพื่อเลือก' : 'ยังไม่มีรูปแผนที่ · เลือกสถานที่จากป้ายด้านล่าง'}</span>
      <button onClick={() => onChange(null)} style={{ position: 'absolute', right: 8, top: 8, height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, border: 0, borderRadius: 10, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', color: '#26201A', fontSize: 12.5, fontWeight: 700 }}>ทุกสถานที่</button>
    </div>
  )
}
export function WikiFish() {
  const s = useSave()
  const now = s?.date.season ?? 'Spring'
  const [season, setSeason] = useState<Season | null>(null)
  const [spot, setSpot] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const all = useQ(() => allFish(), [])
  const cur = season ?? now
  const inSeason = all?.filter((f) => (arr(f.seasons)).some((x) => x === cur || /all/i.test(x)))
  const counts: Record<string, number> = {}
  inSeason?.forEach((f) => fishSpots(f).forEach((k) => { counts[k] = (counts[k] ?? 0) + 1 }))
  const list = inSeason?.filter((f) => (!spot || fishSpots(f).includes(spot)) && (!q.trim() || `${f.name_en} ${f.name_th ?? ''}`.toLowerCase().includes(q.toLowerCase())))
  const spotTh = SPOTS.find((x) => x.key === spot)?.th ?? (spot === 'other' ? 'ที่อื่น' : null)
  const chipsShown = [...SPOTS.filter((x) => counts[x.key]), ...(counts.other ? [{ key: 'other', th: 'ที่อื่น (SVE ฯลฯ)' }] : [])]
  return (
    <Body>
      <TitleRow title="ปลา" />
      <SearchBox value={q} onInput={setQ} />
      <FishMap value={spot} onChange={setSpot} counts={counts} />
      <TileGrid>
        {chipsShown.map((x) => (
          <GridTile on={spot === x.key} onClick={() => setSpot(spot === x.key ? null : x.key)} icon={PIN(spot === x.key ? '#26201A' : '#4B3F8F', 16)}
            label={x.th} value={`${counts[x.key]} ชนิด`} />
        ))}
      </TileGrid>
      <SeasonTabs value={cur} onChange={setSeason} now={now} compact />
      <Head title={`${cur}${spotTh ? ` · ${spotTh}` : ''} · ${list?.length ?? 0} ชนิด`} />
      {!list ? <Loading /> : list.length === 0 ? <EmptyState title="ไม่มีปลาในเงื่อนไขนี้" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((f) => {
            const w = weatherTh(f.weather)
            const t = f.time_start == null ? null : `${hhmm(f.time_start)}–${hhmm(f.time_end)}`
            return <ListRow img={file(f.img)} en={f.name_en} th={f.name_th} sub={[t ?? 'ทั้งวัน', w && w !== 'ทุกสภาพอากาศ' ? w : null].filter(Boolean).join(' · ')} onClick={() => goWiki('item/' + f.id)} />
          })}
        </div>
      )}
    </Body>
  )
}

/* ---------- 19 · รายละเอียดปลา ---------- */
function FishDetail({ f, uses, prods, c }: { f: FishRow; uses: Awaited<ReturnType<typeof usesOf>>; prods: Awaited<ReturnType<typeof productsOf>>; c: Record<string, number> }) {
  const s = useSave()
  if (!s) return <Loading />
  const seasons = arr(f.seasons)
  const all = seasons.some((x) => /all/i.test(x))
  const inSeason = all || seasons.includes(s.date.season)
  const w = weatherTh(f.weather)
  const locs = arr(f.locations)
  const t0 = f.time_start, t1 = f.time_end
  const pct = (t: number) => (Math.min(t, 2400) / 2400) * 100
  return (
    <Body bottom={28}>
      <Back />
      <Hero img={file(f.img)} en={f.name_en} th={f.name_th} chips={<><Chip bg="#FFEBBF" icon={CUBE}>ปลา</Chip>{locs.slice(0, 2).map((l) => <Chip bg="#E6E0FB" icon={PIN()}>{SPOTS.find((x) => x.match.test(l))?.th ?? l}</Chip>)}</>} />
      <Card>
        <span style={{ fontSize: 14, fontWeight: 700 }}>ตกได้ตอนนี้ไหม <span style={{ fontWeight: 400, color: '#6B6157' }}>· {s.date.season} {s.date.day}</span></span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['ฤดู', inSeason ? s.date.season : seasons.join(', '), inSeason ? 'อยู่ในฤดูตอนนี้' : 'ไม่ใช่ฤดูนี้', inSeason], ['สภาพอากาศ', w ?? NA, w === 'ฝนตก' ? 'เฉพาะวันที่ฝนตก' : w === 'แดดออก' ? 'เฉพาะวันแดดออก' : 'ตกได้ทุกวัน', true]].map(([l, v, sub, ok]) => (
            <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: 12, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 16, background: '#FFF8E8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B6157' }}>{ok ? CHECK('#A86E0C') : null}{l as string}</span>
              <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25, color: ok ? GREEN : '#A63D2A' }}>{v as string}</span>
              <span style={{ fontSize: 12, lineHeight: 1.35, color: '#6B6157' }}>{sub as string}</span>
            </div>
          ))}
        </div>
      </Card>
      <Head title="ตกที่ไหน เมื่อไหร่" />
      <Card>
        <SeasonBar on={all ? SEASONS : seasons} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[['แดดออก', w !== 'ฝนตก'], ['ฝนตก', w !== 'แดดออก']].map(([l, on]) => on
            ? <span style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, background: BRAND160, color: '#26201A', fontSize: 14, fontWeight: 700 }}><Slot size={20} r={6} on />{l as string}</span>
            : <span style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, background: '#ECE6DC', color: '#8F8271', fontSize: 14, fontWeight: 600 }}><Slot size={20} r={6} />{l as string}</span>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 13, fontWeight: 700 }}>ช่วงเวลา</span><span style={{ fontSize: 14, fontWeight: 800 }}>{t0 == null ? NA : `${hhmm(t0)} – ${hhmm(t1)}`}</span></div>
          {t0 != null && t1 != null && (
            <>
              <div style={{ position: 'relative', height: 14, borderRadius: 7, background: '#ECE6DC' }}>
                <div style={{ position: 'absolute', left: `${pct(t0)}%`, right: `${100 - pct(t1)}%`, top: 0, bottom: 0, borderRadius: 7, background: BRAND100 }} />
              </div>
              <div style={{ position: 'relative', height: 14, fontSize: 11, color: '#6B6157' }}>
                {['00', '06', '12', '18', '24'].map((x, i) => <span style={{ position: 'absolute', left: i === 4 ? undefined : `${i * 25}%`, right: i === 4 ? 0 : undefined, transform: i && i < 4 ? 'translateX(-50%)' : undefined }}>{x}</span>)}
              </div>
              {t1 > 2400 && <span style={{ fontSize: 12, color: '#6B6157' }}>ตกได้ถึง {hhmm(t1)} ของคืนถัดไป</span>}
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>ตกได้ที่</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{locs.map((l) => <Chip bg="#E6E0FB" icon={PIN()}>{l}</Chip>)}</div>
        </div>
      </Card>
      <Head title="ราคาขาย" />
      <Card>
        <QualityPrices price={f.sell_price} c={c} />
        {prods.length > 0 && <>
          <Divider /><span style={{ fontSize: 13, fontWeight: 700 }}>แปรรูป</span>
          {prods.map((p) => { const v = applyFormula(p.price_formula, f.sell_price); return <ItemLine img={file(p.img)} en={p.name_en} th={p.name_th} right={<span style={{ flex: 'none', fontSize: 14, fontWeight: 700 }}>{v == null ? '—' : `${n(v)}g`}</span>} /> })}
        </>}
      </Card>
      <UsesCard uses={uses} />
    </Body>
  )
}

/* ---------- อาคาร: รายการ (ไม่มีบอร์ด) + 20 รายละเอียด ---------- */
export function WikiBuildings() {
  const rows = useQ(() => buildingList(), [])
  return (
    <Body>
      <TitleRow title="อาคาร" />
      {!rows ? <Loading /> : ['Robin', 'Wizard'].map((g) => (
        <>
          <Head title={g} note={g === 'Robin' ? 'ช่างไม้' : 'พ่อมด'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.filter((r) => r.builder === g).map((r) => <ListRow img={file(r.img)} en={r.name_en} th={r.name_th} sub={r.cost_gold == null ? undefined : `${n(r.cost_gold)}g`} onClick={() => goWiki('building/' + r.id)} />)}
          </div>
        </>
      ))}
    </Body>
  )
}
export function WikiBuilding({ id }: { id: string }) {
  const s = useSave(); const fd = useFarmData(); const cd = useCalcData()
  const data = useQ(() => buildingFull(id), [id])
  useEffect(() => { if (data?.b) pushRecent({ href: `#/1/building/${id}`, name_en: data.b.name_en, name_th: data.b.name_th, img: file(data.b.img), sub: `อาคาร · ${data.b.builder}` }) }, [data])
  if (!data || !s || !fd || fd instanceof Error || !cd || cd instanceof Error) return <Loading />
  const { b, mats, next } = data
  const kind = /barn/.test(id) ? 'barn' : /coop/.test(id) ? 'coop' : null
  const level = kind ? (['coop', 'barn'].includes(id) ? 1 : id.startsWith('big') ? 2 : 3) : null
  const cap = kind && level ? capacity(fd, kind, level) : null
  const owned = kind ? s.animal_housing[kind] : null
  const ownedTop = owned?.length ? Math.max(...owned) : 0
  const ownedCap = owned?.reduce<number | null>((a, l) => { const c = capacity(fd, kind!, l); return a == null || c == null ? null : a + c }, 0)
  const builtCount = kind ? null : s.buildings[id] ?? 0
  const animals = kind ? cd.animals.filter((a) => a.building.toLowerCase() === kind && a.building_level <= (level ?? 0)) : []
  const ranked = kind ? [...cd.animals.filter((a) => a.building.toLowerCase() === kind)].sort((x, y) => (y.produce_price ?? 0) / (y.produce_days ?? 1) - (x.produce_price ?? 0) / (x.produce_days ?? 1)) : []
  const prev = data.b.upgrade_from
  return (
    <Body bottom={28}>
      <Back />
      <Hero img={file(b.img)} en={b.name_en} th={b.name_th} chips={<><Chip bg="#FFEBBF" icon={CUBE}>อาคาร</Chip><Chip bg="#E6E0FB" icon={PERSON}>{b.builder}</Chip></>} />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Slot size={40} r={10} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>ในฟาร์มตอนนี้</span>
            <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{kind ? (owned?.length ? `${(kind === 'coop' ? ['Coop', 'Big Coop', 'Deluxe Coop'] : ['Barn', 'Big Barn', 'Deluxe Barn'])[ownedTop - 1]}${owned.length > 1 ? ` × ${owned.length}` : ''} · เลี้ยงได้ ${ownedCap ?? '—'} ตัว` : 'ยังไม่มี') : builtCount ? `สร้างแล้ว ${builtCount} หลัง` : 'ยังไม่มี'}</span>
          </span>
          <button onClick={() => { location.hash = kind ? '#/2/animals' : '#/2/buildings' }} style={{ flex: 'none', height: 44, padding: '0 8px', border: 0, background: 'none', color: '#A86E0C', fontSize: 14, fontWeight: 700 }}>ดูใน My Farm</button>
        </div>
      </Card>
        {kind && <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Slot size={40} r={10} />
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>แนะนำเลี้ยงใน {kind === 'coop' ? 'Coop' : 'Barn'}</span>
              <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{ranked.length ? ranked.slice(0, 3).map((a, i) => `${i + 1} ${a.name_en}`).join(' · ') : NA}</span>
            </span>
            <button onClick={() => { location.hash = '#/3/animals' }} style={{ flex: 'none', height: 44, padding: '0 8px', border: 0, background: 'none', color: '#A86E0C', fontSize: 14, fontWeight: 700 }}>ดูอันดับ</button>
          </div>
        </Card>}
      <Head title="ค่าสร้าง" note="วัตถุดิบ + เงิน" />
      <Card gap={12}>
        {mats.map((m) => <ItemLine img={file(m.img)} en={m.name_en} th={m.name_th} onClick={() => goWiki('item/' + m.id)} right={<span style={{ flex: 'none', fontSize: 15, fontWeight: 800 }}>×{n(m.qty)}</span>} />)}
        {mats.length > 0 && <Divider />}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 700 }}>เงินตอนสร้าง</span><span style={{ fontSize: 18, fontWeight: 800 }}>{b.cost_gold == null ? NA : `${n(b.cost_gold)}g`}</span></div>
        <span style={{ fontSize: 12.5, color: '#6B6157' }}>เงินเป็นยอดที่ต้องมี ไม่เป็นงานรวบรวม</span>
      </Card>
      <Head title="ข้อมูลอาคาร" />
      <Card>
        <div style={{ display: 'flex', gap: 8 }}>
          <Stat label="ใช้เวลาสร้าง" value={b.build_days == null ? NA : b.build_days === 0 ? 'ทันที' : `${b.build_days} วัน`} sub={`${b.builder} สร้างให้`} />
          <Stat label="จุสัตว์" value={cap == null ? (kind ? NA : '—') : `${cap} ตัว`} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Stat label="ขนาดพื้นที่" value={b.size_w && b.size_h ? `${b.size_w}×${b.size_h}` : NA} sub="ช่อง" />
          <Stat label="ต้องมีก่อน" value={prev ? (prev.replace(/_/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase())) : 'ไม่มี'} sub={prev ? 'อัปเกรดจากหลังนี้' : 'สร้างได้เลย'} />
        </div>
      </Card>
      {next.length > 0 && <>
        <Head title="อัปเกรดต่อไป" />
        {next.map((x) => (
          <Card>
            <button onClick={() => goWiki('building/' + x.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 0, border: 0, background: 'none', color: '#26201A', textAlign: 'left' }}>
              <Slot size={40} r={10} file={file(x.img)} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{x.name_en}</span>
                <span style={{ fontSize: 13, lineHeight: 1.3, color: '#6B6157' }}>{x.name_th ?? 'ชื่อไทย'}</span>
              </span>
              <Chip bg="#ECE6DC" icon={CUBE}>ต้องมี {b.name_en}</Chip>
            </button>
            <span style={{ fontSize: 13, color: '#6B6157' }}>{[x.mats, x.cost_gold == null ? null : `${n(x.cost_gold)}g`].filter(Boolean).join(' · ')}</span>
          </Card>
        ))}
      </>}
      {animals.length > 0 && <>
        <Head title="สัตว์ที่อยู่ได้" />
        <Card gap={12}>{animals.map((a) => <ItemLine img={a.img} en={a.name_en} th={a.name_th} right={null} />)}</Card>
      </>}
    </Body>
  )
}

/* ---------- NPC: รายการ (ไม่มีบอร์ด) + 21 รายละเอียด ---------- */
export function WikiNpcs() {
  const rows = useQ(() => npcList(), [])
  const [q, setQ] = useState('')
  const list = rows?.filter((r) => !q.trim() || `${r.name_en} ${r.name_th ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Body>
      <TitleRow title="NPC" />
      <SearchBox value={q} onInput={setQ} />
      {!list ? <Loading /> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((r) => <ListRow img={file(r.img)} en={r.name_en} th={r.name_th} sub={r.birthday_season ? `วันเกิด ${r.birthday_season} ${r.birthday_day}` : 'วันเกิด: ยังไม่มีข้อมูล'} onClick={() => goWiki('npc/' + r.id)} />)}
      </div>}
    </Body>
  )
}
const TASTES: [string, string][] = [['love', 'ชอบมาก'], ['like', 'ชอบ'], ['neutral', 'เฉย ๆ'], ['dislike', 'ไม่ชอบ'], ['hate', 'เกลียด']]
export function WikiNpc({ id }: { id: string }) {
  const s = useSave()
  const data = useQ(() => npcFull(id), [id])
  const [taste, setTaste] = useState('love')
  const [day, setDay] = useState<'normal' | 'rain' | 'other'>('normal')
  useEffect(() => { if (data?.n) pushRecent({ href: `#/1/npc/${id}`, name_en: data.n.name_en, name_th: data.n.name_th, img: file(data.n.img), sub: `NPC${data.n.birthday_season ? ` · วันเกิด ${data.n.birthday_season} ${data.n.birthday_day}` : ''}` }) }, [data])
  if (!data || !s) return <Loading />
  const { n: npc, gifts, sched, pts } = data
  let until: number | null = null
  if (npc.birthday_season && npc.birthday_day) {
    const t = dayIndex(s.date)
    let bd = dayIndex({ season: npc.birthday_season, day: npc.birthday_day, year: s.date.year })
    if (bd < t) bd += 112
    until = bd - t
  }
  const rows = sched?.filter((r) => r.day_kind === day && (r.season == null || r.season === s.date.season)) ?? []
  const shown = rows.length ? rows : sched?.filter((r) => r.day_kind === day && r.season == null) ?? []
  const list = gifts.filter((g) => g.taste === taste)
  const Seg = ({ items, value, onPick }: { items: [string, string][]; value: string; onPick: (k: string) => void }) => (
    <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 26, background: '#F4F1EB' }}>
      {items.map(([k, l]) => { const on = k === value; return (
        <button role="tab" aria-selected={on} onClick={() => onPick(k)} style={{ flex: 1, height: 44, padding: '0 4px', border: 0, borderRadius: 22, fontSize: 13, whiteSpace: 'nowrap', ...(on ? { background: BRAND100, boxShadow: '0 2px 0 #D9961E', color: '#26201A', fontWeight: 700 } : { background: 'transparent', color: '#6B6157', fontWeight: 600 }) }}>{l}</button>
      ) })}
    </div>
  )
  return (
    <Body bottom={28}>
      <Back />
      <Hero img={file(npc.img)} en={npc.name_en} th={npc.name_th} chips={<><Chip bg="#FFEBBF" icon={CUBE}>NPC</Chip>{npc.marriageable ? <Chip bg="#F7D9D3" icon={PERSON}>แต่งงานได้</Chip> : null}</>} />
      <Head title="ข้อมูล" />
      <Card>
        <div style={{ display: 'flex', gap: 8 }}>
          <Stat label="วันเกิด" value={npc.birthday_season ? `${npc.birthday_season} ${npc.birthday_day}` : NA} sub={until == null ? undefined : until === 0 ? 'วันนี้' : `อีก ${until} วัน`} />
          <Stat label="แต่งงาน" value={npc.marriageable ? 'ได้' : 'ไม่ได้'} sub={npc.marriageable ? 'ต้องมี Bouquet' : undefined} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, boxSizing: 'border-box', padding: 12, borderRadius: 16, background: '#FAF6EE' }}>
          <span style={{ fontSize: 12, color: '#6B6157' }}>บ้านอยู่ที่</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{npc.home ? <Chip bg="#E6E0FB" icon={PIN()}>{npc.home}</Chip> : <span style={{ fontSize: 13, color: '#6B6157' }}>{NA}</span>}</div>
        </div>
      </Card>
      <Head title="ตารางประจำวัน" note="อยู่ที่ไหน ทำอะไร" />
      <Card>
        <Seg items={[['normal', 'วันปกติ'], ['rain', 'วันฝนตก'], ['other', 'วันหยุด']]} value={day} onPick={(k) => setDay(k as typeof day)} />
        {!sched?.length ? <span style={{ fontSize: 13, color: '#6B6157' }}>ยังไม่มีข้อมูลตารางของ {npc.name_en}</span> : !shown.length ? <span style={{ fontSize: 13, color: '#6B6157' }}>{day === 'other' ? 'ยังไม่มีข้อมูลตารางวันหยุด' : 'ไม่มีตารางแยกสำหรับวันนี้'}</span> : (
          <>
            <span style={{ fontSize: 12, lineHeight: 1.45, color: '#6B6157' }}>ฤดู {s.date.season} · ตารางจริงเปลี่ยนตามฤดู วัน และระดับหัวใจ</span>
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 4 }}>
              {shown.map((r, i) => (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: 14, position: 'relative' }}>
                  <span style={{ flex: 'none', width: 44, fontSize: 14, fontWeight: 800, lineHeight: 1.5 }}>{hhmm(r.time)}</span>
                  <span style={{ flex: 'none', position: 'relative', width: 12, alignSelf: 'stretch' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 7, width: 12, height: 12, borderRadius: '50%', background: BRAND160 }} />
                    {i < shown.length - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 5, top: 21, bottom: -14, width: 2, background: '#E8D9B5' }} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{r.location_th ?? r.location}</span>
                    {(r.note_th ?? r.note) && <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{r.note_th ?? r.note}</span>}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
      <Head title="ของขวัญ" note="แตะของเพื่อดูรายละเอียด" />
      <Card gap={12}>
        <TileGrid>
          {TASTES.map(([k, l]) => {
            const p = pts[`gift_points_${k}`], per = pts.friendship_points_per_heart
            const h = p == null || !per ? null : p / per
            const hs = h == null ? NA : `${h > 0 ? '+' : h < 0 ? '−' : ''}${Math.abs(h).toFixed(2).replace(/\.?0+$/, '')} ♥`
            return <GridTile on={taste === k} onClick={() => setTaste(k)} label={`${l} · ${gifts.filter((g) => g.taste === k).length}`} value={hs} valueColor={h != null && h < 0 ? '#A63D2A' : '#3F5510'} />
          })}
        </TileGrid>
        {pts.friendship_points_per_heart && <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.5 }}>หัวใจ 1 ดวง = {pts.friendship_points_per_heart} แต้ม · ชอบมาก +{pts.gift_points_love} แต้ม{pts.gift_birthday_mult ? ` · ให้ในวันเกิดได้ ×${pts.gift_birthday_mult}` : ''}</span>}
        {list.length === 0 ? <span style={{ fontSize: 13, color: '#6B6157' }}>{NA}</span> : list.map((g) => <ItemLine img={file(g.img)} en={g.name_en} th={g.name_th} onClick={() => goWiki('item/' + g.id)} right={I.chev()} />)}
      </Card>
    </Body>
  )
}
export { card }
