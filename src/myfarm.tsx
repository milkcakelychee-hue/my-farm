// แท็บ My Farm — บอร์ด 22 MyFarm · 22b MyFarmEditPlot · 22c AnimalHousing · 23 Greenhouse · 30 MyFarmIsland · 31 MyFarmBuildings
// ค่าทุกตัวมาจากเซฟของผู้ใช้หรือฐานข้อมูลเกม · ค่าที่ฐานข้อมูลไม่มีแสดง "ยังไม่มีข้อมูล"
import type { ComponentChildren, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { updateSave, useSave } from './data/useSave'
import {
  HOUSE_NAMES, SPRINKLER_ITEM, applyFormula, capacity, dayIndex, fmtDate, fromIndex, harvests, reach, useFarmData, SEASONS,
  type FarmData,
} from './data/farmdata'
import type { HouseLevel, Plot, SaveData, Season, SprinklerKind } from './data/save'
import { ConfirmDelete, EmptyState, Skeleton } from './ui'

type S = JSX.CSSProperties
const BRAND160 = 'linear-gradient(160deg,#FFD25E 0%,#FDB927 55%,#F7A441 100%)'
const BRAND100 = 'linear-gradient(100deg,#FFD25E 0%,#FDB927 50%,#F7A441 100%)'
const COL = { flower: '#E985A6', once: '#FDB927', regrow: '#C5D68F' }
const NA = 'ยังไม่มีข้อมูล'
const n = (v: number) => v.toLocaleString('en-US')
export const go = (sub?: string) => { location.hash = `#/2${sub ? '/' + sub : ''}` }

/* ---------- ชิ้นส่วนที่ใช้ซ้ำ (ค่าจากบอร์ด) ---------- */
const P = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } as const
const I = {
  chev: (s = 18) => <svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" stroke="#26201A" stroke-width="2.6" {...P}><path d="M9 6l6 6-6 6" /></svg>,
  down: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" stroke="#26201A" stroke-width="2.6" {...P}><path d="M6 9l6 6 6-6" /></svg>,
  back: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" stroke="#26201A" stroke-width="2.6" {...P}><path d="M15 6l-6 6 6 6" /></svg>,
  plus: (s = 18, c = '#A86E0C', w = 2.8) => <svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" stroke={c} stroke-width={w} {...P}><path d="M12 5v14M5 12h14" /></svg>,
  minus: (s = 18) => <svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" stroke="#26201A" stroke-width="2.8" {...P}><path d="M5 12h14" /></svg>,
  edit: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" stroke="#26201A" stroke-width="2.2" {...P}><path d="M4 20l1-4L16.500 4.500a2.100 2.100 0 013 3L8 19z" /><path d="M14 7l3 3" /></svg>,
  trash: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" stroke="#26201A" stroke-width="2.2" {...P}><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>,
  pin: <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" stroke="#4B3F8F" stroke-width="2.4" {...P}><path d="M12 21s7-6.200 7-11.500A7 7 0 005 9.500C5 14.800 12 21 12 21z" /><circle cx="12" cy="9.500" r="2.500" /></svg>,
}

/** ช่องไอคอน: ใช้รูปจากฐานข้อมูลถ้ามี ไม่มีก็เป็นกรอบเส้นประตามบอร์ด */
function Slot({ size, r, file, on }: { size: number; r: number; file?: string; on?: boolean }) {
  if (file) return <img src={`${import.meta.env.BASE_URL}img/${file}`} alt="" width={size} height={size} style={{ flex: 'none', imageRendering: 'pixelated', objectFit: 'contain' }} />
  return <span aria-hidden="true" style={{ flex: 'none', width: size, height: size, boxSizing: 'border-box', borderRadius: r, border: on ? '2px dashed rgba(255,255,255,.75)' : '2px dashed #CDBEA6', background: on ? 'rgba(255,255,255,.22)' : '#F6F0E4' }} />
}

function Body({ children, bottom = 20 }: { children: ComponentChildren; bottom?: number }) {
  return <div style={{ padding: `52px 16px ${bottom}px`, display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
}
function Head({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 12, color: '#6B6157', textAlign: 'right' }}>{note}</span>
    </div>
  )
}
const card: S = { display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)' }
const Card = ({ children, gap = 10, style }: { children: ComponentChildren; gap?: number; style?: S }) => <div style={{ ...card, gap, ...style }}>{children}</div>
const Divider = () => <div style={{ height: 1, background: '#ECE6DC' }} />
function SubHeader({ title, sub, back = '' }: { title: string; sub?: string; back?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button aria-label="กลับ" onClick={() => go(back)} style={{ flex: 'none', width: 44, height: 44, padding: 0, border: 0, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.back}</button>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{title}</h1>
        {sub && <span style={{ fontSize: 13, color: '#6B6157' }}>{sub}</span>}
      </div>
    </div>
  )
}
function Info({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 16, background: '#FFF8E0', boxShadow: 'inset 0 0 0 1.5px #F0DFB4' }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 12.5, lineHeight: 1.55, color: '#4F463D' }}>{children}</span>
    </div>
  )
}
function DashedAdd({ children, onClick }: { children: ComponentChildren; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 0, borderRadius: 20, background: 'transparent', boxShadow: 'inset 0 0 0 2px #CDBEA6', color: '#A86E0C', fontSize: 15, fontWeight: 700 }}>
      {I.plus()}{children}
    </button>
  )
}
/** ตัวนับ: ขนาด 44 (หน้า My Farm/อาคาร) หรือ 48 (หน้าแก้แปลง/เรือนกระจก) */
function Count({ value, onChange, min = 0, max, big, font }: { value: number; onChange: (v: number) => void; min?: number; max?: number; big?: boolean; font?: number }) {
  const sz = big ? 48 : 44
  const b: S = { width: sz, height: sz, padding: 0, border: 0, borderRadius: big ? 14 : 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const set = (v: number) => onChange(Math.max(min, max == null ? v : Math.min(max, v)))
  return (
    <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: big ? 8 : 4 }}>
      <button aria-label="ลด" onClick={() => set(value - 1)} style={{ ...b, background: '#F4F1EB' }}>{I.minus(big ? 20 : 18)}</button>
      <span style={{ minWidth: big ? 44 : 36, textAlign: 'center', fontSize: font ?? 20, fontWeight: 800 }}>{value}</span>
      <button aria-label="เพิ่ม" onClick={() => set(value + 1)} style={{ ...b, background: BRAND160 }}>{I.plus(big ? 20 : 18, '#26201A')}</button>
    </div>
  )
}
/** ทายล์เลือก (สูง 84 · ไอคอน 32) */
function Pick({ label, on, onClick, file, h = 84, icon = 32, sub, iconR = 8 }: { label: string; on?: boolean; onClick?: () => void; file?: string; h?: number; icon?: number; sub?: string; iconR?: number }) {
  return (
    <button aria-pressed={!!on} onClick={onClick} style={{
      flex: 1, minWidth: 0, height: h, boxSizing: 'border-box', padding: sub ? '6px 2px' : '8px 4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sub ? 2 : 5, border: 0, borderRadius: 14, color: '#26201A',
      ...(on ? { background: BRAND160, boxShadow: '0 3px 8px rgba(247,164,65,.3)', fontWeight: 700 } : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5', fontWeight: 600 }),
    }}>
      {icon > 0 && <Slot size={icon} r={iconR} file={file} on={on} />}
      <span style={{ fontSize: 12.5, lineHeight: 1.2, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
      {sub && <span style={{ fontSize: 11.5, lineHeight: 1.2, fontWeight: 500, color: on ? '#26201A' : '#6B6157', whiteSpace: 'nowrap' }}>{sub}</span>}
    </button>
  )
}
function Bar({ split, total, h = 14 }: { split: Plot['split']; total: number; h?: number }) {
  const free = Math.max(0, total - split.flower - split.once - split.regrow)
  return (
    <div style={{ display: 'flex', gap: 2, height: h, borderRadius: 7, overflow: 'hidden', background: '#ECE6DC' }}>
      {split.flower > 0 && <span style={{ flex: split.flower, background: COL.flower, minWidth: 0 }} />}
      {split.once > 0 && <span style={{ flex: split.once, background: COL.once, minWidth: 0 }} />}
      {split.regrow > 0 && <span style={{ flex: split.regrow, background: COL.regrow, minWidth: 0 }} />}
      {free > 0 && <span style={{ flex: free, background: '#ECE6DC', minWidth: 0 }} />}
    </div>
  )
}
function Legend({ split }: { split: Plot['split'] }) {
  const items: [string, string, number][] = [[COL.flower, 'ไม้ดอก', split.flower], [COL.once, 'โตครั้งเดียว', split.once], [COL.regrow, 'เก็บซ้ำได้', split.regrow]]
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#4F463D' }}>
      {items.filter((x) => x[2] > 0).map(([c, l, v]) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span aria-hidden="true" style={{ flex: 'none', width: 10, height: 10, borderRadius: 3, background: c }} />{l} {v}</span>
      ))}
    </div>
  )
}
function Overlay({ children }: { children: ComponentChildren }) {
  return <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', padding: 16, background: 'rgba(38,32,26,.35)' }}><div style={{ flex: 1 }}>{children}</div></div>
}
function StageNote({ onClose, what }: { onClose: () => void; what: string }) {
  return <Overlay><ConfirmDelete title={`${what} ทำในขั้น 3`} body="หน้านี้อยู่ในขั้นถัดไป ตอนนี้ยังเปิดไม่ได้" onCancel={onClose} onConfirm={onClose} confirmLabel="ตกลง" /></Overlay>
}

const plotSub = (d: FarmData, p: Plot) => {
  if (p.sprinkler.kind === 'custom') return `กำหนดเอง · ${p.tiles} ช่อง`
  const r = reach(d, p.sprinkler.kind, p.sprinkler.nozzle)
  const nm = SPRINKLER_ITEM[p.sprinkler.kind].name + (p.sprinkler.nozzle ? ' + Nozzle' : '')
  return `${nm} × ${p.sprinkler.count} · รด ${r == null ? NA : p.tiles + ' ช่อง'}`
}
const sum = (ps: Plot[]) => ps.reduce((a, p) => ({ tiles: a.tiles + p.tiles, flower: a.flower + p.split.flower, once: a.once + p.split.once, regrow: a.regrow + p.split.regrow }), { tiles: 0, flower: 0, once: 0, regrow: 0 })

function useAll() {
  const s = useSave(); const d = useFarmData()
  if (d instanceof Error) throw d
  return s && d ? { s, d } : null
}
const Loading = () => <Body><Skeleton /><Skeleton /></Body>
/** เปิดฐานข้อมูลไม่ได้ → สถานะว่างของบอร์ด 34 แทนการโหลดค้าง */
export function FarmError({ e }: { e: Error }) {
  return <Body><EmptyState title="เปิดฐานข้อมูลไม่ได้" body={e.message} /></Body>
}

/* ---------- หัวหน้า My Farm (ร่วมกันระหว่างฟาร์มหลักกับเกาะ) ---------- */
function FarmTitle({ s, onSave }: { s: SaveData; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.3 }}>My Farm</h1>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: '#6B6157' }}>{s.date.season} · ปี {s.date.year} · วันที่ {s.date.day}</span>
      </div>
      <button onClick={onSave} style={{ flex: 'none', height: 44, padding: '0 12px 0 14px', display: 'flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 14, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', color: '#26201A', fontSize: 14, fontWeight: 700 }}>{s.name}{I.down}</button>
    </div>
  )
}
function Summary({ title, plots, labels }: { title: string; plots: Plot[]; labels: [keyof Plot['split'], string][] }) {
  const t = sum(plots)
  return (
    <div style={{ ...card, background: BRAND160, boxShadow: '0 3px 10px rgba(247,164,65,.28)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span><span style={{ fontSize: 12 }}>{plots.length} แปลง</span>
      </div>
      <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{n(t.tiles)} ช่อง</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {labels.map(([k, l]) => (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 2px', borderRadius: 14, background: 'rgba(255,255,255,.4)' }}>
            <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{t[k]}</span><span style={{ fontSize: 12, lineHeight: 1.3 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
function PlotCard({ d, p }: { d: FarmData; p: Plot }) {
  const file = p.sprinkler.kind === 'custom' ? undefined : d.img[SPRINKLER_ITEM[p.sprinkler.kind].item]
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Slot size={44} r={12} file={file} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{p.name}</span>
          <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{plotSub(d, p)}</span>
        </span>
        <button aria-label="แก้แปลง" onClick={() => go('plot/' + p.id)} style={{ flex: 'none', width: 44, height: 44, padding: 0, border: 0, borderRadius: 12, background: '#F4F1EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.edit}</button>
      </div>
      <Bar split={p.split} total={p.tiles} />
      <Legend split={p.split} />
    </Card>
  )
}
function newPlot(loc: Plot['location']) {
  const id = crypto.randomUUID()
  updateSave((s) => ({ ...s, plots: [...s.plots, { id, name: '', location: loc, sprinkler: { kind: 'quality', count: 0, nozzle: false }, tiles: 0, split: { flower: 0, once: 0, regrow: 0 } }] }))
  go('plot/' + id)
}

/* ---------- 22 · หน้าหลัก My Farm ---------- */
export function MyFarm() {
  const a = useAll()
  const [note, setNote] = useState<string | null>(null)
  if (!a) return <Loading />
  const { s, d } = a
  const plots = s.plots.filter((p) => p.location === 'farm')
  const t = sum(plots)
  const g = s.greenhouse
  const anc = d.ancient
  const next = g.planted && anc ? harvests(g.planted, s.date, anc.growth_days, anc.regrow_days, 1)[0] : undefined
  const left = next == null ? null : next - dayIndex(s.date)
  const need = anc ? g.plants * anc.min_harvest * (d.wine?.input_qty ?? 1) : null
  const short = need == null ? null : Math.max(0, need - s.machines.keg)
  const setM = (k: 'keg' | 'preserves_jar', v: number) => updateSave((x) => ({ ...x, machines: { ...x.machines, [k]: v } }))
  const house = (k: 'coop' | 'barn') => {
    const ls = s.animal_housing[k]
    const top = ls.length ? Math.max(...ls) : 0
    const cap = ls.reduce<number | null>((acc, l) => { const c = capacity(d, k, l); return acc == null || c == null ? null : acc + c }, 0)
    return { title: ls.length ? `${HOUSE_NAMES[k][0]} × ${ls.length} · ${HOUSE_NAMES[k][top - 1]}` : `${HOUSE_NAMES[k][0]} · ยังไม่มี`, sub: ls.length ? (cap == null ? NA : `เลี้ยงได้ ${cap} ตัว`) : 'แตะเพื่อเพิ่ม' }
  }
  return (
    <Body>
      <FarmTitle s={s} onSave={() => setNote('สลับเซฟ')} />
      <Summary title="ช่องปลูกทั้งฟาร์ม" plots={plots} labels={[['flower', 'ไม้ดอก'], ['once', 'โตครั้งเดียว'], ['regrow', 'เก็บซ้ำ']]} />
      <button onClick={() => setNote('วางแผนซื้อเมล็ด')} style={{ width: '100%', boxSizing: 'border-box', padding: 12, display: 'flex', alignItems: 'center', gap: 12, border: 0, borderRadius: 20, background: '#FFFFFF', boxShadow: 'inset 0 0 0 2px #FDB927', color: '#26201A', textAlign: 'left' }}>
        <Slot size={44} r={12} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>วางแผนซื้อเมล็ด · {s.date.season}</span>
          <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>จากช่อง {n(t.tiles)} ช่อง ต้องซื้อกี่ถุง เท่าไหร่</span>
        </span>
        {I.chev()}
      </button>
      <Head title="สถานที่" note="เรือนกระจกอยู่ในฟาร์มหลัก" />
      <Locations s={s} here="farm" />
      <Head title="แปลงในฟาร์มหลัก" note="จดแค่จำนวนช่อง ไม่ต้องจดว่าปลูกอะไร" />
      {plots.map((p) => <PlotCard d={d} p={p} />)}
      <DashedAdd onClick={() => newPlot('farm')}>เพิ่มแปลงใหม่</DashedAdd>
      <Head title="สถานะฟาร์ม" note="เรือนกระจก · เครื่องแปรรูป" />
      <button onClick={() => go('greenhouse')} style={{ width: '100%', boxSizing: 'border-box', padding: 12, display: 'flex', alignItems: 'center', gap: 12, border: 0, borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', color: '#26201A', textAlign: 'left' }}>
        <Slot size={44} r={12} file={d.img.ancient_fruit} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{anc?.name_en ?? 'Ancient Fruit'} · {g.plants} ต้น</span>
          <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>
            {!g.planted ? 'ยังไม่ได้ตั้งวันที่ปลูก' : left == null ? NA : left === 0 ? `เก็บวันนี้ · ${fmtDate(fromIndex(next!))}` : `เก็บอีก ${left} วัน · ${fmtDate(fromIndex(next!))}`}
          </span>
        </span>
        {I.chev()}
      </button>
      <Card>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>เครื่องแปรรูปที่มี</span><span style={{ fontSize: 12, color: '#6B6157' }}>กด − + ตั้งจำนวน</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Slot size={40} r={10} file={d.img.keg} />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>Keg</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.35, color: short ? '#A63D2A' : '#6B6157' }}>
              {need == null ? NA : short ? `ต้องมี ${need} · ขาด ${short}` : need ? `ต้องมี ${need} · พอแล้ว` : 'ใช้ทำไวน์ และน้ำผลไม้'}
            </span>
          </span>
          <Count value={s.machines.keg} onChange={(v) => setM('keg', v)} />
        </div>
        <Divider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Slot size={40} r={10} file={d.img.preserves_jar} />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>Preserves Jar</span>
            <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.35 }}>ใช้ทำแยม และผักดอง</span>
          </span>
          <Count value={s.machines.preserves_jar} onChange={(v) => setM('preserves_jar', v)} />
        </div>
      </Card>
      <Head title="คอกสัตว์" note="ตั้งครั้งเดียว · ไม่ต้องจดว่ามีสัตว์กี่ตัว" />
      <Card>
        {(['coop', 'barn'] as const).map((k, i) => {
          const h = house(k)
          return (
            <>
              {i > 0 && <Divider />}
              <button onClick={() => go('animals')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 0, border: 0, background: 'none', color: '#26201A', textAlign: 'left' }}>
                <Slot size={44} r={12} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{h.title}</span>
                  <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{h.sub}</span>
                </span>
                {I.chev()}
              </button>
            </>
          )
        })}
      </Card>
      <Head title="อื่น ๆ" note="ระดับ·อาชีพใช้ในการคำนวณ" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Pick label="อาคาร" onClick={() => go('buildings')} />
        <Pick label="ระดับ·อาชีพ" onClick={() => setNote('ระดับ·อาชีพ')} />
      </div>
      {note && <StageNote what={note} onClose={() => setNote(null)} />}
    </Body>
  )
}

function Locations({ s, here }: { s: SaveData; here: 'farm' | 'island' }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Pick label="ฟาร์มหลัก" on={here === 'farm'} onClick={() => go()} />
      {s.ginger_island
        ? <Pick label="Ginger Island" on={here === 'island'} onClick={() => go('island')} />
        : (
          <button onClick={() => { updateSave((x) => ({ ...x, ginger_island: true })); go('island') }} style={{ flex: 1, minWidth: 0, height: 84, boxSizing: 'border-box', padding: '8px 4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, border: 0, borderRadius: 14, background: 'transparent', boxShadow: 'inset 0 0 0 2px #CDBEA6', color: '#A86E0C', fontWeight: 700 }}>
            {I.plus(24)}<span style={{ fontSize: 12.5, lineHeight: 1.2, whiteSpace: 'nowrap' }}>เพิ่ม Ginger Island</span>
          </button>
        )}
    </div>
  )
}

/* ---------- 30 · Ginger Island ---------- */
export function MyFarmIsland() {
  const a = useAll()
  const [ask, setAsk] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  if (!a) return <Loading />
  const { s, d } = a
  const plots = s.plots.filter((p) => p.location === 'ginger_island')
  return (
    <Body>
      <FarmTitle s={s} onSave={() => setNote('สลับเซฟ')} />
      <Head title="สถานที่" />
      <Locations s={s} here="island" />
      <Summary title="ช่องปลูกที่ Ginger Island" plots={plots} labels={[['once', 'โตครั้งเดียว'], ['regrow', 'เก็บซ้ำ']]} />
      <Head title="แปลงที่ Ginger Island" note="จดแค่จำนวนช่อง" />
      {plots.map((p) => <PlotCard d={d} p={p} />)}
      <DashedAdd onClick={() => newPlot('ginger_island')}>เพิ่มแปลงใหม่</DashedAdd>
      <Info title="เกาะต่างจากฟาร์มหลักยังไง">ที่เกาะปลูกได้ทุกฤดู ไม่มีฤดูให้กังวล · ซื้อเมล็ดที่ Island Trader ไม่ใช่ Pierre · แนะนำปลูกจะแยกคำนวณให้ตามช่องของเกาะ</Info>
      <button onClick={() => setAsk(true)} style={{ width: '100%', height: 48, border: 0, borderRadius: 16, background: '#F9DDD6', color: '#A63D2A', fontSize: 14, fontWeight: 700 }}>เอา Ginger Island ออก</button>
      {ask && (
        <Overlay>
          <ConfirmDelete title="เอา Ginger Island ออก?" body={plots.length ? `แปลงที่เกาะ ${plots.length} แปลงจะถูกลบด้วย` : 'เพิ่มกลับได้ทุกเมื่อ'} onCancel={() => setAsk(false)}
            onConfirm={() => { updateSave((x) => ({ ...x, ginger_island: false, plots: x.plots.filter((p) => p.location !== 'ginger_island') })); go() }} confirmLabel="เอาออก" />
        </Overlay>
      )}
      {note && <StageNote what={note} onClose={() => setNote(null)} />}
    </Body>
  )
}

/* ---------- 22b · แก้แปลง ---------- */
export function EditPlot({ id }: { id: string }) {
  const a = useAll()
  const [draft, setDraft] = useState<Plot | null>(null)
  const [ask, setAsk] = useState(false)
  if (!a) return <Loading />
  const { s, d } = a
  const orig = s.plots.find((p) => p.id === id)
  if (!orig) { go(); return null }
  const p = draft ?? orig
  const isNew = !orig.name
  const back = p.location === 'ginger_island' ? 'island' : ''
  const set = (f: (p: Plot) => Plot) => setDraft(f(p))
  const r = reach(d, p.sprinkler.kind, p.sprinkler.nozzle)
  const watered = r == null ? null : r * p.sprinkler.count
  const used = p.split.flower + p.split.once + p.split.regrow
  // เปลี่ยนชนิด/จำนวน → ช่องปลูกได้จริงตั้งใหม่ตามที่รดได้ และตัดส่วนที่แบ่งเกินออก
  const setSprinkler = (sp: Plot['sprinkler']) => {
    const rr = reach(d, sp.kind, sp.nozzle)
    const tiles = rr == null ? p.tiles : rr * sp.count
    setDraft(fit({ ...p, sprinkler: sp, tiles }))
  }
  const fit = (q: Plot): Plot => {
    let over = q.split.flower + q.split.once + q.split.regrow - q.tiles
    const sp = { ...q.split }
    for (const k of ['regrow', 'once', 'flower'] as const) { const cut = Math.min(over, sp[k]); if (cut > 0) { sp[k] -= cut; over -= cut } }
    return { ...q, split: sp }
  }
  const kinds: [SprinklerKind, string, string][] = [
    ...(Object.keys(SPRINKLER_ITEM) as Exclude<SprinklerKind, 'custom'>[]).map((k): [SprinklerKind, string, string] => {
      const v = reach(d, k, p.sprinkler.nozzle)
      return [k, SPRINKLER_ITEM[k].short, v == null ? NA : `รด ${v} ช่อง`]
    }),
    ['custom', 'กำหนดเอง', 'ใส่เอง'],
  ]
  const row = (key: keyof Plot['split'], label: string, hint: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span aria-hidden="true" style={{ flex: 'none', width: 10, height: 10, borderRadius: 3, background: COL[key] }} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{label}</span>
        <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.3 }}>{hint}</span>
      </span>
      <Count big value={p.split[key]} max={p.split[key] + (p.tiles - used)} onChange={(v) => set((q) => ({ ...q, split: { ...q.split, [key]: v } }))} />
    </div>
  )
  const save = () => { const name = p.name.trim() || `แปลง ${s.plots.filter((q) => q.location === p.location).indexOf(orig) + 1}`; updateSave((x) => ({ ...x, plots: x.plots.map((q) => (q.id === id ? { ...p, name } : q)) })); go(back) }
  const cancel = () => { if (isNew) updateSave((x) => ({ ...x, plots: x.plots.filter((q) => q.id !== id) })); go(back) }
  const field: S = { display: 'flex', alignItems: 'center', gap: 8, height: 52, boxSizing: 'border-box', padding: '0 16px', borderRadius: 14, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5', fontSize: 16, fontWeight: 600 }
  const locLabel = p.location === 'farm' ? 'ฟาร์มหลัก' : 'Ginger Island'
  return (
    <Body bottom={24}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label="กลับ" onClick={cancel} style={{ flex: 'none', width: 44, height: 44, padding: 0, border: 0, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.back}</button>
        <h1 style={{ margin: 0, flex: 1, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{isNew ? 'เพิ่มแปลง' : 'แก้แปลง'}</h1>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#6B6157' }}>ชื่อแปลง</span>
        <input value={p.name} placeholder="เช่น หน้าบ้าน" onInput={(e) => set((q) => ({ ...q, name: (e.target as HTMLInputElement).value }))} style={{ ...field, width: '100%', border: 0, outline: 'none', color: '#26201A', fontFamily: 'inherit' }} />
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#6B6157' }}>สถานที่</span>
        <button disabled={!s.ginger_island} onClick={() => set((q) => ({ ...q, location: q.location === 'farm' ? 'ginger_island' : 'farm' }))} style={{ ...field, border: 0, color: '#26201A', width: '100%' }}>
          <span style={{ height: 28, padding: '0 10px 0 8px', display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 8, background: '#E6E0FB', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{I.pin}{locLabel}</span>
          <span style={{ flex: 1 }} />
          {s.ginger_island && I.chev()}
        </button>
      </div>
      <Head title="สปริงเกอร์ที่ใช้" note="เลือก 1 แบบ" />
      <div style={{ display: 'flex', gap: 8 }}>
        {kinds.map(([k, l, sub]) => (
          <Pick label={l} sub={sub} h={96} on={p.sprinkler.kind === k} file={k === 'custom' ? undefined : d.img[SPRINKLER_ITEM[k as 'basic'].item]}
            onClick={() => setSprinkler({ ...p.sprinkler, kind: k })} />
        ))}
      </div>
      <Card gap={12}>
        {p.sprinkler.kind !== 'custom' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>จำนวนสปริงเกอร์</span>
                <span style={{ fontSize: 12.5, color: '#6B6157' }}>{SPRINKLER_ITEM[p.sprinkler.kind].name}</span>
              </div>
              <Count big font={22} value={p.sprinkler.count} onChange={(v) => setSprinkler({ ...p.sprinkler, count: v })} />
            </div>
            <button aria-pressed={p.sprinkler.nozzle} onClick={() => setSprinkler({ ...p.sprinkler, nozzle: !p.sprinkler.nozzle })} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '0 12px', border: 0, borderRadius: 14, color: '#26201A', textAlign: 'left', ...(p.sprinkler.nozzle ? { background: BRAND160 } : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5' }) }}>
              <Slot size={28} r={7} file={d.img.pressure_nozzle} on={p.sprinkler.nozzle} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>ติด Pressure Nozzle</span>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.sprinkler.nozzle ? 'ติดแล้ว' : 'ไม่ติด'}</span>
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 16, background: '#FAF6EE' }}>
              <span style={{ fontSize: 12, color: '#6B6157' }}>รดได้รวม</span>
              <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{watered == null ? NA : `${n(watered)} ช่อง`}</span>
              <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.4 }}>{p.sprinkler.count} อัน × {r ?? '—'} ช่อง · ถ้าวางรดซ้อนกัน ช่องจริงจะน้อยกว่านี้ แก้เองได้ด้านล่าง</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>ช่องปลูกได้จริง</span>
          <Count big value={p.tiles} onChange={(v) => setDraft(fit({ ...p, tiles: v }))} />
        </div>
      </Card>
      <Head title="แบ่งช่องตามชนิดพืช" note="แผนการปลูก" />
      <Card gap={14}>
        <Bar split={p.split} total={p.tiles} h={16} />
        <span style={{ fontSize: 13, color: '#6B6157' }}>แบ่งแล้ว <b style={{ color: '#26201A' }}>{used} / {p.tiles}</b> ช่อง · {used === p.tiles ? 'ครบพอดี' : `เหลือ ${p.tiles - used} ช่อง`}</span>
        {p.location === 'farm' && row('flower', 'ไม้ดอก', 'เช่น Sunflower, Fairy Rose')}
        {row('once', 'โตครั้งเดียว', 'เก็บแล้วต้องปลูกใหม่')}
        {row('regrow', 'เก็บซ้ำได้', 'เช่น Corn, Strawberry')}
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
        <button onClick={save} style={{ width: '100%', height: 52, border: 0, borderRadius: 26, background: BRAND100, boxShadow: '0 3px 0 #D9961E', color: '#26201A', fontSize: 16, fontWeight: 800 }}>บันทึกแปลง</button>
        <button onClick={() => (isNew ? cancel() : setAsk(true))} style={{ height: 48, border: 0, background: 'none', color: '#A63D2A', fontSize: 14, fontWeight: 700 }}>{isNew ? 'ยกเลิก' : 'ลบแปลงนี้'}</button>
      </div>
      {ask && (
        <Overlay>
          <ConfirmDelete title={`ลบแปลง "${orig.name}"?`} body="ช่องปลูกของแปลงนี้จะหายจากยอดรวม ลบแล้วกู้คืนไม่ได้" onCancel={() => setAsk(false)}
            onConfirm={() => { updateSave((x) => ({ ...x, plots: x.plots.filter((q) => q.id !== id) })); go(back) }} />
        </Overlay>
      )}
    </Body>
  )
}

/* ---------- 22c · คอกสัตว์ ---------- */
export function AnimalHousing() {
  const a = useAll()
  const [del, setDel] = useState<{ k: 'coop' | 'barn'; i: number } | null>(null)
  if (!a) return <Loading />
  const { s, d } = a
  const total = (k: 'coop' | 'barn') => s.animal_housing[k].reduce<number | null>((acc, l) => { const c = capacity(d, k, l); return acc == null || c == null ? null : acc + c }, 0)
  const tc = total('coop'), tb = total('barn')
  const setL = (k: 'coop' | 'barn', f: (ls: HouseLevel[]) => HouseLevel[]) => updateSave((x) => ({ ...x, animal_housing: { ...x.animal_housing, [k]: f(x.animal_housing[k]) } }))
  const section = (k: 'coop' | 'barn', name: string, who: string) => (
    <>
      <Head title={name} note={who} />
      {s.animal_housing[k].map((lvl, i) => {
        const c = capacity(d, k, lvl)
        return (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Slot size={44} r={12} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{name} หลังที่ {i + 1}</span>
                <span style={{ fontSize: 13, color: '#6B6157' }}>{c == null ? NA : `เลี้ยงได้ ${c} ตัว`}</span>
              </span>
              <button aria-label="ลบหลังนี้" onClick={() => setDel({ k, i })} style={{ flex: 'none', width: 44, height: 44, padding: 0, border: 0, borderRadius: 12, background: '#F4F1EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.trash}</button>
            </div>
            <span style={{ fontSize: 12.5, color: '#6B6157' }}>อัปเกรดถึงขั้นไหน</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {HOUSE_NAMES[k].map((hn, j) => {
                const cc = capacity(d, k, j + 1)
                return <Pick label={hn} sub={cc == null ? NA : `${cc} ตัว`} h={78} icon={26} iconR={7} on={lvl === j + 1} onClick={() => setL(k, (ls) => ls.map((x, m) => (m === i ? ((j + 1) as HouseLevel) : x)))} />
              })}
            </div>
          </Card>
        )
      })}
      <DashedAdd onClick={() => setL(k, (ls) => [...ls, 1])}>เพิ่ม {name}</DashedAdd>
    </>
  )
  const box: S = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 2px', borderRadius: 14, background: 'rgba(255,255,255,.4)' }
  return (
    <Body>
      <SubHeader title="คอกสัตว์" sub="ตั้งครั้งเดียว" />
      <div style={{ ...card, background: BRAND160, boxShadow: '0 3px 10px rgba(247,164,65,.28)' }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>เลี้ยงได้ทั้งฟาร์ม</span>
        <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{tc == null || tb == null ? NA : `${tc + tb} ตัว`}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={box}><span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{tc ?? '—'}</span><span style={{ fontSize: 12, lineHeight: 1.3 }}>Coop (ไก่ เป็ด กระต่าย)</span></div>
          <div style={box}><span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{tb ?? '—'}</span><span style={{ fontSize: 12, lineHeight: 1.3 }}>Barn (วัว แพะ แกะ)</span></div>
        </div>
      </div>
      {section('coop', 'Coop', 'ไก่ · เป็ด · กระต่าย')}
      {section('barn', 'Barn', 'วัว · แพะ · แกะ')}
      <Info title="ใช้ทำอะไร">เลือกแค่ขั้นของแต่ละหลัง ระบบคำนวณจำนวนตัวให้ · ไม่ต้องจดว่ามีสัตว์อยู่กี่ตัว · ใช้ในหน้าแนะนำเลี้ยงสัตว์</Info>
      {del && (
        <Overlay>
          <ConfirmDelete title={`ลบ ${del.k === 'coop' ? 'Coop' : 'Barn'} หลังที่ ${del.i + 1}?`} body="ลบแค่ในแอป ไม่กระทบเกม" onCancel={() => setDel(null)}
            onConfirm={() => { setL(del.k, (ls) => ls.filter((_, m) => m !== del.i)); setDel(null) }} />
        </Overlay>
      )}
    </Body>
  )
}

/* ---------- 23 · เรือนกระจก ---------- */
export function Greenhouse() {
  const a = useAll()
  const [pick, setPick] = useState(false)
  const [added, setAdded] = useState(false)
  if (!a) return <Loading />
  const { s, d } = a
  const g = s.greenhouse, anc = d.ancient, max = d.c.greenhouse_plots ?? null
  const setG = (f: (x: SaveData['greenhouse']) => SaveData['greenhouse']) => updateSave((x) => ({ ...x, greenhouse: f(x.greenhouse) }))
  const hs = g.planted && anc ? harvests(g.planted, s.date, anc.growth_days, anc.regrow_days, 4) : []
  const left = hs.length ? hs[0] - dayIndex(s.date) : null
  const perRound = anc ? g.plants * anc.min_harvest : null
  const need = perRound == null ? null : perRound * (d.wine?.input_qty ?? 1)
  const short = need == null ? null : Math.max(0, need - s.machines.keg)
  const winePrice = applyFormula(d.wine?.price_formula ?? null, anc?.sell_price ?? null)
  const wineDays = d.wine?.time_minutes ? Math.round(d.wine.time_minutes / 60 / 24) : null
  const mats = short ? d.keg.map((m) => `${m.name_en} ${n(m.qty * short)}`).join(' · ') : ''
  const small = (label: string, v: string) => (
    <div style={{ flex: 1, minWidth: 0, padding: '8px 6px', borderRadius: 12, background: '#FAF6EE', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#6B6157' }}>{label}</div><div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
    </div>
  )
  const stat = (label: string, v: string, sub?: string, warn?: boolean) => (
    <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: 12, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 16, background: '#FAF6EE' }}>
      <span style={{ fontSize: 12, color: '#6B6157' }}>{label}</span>
      <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25, color: warn ? '#A63D2A' : '#26201A' }}>{v}</span>
      {sub && <span style={{ fontSize: 12, lineHeight: 1.35, color: '#6B6157' }}>{sub}</span>}
    </div>
  )
  const addTodo = () => {
    if (!short) return
    updateSave((x) => ({ ...x, todos: [...x.todos, { id: crypto.randomUUID(), title: `สร้าง Keg ${short} ตัว`, status: 'open', createdAt: new Date().toISOString() }] }))
    setAdded(true)
  }
  const planted = g.planted
  return (
    <Body>
      <SubHeader title="เรือนกระจก" sub="ปลูกชนิดเดียว" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Slot size={64} r={16} file={d.img.ancient_fruit} />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}>{anc?.name_en ?? 'Ancient Fruit'}</span>
          <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.4 }}>{anc ? `${anc.name_th ?? 'ชื่อไทย'} · โต ${anc.growth_days} วัน${anc.regrow_days ? ` แล้วเก็บซ้ำทุก ${anc.regrow_days} วัน` : ''} · ปลูกได้ทุกฤดู` : NA}</span>
        </span>
      </div>
      <Card>
        <span style={{ fontSize: 13, color: '#6B6157' }}>เก็บเกี่ยวครั้งต่อไป</span>
        {!planted ? <span style={{ fontSize: 15, fontWeight: 700 }}>ตั้งวันที่ปลูกด้านล่างก่อน</span> : left == null ? <span style={{ fontSize: 15, fontWeight: 700 }}>{NA}</span> : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, color: '#3F5510' }}>{left === 0 ? 'วันนี้' : `อีก ${left} วัน`}</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{fmtDate(fromIndex(hs[0]))}</span>
            </div>
            {hs.length > 1 && <div style={{ display: 'flex', gap: 8 }}>{['รอบถัดไป', 'ถัดไปอีก', 'หลังจากนั้น'].map((l, i) => hs[i + 1] != null && small(l, fmtDate(fromIndex(hs[i + 1]))))}</div>}
            <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.45 }}>นับจากวันที่ปลูก {fmtDate(planted)} · {perRound} ผลต่อรอบ</span>
          </>
        )}
      </Card>
      <Head title="ตั้งค่าเรือนกระจก" />
      <Card gap={12}>
        <button onClick={() => setPick(!pick)} style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px 10px 10px 12px', display: 'flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 14, background: '#FAF6EE', color: '#26201A', textAlign: 'left' }}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 12, color: '#6B6157' }}>วันที่ปลูก</span>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{planted ? `${fmtDate(planted)}${planted.year !== s.date.year ? ` · ปี ${planted.year}` : ''}` : 'ยังไม่ได้ตั้ง'}</span>
            <span style={{ fontSize: 12, color: '#6B6157', lineHeight: 1.3 }}>ตั้งครั้งเดียว</span>
          </span>
          {I.chev(16)}
        </button>
        {pick && <DatePick value={planted ?? s.date} onDone={(v) => { setG((x) => ({ ...x, planted: v })); setPick(false) }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>จำนวนต้น</span>
            <span style={{ fontSize: 12.5, color: '#6B6157' }}>{max == null ? NA : `ช่องโรงเรือนทั้งหมด ${max}`}</span>
          </span>
          {max != null && <button onClick={() => setG((x) => ({ ...x, plants: max }))} style={{ flex: 'none', height: 48, padding: '0 14px', border: 0, borderRadius: 14, background: 'transparent', boxShadow: 'inset 0 0 0 1.5px #FDB927', color: '#A86E0C', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>เต็ม {max}</button>}
          <Count big font={22} value={g.plants} max={max ?? undefined} onChange={(v) => setG((x) => ({ ...x, plants: v }))} />
        </div>
      </Card>
      <Head title="เตรียม Keg" note="จากต้นที่มี" />
      <Card gap={12}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>ต้องมี Keg กี่ตัว</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {stat('ต้องมี', need == null ? NA : `${need} ตัว`, d.wine ? `${d.wine.input_qty} ผล = 1 Keg` : undefined)}
          {stat('มีแล้ว', `${s.machines.keg} ตัว`, 'ตั้งที่ My Farm')}
          {stat('ต้องสร้างเพิ่ม', short == null ? NA : `${short} ตัว`, undefined, !!short)}
        </div>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: '#6B6157' }}>
          {wineDays && anc?.regrow_days ? `${d.wine!.output_name} ใช้เวลา ~${wineDays} วัน ${wineDays === anc.regrow_days ? `ตรงกับรอบเก็บ ${anc.regrow_days} วันพอดี Keg จึงว่างทันทุกรอบ` : wineDays < anc.regrow_days ? `เร็วกว่ารอบเก็บ ${anc.regrow_days} วัน Keg จึงว่างทันทุกรอบ` : `นานกว่ารอบเก็บ ${anc.regrow_days} วัน Keg จะยังไม่ว่างตอนเก็บรอบถัดไป`}` : NA}
        </span>
        {!!short && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 14, background: '#FAF6EE' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>ค่าสร้าง Keg เพิ่ม {short} ตัว</span>
              <span style={{ fontSize: 13, color: '#4F463D', lineHeight: 1.5 }}>{mats || NA}</span>
            </div>
            <button onClick={addTodo} disabled={added} style={{ flex: 'none', width: '100%', height: 52, border: 0, borderRadius: 28, background: BRAND100, boxShadow: '0 6px 16px rgba(247,164,65,.35)', color: '#26201A', fontSize: 17, fontWeight: 700, opacity: added ? 0.6 : 1 }}>
              {added ? 'เพิ่มใน to-do แล้ว' : `เพิ่มเป็น to-do สร้าง Keg ${short} ตัว`}
            </button>
          </>
        )}
      </Card>
      <Card gap={6}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#6B6157' }}>ทำเป็น {d.wine?.output_name ?? 'Wine'} ครบ {perRound ?? 0} ผล</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#3F5510' }}>{winePrice == null || perRound == null ? NA : `+${n(winePrice * perRound)}g ต่อรอบ`}</span>
        </div>
        <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.45 }}>{winePrice == null ? NA : `${perRound} × ${n(winePrice)}g (ราคา ${anc?.name_en} ${d.wine?.output_name}) · ยังไม่คิดโบนัสอาชีพ`}</span>
      </Card>
    </Body>
  )
}

/** เลือกวันที่ในเกม: ฤดู + วัน + ปี (ยังไม่มีบอร์ดของตัวเลือกนี้) */
function DatePick({ value, onDone }: { value: SaveData['date']; onDone: (v: SaveData['date']) => void }) {
  const [v, setV] = useState(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 14, background: '#FAF6EE' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {SEASONS.map((se: Season) => <Pick label={se} h={48} icon={0} on={v.season === se} onClick={() => setV({ ...v, season: se })} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 700 }}>วันที่</span><Count value={v.day} min={1} max={28} onChange={(day) => setV({ ...v, day })} /></div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 700 }}>ปี</span><Count value={v.year} min={1} onChange={(year) => setV({ ...v, year })} /></div>
      <button onClick={() => onDone(v)} style={{ height: 48, border: 0, borderRadius: 24, background: BRAND100, color: '#26201A', fontSize: 15, fontWeight: 800 }}>ใช้วันที่นี้</button>
    </div>
  )
}

/* ---------- 31 · อาคารในฟาร์ม ---------- */
export function Buildings() {
  const a = useAll()
  if (!a) return <Loading />
  const { s, d } = a
  const built = d.buildings.filter((b) => (s.buildings[b.id] ?? 0) > 0).length
  const set = (id: string, v: number) => updateSave((x) => ({ ...x, buildings: { ...x.buildings, [id]: v } }))
  const groups = [...new Set(d.buildings.map((b) => b.builder))]
  const who: Record<string, string> = { Robin: 'ช่างไม้', Wizard: 'พ่อมด' }
  return (
    <Body>
      <SubHeader title="อาคารในฟาร์ม" sub="กด − + ตั้งจำนวนที่สร้างแล้ว" />
      <Card gap={8}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#6B6157' }}>สร้างแล้ว</span><span style={{ fontSize: 12, color: '#6B6157' }}>Coop · Barn ตั้งที่คอกสัตว์</span>
        </div>
        <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{built} จาก {d.buildings.length} ชนิด</span>
        <div style={{ display: 'flex', gap: 2, height: 14, borderRadius: 7, overflow: 'hidden', background: '#ECE6DC' }}>
          {built > 0 && <span style={{ flex: built, background: '#FDB927', minWidth: 0 }} />}
          <span style={{ flex: d.buildings.length - built, background: '#ECE6DC', minWidth: 0 }} />
        </div>
      </Card>
      <Card gap={12}>
        {groups.map((gname, gi) => (
          <>
            {gi > 0 && <Divider />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{gname}</span><span style={{ fontSize: 12.5, color: '#6B6157' }}>{who[gname] ?? ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {d.buildings.filter((b) => b.builder === gname).map((b) => {
                const c = s.buildings[b.id] ?? 0
                const cost = [b.cost_gold == null ? null : `${n(b.cost_gold)}g`, ...b.materials.map((m) => `${m.name_en} ${n(m.qty)}`)].filter(Boolean).join(' · ')
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Slot size={40} r={10} />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: c ? '#26201A' : '#6B6157' }}>{b.name_en}</span>
                      <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.35 }}>{c ? (b.name_th ?? 'ชื่อไทย') : `ยังไม่มี · ${cost || NA}`}</span>
                    </span>
                    <Count value={c} onChange={(v) => set(b.id, v)} />
                  </div>
                )
              })}
            </div>
          </>
        ))}
      </Card>
      <Info title="ใช้ทำอะไร">บอกว่าอาคารไหนยังไม่มี พร้อมค่าสร้างที่เหลือ · จะเอาไปใส่เป็น to-do สร้างอาคารได้ · ค่าสร้างจากข้อมูลเกม</Info>
    </Body>
  )
}
