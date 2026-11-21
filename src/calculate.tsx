// แท็บคำนวณ — บอร์ด 27 Calculate · 24 AdvisorFresh · 25 AdvisorProcess · 24b SeedPlan · 26 AnimalAdvisor · 28 Skills
// ทุกตัวเลขมาจากฐานข้อมูลเกม + เซฟ · ตัวเลขรวมโบนัสอาชีพที่ตั้งไว้ (Blue เลือก "รวมโบนัสแล้ว + ป้ายบอก")
import type { ComponentChildren, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { updateSave, useSave } from './data/useSave'
import {
  animalRows, bestValue, profShort, bonus, daysLeft, freshPlan, groupOf, housingCap, processOptions, useCalcData, qualityFactor,
  type CalcData, type FreshRow, type Group, type Profession,
} from './data/calc'
import { useFarmData } from './data/farmdata'
import { icon } from './data/icons'
import type { SaveData, SkillName } from './data/save'
import { BRAND100, BRAND160, Body, COL, Card, Count, Divider, Head, I, Info, Loading, NA, Slot, SubHeader, card, n } from './myfarm'
import { ConfirmDelete, Skeleton } from './ui'

type S = JSX.CSSProperties
export const goCalc = (sub?: string) => { location.hash = `#/3${sub ? '/' + sub : ''}` }
const goFarm = (sub?: string) => { location.hash = `#/2${sub ? '/' + sub : ''}` }
const sg = (v: number) => `${v < 0 ? '−' : '+'}${n(Math.abs(v))}g`
const GREEN = '#3F5510'

function useAll() {
  const s = useSave(); const d = useCalcData()
  if (d instanceof Error) throw d
  return s && d ? { s, d } : null
}
const farmTiles = (s: SaveData) => {
  const ps = s.plots.filter((p) => p.location === 'farm')
  return { flower: ps.reduce((a, p) => a + p.split.flower, 0), once: ps.reduce((a, p) => a + p.split.once, 0), regrow: ps.reduce((a, p) => a + p.split.regrow, 0), total: ps.reduce((a, p) => a + p.tiles, 0), plots: ps.length }
}
const fertOf = (d: CalcData, s: SaveData) => d.fertilizers.find((f) => f.id === s.calc?.fertilizer) ?? d.fertilizers.find((f) => f.id === 'quality_fertilizer') ?? d.fertilizers[0] ?? null

/** ป้ายบอกว่าตัวเลขรวมโบนัสอาชีพหรือยัง */
function BonusTag({ d, s }: { d: CalcData; s: SaveData }) {
  const b = bonus(d, s)
  const on = b.any
  return (
    <button onClick={() => goFarm('skills')} style={{ alignSelf: 'flex-start', height: 24, padding: '0 8px', display: 'inline-flex', alignItems: 'center', border: 0, borderRadius: 7, background: on ? '#E7EFCB' : '#F9DDD6', color: on ? GREEN : '#A63D2A', fontSize: 12, fontWeight: 700 }}>
      {on ? 'รวมโบนัสอาชีพแล้ว' : 'ยังไม่รวมโบนัสอาชีพ · ตั้งค่า'}
    </button>
  )
}
const Tag = ({ bg, fg, children, h = 22 }: { bg: string; fg: string; children: ComponentChildren; h?: number }) =>
  <span style={{ flex: 'none', height: h, padding: '0 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 7, background: bg, color: fg, fontSize: h === 22 ? 11.5 : 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{children}</span>
const Rank = ({ i }: { i: number }) => <span style={{ flex: 'none', width: 28, height: 28, borderRadius: 9, background: i === 0 ? BRAND160 : '#F4F1EB', color: '#26201A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{i + 1}</span>
function Cmp({ label, value, win, sub, size = 19 }: { label: string; value: string; win?: boolean; sub?: string; size?: number }) {
  const neg = value.startsWith('−')
  return (
    <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '8px 10px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 1, ...(win ? { boxShadow: 'inset 0 0 0 2px #8FA83A', background: '#F5F9E4' } : { background: '#F6F0E4' }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: '#6B6157' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{win ? '✓ ดีกว่า' : ' '}</span>
      </div>
      <span style={{ fontSize: size, fontWeight: 800, lineHeight: 1.3, color: neg ? '#A63D2A' : win ? GREEN : '#6B6157' }}>{value}</span>
      {sub && <span style={{ fontSize: 11.5, color: '#6B6157', lineHeight: 1.3 }}>{sub}</span>}
    </div>
  )
}
const Small = ({ children, onClick }: { children: ComponentChildren; onClick: () => void }) =>
  <button onClick={onClick} style={{ flex: 'none', height: 36, padding: '0 12px', border: 0, borderRadius: 10, background: '#F4F1EB', color: '#26201A', fontSize: 12.5, fontWeight: 700 }}>{children}</button>
const Primary = ({ children, onClick, disabled }: { children: ComponentChildren; onClick: () => void; disabled?: boolean }) =>
  <button onClick={onClick} disabled={disabled} style={{ flex: 'none', width: '100%', height: 56, border: 0, borderRadius: 28, background: BRAND100, boxShadow: '0 6px 16px rgba(247,164,65,.35)', color: '#26201A', fontSize: 17, fontWeight: 700, opacity: disabled ? 0.6 : 1 }}>{children}</button>
function CardButton({ slot, title, sub, label, value, color = GREEN, onClick }: { slot?: string | null; title: string; sub: string; label: string; value: string; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', boxSizing: 'border-box', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, border: 0, borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', color: '#26201A', textAlign: 'left' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <Slot size={44} r={12} file={slot ?? undefined} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{title}</span>
          <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{sub}</span>
        </span>
        {I.chev()}
      </span>
      <span style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 12, background: '#FAF6EE' }}>
        <span style={{ fontSize: 12.5, color: '#6B6157' }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
      </span>
    </button>
  )
}
const GROUPS: [Group, string][] = [['once', 'โตครั้งเดียว'], ['regrow', 'เก็บซ้ำได้'], ['flower', 'ไม้ดอก']]

/** แผนซื้อเมล็ด = พืชอันดับ 1 ของแต่ละกลุ่ม (เปลี่ยนเองได้ในหน้าแผน) */
function seedPlan(rows: FreshRow[], tiles: Record<Group, number>, pick: Partial<Record<Group, string>>) {
  return GROUPS.flatMap(([g, label]) => {
    const opts = rows.filter((r) => r.group === g && r.crop.seed_price != null)
    const r = opts.find((x) => x.crop.id === pick[g]) ?? opts.find((x) => bestValue(x) > 0) ?? opts[0]
    if (!r || !tiles[g]) return []
    return [{ g, label, row: r, opts, bags: tiles[g], cost: tiles[g] * (r.crop.seed_price ?? 0) }]
  })
}

/* ---------- 27 · แท็บคำนวณ ---------- */
export function Calculate() {
  const a = useAll(); const fd = useFarmData()
  if (!a || !fd || fd instanceof Error) return <Loading />
  const { s, d } = a
  const t = farmTiles(s)
  const tiles = { flower: t.flower, once: t.once, regrow: t.regrow }
  const rows = freshPlan(d, s, tiles, fertOf(d, s)?.id ?? null)
  const top = rows.find((r) => r.group === 'once') ?? rows[0]
  const plan = seedPlan(rows, tiles, {})
  const cost = plan.reduce((x, p) => x + p.cost, 0)
  const cc = housingCap(fd, s, 'coop'), cb = housingCap(fd, s, 'barn')
  const animalsTop = (['Barn', 'Coop'] as const).map((k) => ({ k, r: animalRows(d, s, k)[0] })).filter((x) => x.r).sort((x, y) => (y.r.proc?.perDay ?? y.r.sell ?? 0) - (x.r.proc?.perDay ?? x.r.sell ?? 0))[0]
  const anc = fd.ancient
  const need = anc ? s.greenhouse.plants * anc.min_harvest * (fd.wine?.input_qty ?? 1) : null
  const short = need == null ? null : Math.max(0, need - s.machines.keg)
  const b = bonus(d, s)
  const box: S = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 2px', borderRadius: 14, background: 'rgba(255,255,255,.4)' }
  const profNames = d.professions.filter((p) => s.skills.professions.includes(p.id)).map((p) => p.name_en)
  return (
    <Body>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.3 }}>คำนวณ</h1>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: '#6B6157' }}>ตัวช่วยวางแผนตามฟาร์มของคุณ</span>
        </div>
        <button style={{ flex: 'none', height: 44, padding: '0 12px 0 14px', display: 'flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 14, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(90,60,20,.08)', color: '#26201A', fontSize: 14, fontWeight: 700 }}>{s.name}{I.down}</button>
      </div>
      <div style={{ ...card, background: BRAND160, boxShadow: '0 3px 10px rgba(247,164,65,.28)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ fontSize: 15, fontWeight: 700 }}>ฤดูนี้เหลืออีก</span><span style={{ fontSize: 12 }}>{s.date.season} · วันที่ {s.date.day}</span></div>
        <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{daysLeft(s)} วัน</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={box}><span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{n(t.total)}</span><span style={{ fontSize: 12, lineHeight: 1.3 }}>ช่องปลูก</span></div>
          <div style={box}><span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{cc == null || cb == null ? '—' : cc + cb}</span><span style={{ fontSize: 12, lineHeight: 1.3 }}>ที่เลี้ยงสัตว์</span></div>
          <div style={box}><span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{s.machines.keg}</span><span style={{ fontSize: 12, lineHeight: 1.3 }}>Keg</span></div>
        </div>
      </div>
      <Head title="วางแผนฤดูนี้" note="เรียงตามลำดับที่ควรทำ" />
      <CardButton slot={top?.crop.img} title="แนะนำปลูก" sub="ปลูกสด · แปรรูป · เทียบปุ๋ย" label={top ? `อันดับ 1 ${GROUPS.find((g) => g[0] === top.group)![1]}` : 'ยังไม่มีพืชที่ปลูกทัน'} value={top ? `${top.crop.name_en} ${sg(bestValue(top))}` : '—'} onClick={() => goCalc('fresh')} />
      <CardButton slot={icon('img_mixed_seeds')} title="แผนซื้อเมล็ด" sub="ซื้ออะไร กี่ถุง เท่าไหร่" label="เงินที่ต้องเตรียม" value={`${n(cost)}g`} onClick={() => goCalc('seeds')} />
      <Head title="ฟาร์มส่วนอื่น" />
      <CardButton slot={animalsTop?.r.a.img} title="แนะนำเลี้ยงสัตว์" sub="ตามคอกที่มี · ขายเลย vs แปรรูป" label={animalsTop ? `อันดับ 1 ${animalsTop.k}` : 'ยังไม่มีคอกสัตว์'} value={animalsTop ? `${animalsTop.r.a.name_en} +${n(Math.max(animalsTop.r.proc?.perDay ?? 0, animalsTop.r.sell ?? 0))}g/วัน` : '—'} onClick={() => goCalc('animals')} />
      <CardButton slot={fd.img.ancient_fruit} title="เตรียม Keg เรือนกระจก" sub={`${anc?.name_en ?? 'Ancient Fruit'} · ต้องมี Keg ${need ?? '—'}`} label="ต้องสร้างเพิ่ม" value={short == null ? NA : `${short} ตัว`} color={short ? '#A63D2A' : GREEN} onClick={() => goFarm('greenhouse')} />
      <Head title="ค่าที่ใช้คำนวณ" />
      <Card gap={8}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Slot size={44} r={12} ic="img_skill_farming" />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>ระดับ · อาชีพ</span>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: b.any ? GREEN : '#A63D2A' }}>{b.set ? `Farming ${s.skills.levels.Farming}${profNames.length ? ' · ' + profNames.join(', ') : ''}` : 'ยังไม่ได้ตั้ง · ตัวเลขยังไม่รวมโบนัสอาชีพ'}</span>
          </span>
          <button onClick={() => goFarm('skills')} style={{ flex: 'none', height: 44, padding: '0 14px', border: 0, borderRadius: 12, background: '#F4F1EB', color: '#26201A', fontSize: 13.5, fontWeight: 700 }}>ตั้งค่า</button>
        </div>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: '#6B6157' }}>ตั้งครั้งเดียวที่ My Farm แล้วทุกหน้าคำนวณใช้ร่วมกัน</span>
      </Card>
    </Body>
  )
}

/* ---------- แถบสลับ ปลูกสด / แปรรูป ---------- */
function ModeTabs({ mode }: { mode: 'fresh' | 'process' }) {
  const t = (k: 'fresh' | 'process', title: string, sub: string) => {
    const on = mode === k
    return (
      <button aria-pressed={on} onClick={() => goCalc(k)} style={{ flex: 1, minWidth: 0, height: 64, boxSizing: 'border-box', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 10, border: 0, borderRadius: 14, color: '#26201A', textAlign: 'left', ...(on ? { background: BRAND160, boxShadow: '0 3px 8px rgba(247,164,65,.3)', fontWeight: 700 } : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5', fontWeight: 600 }) }}>
        <Slot size={30} r={8} on={on} ic={k === 'fresh' ? 'img_pumpkin' : 'img_keg'} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 15 }}>{title}</span><span style={{ fontSize: 11.5, fontWeight: 500, color: on ? '#26201A' : '#6B6157' }}>{sub}</span></span>
      </button>
    )
  }
  return <div style={{ display: 'flex', gap: 8 }}>{t('fresh', 'ปลูกสด', 'ขายผลผลิตเลย')}{t('process', 'แปรรูป', 'Keg · Jar')}</div>
}
const advHeader = (s: SaveData) => `${s.date.season} · วันที่ ${s.date.day} · เหลือ ${daysLeft(s)} วัน`

/* ---------- 24 · แนะนำปลูก · ปลูกสด ---------- */
export function AdvisorFresh() {
  const a = useAll()
  const [pickFert, setPickFert] = useState(false)
  if (!a) return <Loading />
  const { s, d } = a
  const t = farmTiles(s)
  const tiles = { flower: t.flower, once: t.once, regrow: t.regrow }
  const fert = fertOf(d, s)
  const rows = freshPlan(d, s, tiles, fert?.id ?? null)
  return (
    <Body>
      <SubHeader title="แนะนำปลูก" sub={advHeader(s)} back="" onBack={() => goCalc()} />
      <BonusTag d={d} s={s} />
      <ModeTabs mode="fresh" />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 13, color: '#6B6157' }}>ช่องปลูกจาก My Farm</span><span style={{ fontSize: 18, fontWeight: 800 }}>{n(t.total)} ช่อง · {t.plots} แปลง</span></span>
          <Small onClick={() => goFarm()}>แก้ที่ My Farm</Small>
        </div>
        <div style={{ display: 'flex', gap: 2, height: 14, borderRadius: 7, overflow: 'hidden', background: '#ECE6DC' }}>
          {(['flower', 'once', 'regrow'] as const).map((k) => tiles[k] > 0 && <span style={{ flex: tiles[k], background: COL[k], minWidth: 0 }} />)}
        </div>
      </Card>
      <Card>
        <span style={{ fontSize: 15, fontWeight: 800 }}>เทียบให้ 2 แบบ ต่อทุกพืช</span>
        {[['#F6F0E4', 'ปลูกเปล่า', 'ปลูกปกติ ไม่ใส่ปุ๋ย · กำไร = ขายผลผลิต − ค่าเมล็ด'], ['#F5F9E4', 'ใส่ปุ๋ย', 'ใส่ปุ๋ยก่อนปลูก ผลผลิตคุณภาพดีขึ้นจึงขายได้แพงขึ้น · กำไร = ขายผลผลิต − ค่าเมล็ด − ค่าปุ๋ย']].map(([bg, h, b]) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 'none', width: 28, height: 28, borderRadius: 9, background: bg }} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{h}</span><span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.4 }}>{b}</span></span>
          </div>
        ))}
        <button onClick={() => setPickFert(!pickFert)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 0, borderRadius: 14, background: '#F6F0E4', color: '#26201A', textAlign: 'left' }}>
          <Slot size={32} r={8} file={fert?.img ?? undefined} />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 12, color: '#6B6157' }}>ปุ๋ยที่ใช้คำนวณ</span><span style={{ fontSize: 14, fontWeight: 700 }}>{fert ? `${fert.name_en} · ${n(fert.price)}g/ช่อง` : NA}</span></span>
          {I.down}
        </button>
        {pickFert && d.fertilizers.map((f) => (
          <button onClick={() => { updateSave((x) => ({ ...x, calc: { ...x.calc, fertilizer: f.id } })); setPickFert(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '0 12px', border: 0, borderRadius: 14, color: '#26201A', textAlign: 'left', ...(f.id === fert?.id ? { background: BRAND160 } : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5' }) }}>
            <Slot size={28} r={7} file={f.img ?? undefined} /><span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{f.name_en}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{n(f.price)}g</span>
          </button>
        ))}
      </Card>
      <Head title="กำไรทั้งแปลง" note="ตัวเลขคือกำไรรวมของทุกช่องในกลุ่ม" />
      <Card gap={14}>
      {GROUPS.filter(([g]) => tiles[g] > 0).map(([g, label], gi) => {
        const rs = rows.filter((r) => r.group === g)
        return (
          <>
            {gi > 0 && <Divider />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true" style={{ flex: 'none', width: 10, height: 10, borderRadius: 3, background: COL[g] }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{label}</span><span style={{ fontSize: 12.5, color: '#6B6157' }}>{tiles[g]} ช่อง</span>
            </div>
            {rs.length === 0 && <span style={{ fontSize: 13, color: '#6B6157' }}>ไม่มีพืชในกลุ่มนี้ที่เก็บทันก่อนสิ้นฤดู</span>}
            {rs.map((r, i) => {
              const diff = r.fert == null ? null : r.fert - r.plain
              const neg = bestValue(r) <= 0
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Rank i={i} />
                    <Slot size={40} r={10} file={r.crop.img ?? undefined} />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{r.crop.name_en}</span>
                      <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.35 }}>{r.crop.name_th ?? 'ชื่อไทย'} · {neg ? 'ขายไม่คุ้มค่าเมล็ด' : r.harvests > 1 ? `เก็บ ${r.harvests} ครั้ง` : `เก็บ ${s.date.season} ${r.lastDay}`}</span>
                    </span>
                    {neg ? <Tag bg="#F9DDD6" fg="#A63D2A">ไม่คุ้มปลูก</Tag> : r.best === 'fert' && diff ? <Tag bg="#E7EFCB" fg={GREEN}>ใส่ปุ๋ยคุ้ม {sg(diff)}</Tag> : <Tag bg="#F4F1EB" fg="#6B6157">ไม่ต้องใส่ปุ๋ย</Tag>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Cmp label="ปลูกเปล่า" value={sg(r.plain)} win={r.best === 'plain'} />
                    <Cmp label="ใส่ปุ๋ย" value={r.fert == null ? NA : sg(r.fert)} win={r.best === 'fert'} />
                  </div>
                </div>
              )
            })}
          </>
        )
      })}
      </Card>
      <Info title="เรียงยังไง">แต่ละกลุ่มเรียงจากกำไรมากไปน้อย โดยใช้แบบที่ดีกว่าของพืชนั้น · กรอบเขียว ✓ = แบบที่ควรเลือก · คิดเฉพาะพืชที่เก็บทันก่อนสิ้นฤดู และราคาเฉลี่ยตามโอกาสได้คุณภาพจากเลเวล Farming</Info>
      <Primary onClick={() => goCalc('seeds')}>ใช้แผนนี้ → ซื้อเมล็ด</Primary>
    </Body>
  )
}

/* ---------- 25 · แนะนำปลูก · แปรรูป ---------- */
export function AdvisorProcess() {
  const a = useAll()
  if (!a) return <Loading />
  const { s, d } = a
  const left = daysLeft(s)
  const crops = d.crops.filter((c) => c.seasons?.split(',').includes(s.date.season) && c.category !== 'Flower' && c.growth_days <= left)
  const list = crops.map((c) => ({ c, o: processOptions(d, s, c) })).filter((x) => x.o.length)
    .sort((x, y) => Math.max(...y.o.map((o) => o.perPiece)) - Math.max(...x.o.map((o) => o.perPiece)))
  const kegRules = (cat: string) => d.rules.find((r) => r.machine_id === 'keg' && r.input_category === cat)?.output_name ?? '—'
  const jarRules = (cat: string) => d.rules.find((r) => r.machine_id === 'preserves_jar' && r.input_category === cat)?.output_name ?? '—'
  const short = (m: string) => (m === 'keg' ? 'Keg' : 'Jar')
  return (
    <Body>
      <SubHeader title="แนะนำปลูก" sub={advHeader(s)} onBack={() => goCalc()} />
      <BonusTag d={d} s={s} />
      <ModeTabs mode="process" />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 13, color: '#6B6157' }}>เครื่องที่มี (จาก My Farm)</span><span style={{ fontSize: 16, fontWeight: 800 }}>Keg {s.machines.keg} · Jar {s.machines.preserves_jar}</span></span>
          <Small onClick={() => goFarm()}>แก้ที่ My Farm</Small>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 12px', borderRadius: 14, background: '#F6F0E4', fontSize: 12.5, lineHeight: 1.5, color: '#4F463D' }}>
          <span><b>Keg</b> · ผลไม้ → {kegRules('Fruit')} · ผัก → {kegRules('Vegetable')}</span>
          <span><b>Jar</b> · ผลไม้ → {jarRules('Fruit')} · ผัก → {jarRules('Vegetable')}</span>
        </div>
      </Card>
      <Head title="เทียบ Keg กับ Jar" note="ต่อพืชแต่ละชนิด" />
      {list.map(({ c, o }) => {
        const bp = o.reduce((x, y) => (y.perPiece > x.perPiece ? y : x))
        const bd = o.reduce((x, y) => (y.perDay > x.perDay ? y : x))
        const same = bp.machine === bd.machine
        return (
          <Card gap={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Slot size={40} r={10} file={c.img ?? undefined} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{c.name_en}</span>
                <span style={{ fontSize: 12.5, color: '#6B6157' }}>{c.name_th ?? 'ชื่อไทย'} · ขายสด {n(Math.floor(c.sell_price * bonus(d, s).crop))}g</span>
              </span>
              {o.length > 1 && (same ? <Tag h={24} bg="#E7EFCB" fg={GREEN}>{short(bp.machine)} ชนะทั้งคู่</Tag> : <Tag h={24} bg="#FFE3A8" fg="#7A4C08">ต่อวัน → {short(bd.machine)}</Tag>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6B6157' }}>
              <span style={{ flex: 'none', width: 30 }} /><span style={{ flex: 1 }} /><span style={{ flex: 'none', width: 76, textAlign: 'center' }}>ต่อชิ้น</span><span style={{ flex: 'none', width: 76, textAlign: 'center' }}>ต่อวัน</span>
            </div>
            {o.map((x) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Slot size={30} r={8} file={d.img[x.machine]} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>{short(x.machine)} · {x.days} วัน</span>
                  <span style={{ fontSize: 12, color: '#6B6157', lineHeight: 1.3 }}>{x.rule.output_name} ขาย {n(x.price)}g</span>
                </span>
                {[x.perPiece, x.perDay].map((v, i) => {
                  const win = o.length > 1 && (i === 0 ? bp : bd) === x
                  return (
                    <div style={{ flex: 'none', width: 76, boxSizing: 'border-box', padding: '5px 4px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', ...(win ? { boxShadow: 'inset 0 0 0 2px #8FA83A', background: '#F5F9E4' } : { background: '#F6F0E4' }) }}>
                      <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35, color: v < 0 ? '#A63D2A' : win ? GREEN : '#6B6157' }}>{sg(v)}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: GREEN }}>{win ? '✓ คุ้มสุด' : ' '}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </Card>
        )
      })}
      <Info title="อ่านยังไง">ต่อชิ้น = ได้เพิ่มจากขายสด 1 ชิ้น · ต่อวัน = ต่อชิ้น ÷ วันที่เครื่องใช้ (สมมติว่าใส่ใหม่ทันทีที่เสร็จ) · ป้ายสีส้ม = ผลเปลี่ยนเมื่อดูต่อวัน · ราคาแปรรูปตามสูตรในฐานข้อมูล</Info>
      <Primary onClick={() => goCalc('seeds')}>ใช้แผนนี้ → ซื้อเมล็ด</Primary>
    </Body>
  )
}

/* ---------- 24b · แผนซื้อเมล็ด ---------- */
export function SeedPlan() {
  const a = useAll()
  const [pick, setPick] = useState<Partial<Record<Group, string>>>({})
  const [added, setAdded] = useState(false)
  if (!a) return <Loading />
  const { s, d } = a
  const t = farmTiles(s)
  const tiles = { flower: t.flower, once: t.once, regrow: t.regrow }
  const rows = freshPlan(d, s, tiles, null)
  const plan = seedPlan(rows, tiles, pick)
  const total = plan.reduce((x, p) => x + p.cost, 0)
  const bags = plan.reduce((x, p) => x + p.bags, 0)
  const profit = plan.reduce((x, p) => x + p.row.plain, 0)
  const shops = [...new Set(plan.map((p) => p.row.crop.shop).filter(Boolean))]
  const addTodo = () => {
    updateSave((x) => ({ ...x, todos: [...x.todos, ...plan.map((p) => ({ id: crypto.randomUUID(), title: `ซื้อ ${p.row.crop.seed_name} ${p.bags} ถุง`, status: 'open' as const, createdAt: new Date().toISOString() }))] }))
    setAdded(true)
  }
  return (
    <Body>
      <SubHeader title="แผนซื้อเมล็ด" sub={`${s.date.season} · เลือกตามอันดับแนะนำ`} onBack={() => goCalc()} />
      <BonusTag d={d} s={s} />
      <div style={{ ...card, gap: 8, background: BRAND160, boxShadow: '0 3px 10px rgba(247,164,65,.28)' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>เงินที่ต้องเตรียมซื้อเมล็ด</span>
        <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{n(total)}g</span>
        <span style={{ fontSize: 13, lineHeight: 1.45 }}>{bags} ถุง · ซื้อที่ {shops.join(', ') || '—'} · คาดกำไรถ้าขายสด {sg(profit)}</span>
      </div>
      <Head title="ซื้ออะไร" note="ตามช่องของแต่ละกลุ่ม" />
      {plan.length === 0 && <Info title="ยังไม่มีแผน">ตั้งช่องปลูกและแบ่งช่องที่ My Farm ก่อน หรือฤดูนี้เหลือวันไม่พอให้พืชโตทัน</Info>}
      {plan.map((p) => (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden="true" style={{ flex: 'none', width: 10, height: 10, borderRadius: 3, background: COL[p.g] }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{p.label}</span><span style={{ fontSize: 12.5, color: '#6B6157' }}>{p.bags} ช่อง</span>
          </div>
          <label style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Slot size={44} r={12} file={p.row.crop.seed_img ?? undefined} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{p.row.crop.seed_name}</span>
              <span style={{ fontSize: 12.5, color: '#6B6157' }}>{n(p.row.crop.seed_price ?? 0)}g ต่อถุง · แตะเพื่อเปลี่ยนชนิด</span>
            </span>
            {I.down}
            <select aria-label="เปลี่ยนชนิด" value={p.row.crop.id} onChange={(e) => setPick({ ...pick, [p.g]: (e.target as HTMLSelectElement).value })} style={{ position: 'absolute', inset: 0, opacity: 0, fontSize: 16 }}>
              {p.opts.map((o) => <option value={o.crop.id}>{o.crop.seed_name} · {n(o.crop.seed_price ?? 0)}g · กำไร {sg(o.plain)}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, background: '#FAF6EE' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>ซื้อ {p.bags} ถุง</span><span style={{ fontSize: 18, fontWeight: 800 }}>{n(p.cost)}g</span>
          </div>
        </Card>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        {[['ดูอันดับปลูกสด', 'fresh'], ['ดูอันดับแปรรูป', 'process']].map(([l, k]) => (
          <button onClick={() => goCalc(k)} style={{ flex: 1, height: 48, border: 0, borderRadius: 14, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5', color: '#26201A', fontSize: 14, fontWeight: 700 }}>{l}</button>
        ))}
      </div>
      <Primary onClick={addTodo} disabled={added || !plan.length}>{added ? 'เพิ่มใน to-do แล้ว' : 'เพิ่มเป็น to-do ซื้อเมล็ด'}</Primary>
    </Body>
  )
}

/* ---------- 26 · แนะนำเลี้ยงสัตว์ ---------- */
export function AnimalAdvisor() {
  const a = useAll(); const fd = useFarmData()
  if (!a || !fd || fd instanceof Error) return <Loading />
  const { s, d } = a
  const cc = housingCap(fd, s, 'coop'), cb = housingCap(fd, s, 'barn')
  const every = (k: number | null) => (k == null ? NA : k === 1 ? 'ทุกวัน' : `ทุก ${k} วัน`)
  const section = (kind: 'Coop' | 'Barn', cap: number | null) => {
    const rs = animalRows(d, s, kind)
    const best = rs[0] ? Math.max(rs[0].proc?.perDay ?? 0, rs[0].sell ?? 0) : 0
    return (
      <Card gap={12}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Slot size={32} r={8} ic={`img_building_${kind.toLowerCase()}`} /><span style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>{kind}</span><span style={{ fontSize: 12.5, color: '#6B6157' }}>เลี้ยงได้ {cap ?? '—'} ตัว</span>
        </div>
        {!rs.length && <span style={{ fontSize: 13, color: '#6B6157' }}>ยังไม่มี {kind} · เพิ่มได้ที่ My Farm</span>}
        {!!rs.length && cap != null && <div style={{ padding: '8px 10px', borderRadius: 12, background: '#F4F1EB', fontSize: 12.5, lineHeight: 1.45, color: GREEN }}>เต็มคอกด้วยอันดับ 1 ≈ <b>+{n(best * cap)}g/วัน</b></div>}
        {rs.map((r, i) => {
          const procWin = (r.proc?.perDay ?? -1) > (r.sell ?? -1)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Rank i={i} />
                <Slot size={40} r={10} file={r.a.img ?? undefined} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{r.a.name_en}</span>
                  <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.35 }}>{r.a.name_th ?? 'ชื่อไทย'} · ซื้อ {n(r.a.price)}g</span>
                </span>
                <span style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}><span style={{ fontSize: 11.5, color: '#6B6157' }}>คืนทุน</span><span style={{ fontSize: 14, fontWeight: 800 }}>{r.payback == null ? '—' : `~${r.payback} วัน`}</span></span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Cmp size={18} label="ขายเลย" value={r.sell == null ? NA : `+${n(r.sell)}g/วัน`} win={!procWin} sub={`${r.a.produce_name} · ${every(r.a.produce_days)}`} />
                <Cmp size={18} label="แปรรูป" value={r.proc ? `+${n(r.proc.perDay)}g/วัน` : 'ไม่มี'} win={procWin} sub={r.proc?.name ?? '—'} />
              </div>
            </div>
          )
        })}
      </Card>
    )
  }
  return (
    <Body>
      <SubHeader title="แนะนำเลี้ยงสัตว์" sub="ตามคอกที่มี" onBack={() => goCalc()} />
      <BonusTag d={d} s={s} />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 13, color: '#6B6157' }}>คอกจาก My Farm</span><span style={{ fontSize: 18, fontWeight: 800 }}>Coop {cc ?? '—'} · Barn {cb ?? '—'} ตัว</span></span>
          <Small onClick={() => goFarm('animals')}>แก้ที่ My Farm</Small>
        </div>
      </Card>
      <Head title="กำไรต่อวันต่อตัว" note="เทียบขายเลย กับ แปรรูป" />
      {section('Coop', cc)}
      {section('Barn', cb)}
      <Info title="คิดยังไง">ต่อวัน = ราคาผลผลิต ÷ จำนวนวันที่ได้ผลผลิต · "แปรรูป" ต้องมีเครื่อง ({[...new Set(d.rules.filter((r) => d.animals.some((a) => a.produce_id === r.input_item_id)).map((r) => d.machineNames[r.machine_id]))].filter(Boolean).join(', ')}) · คืนทุน = ราคาสัตว์ ÷ กำไรต่อวันแบบที่ดีกว่า · ใช้ผลผลิตปกติ ไม่นับผลผลิตขนาดใหญ่</Info>
    </Body>
  )
}

/* ---------- 28 · ระดับ · อาชีพ ---------- */
const OTHER: [SkillName, string][] = [['Fishing', 'fishing'], ['Mining', 'mining'], ['Foraging', 'foraging']]
export function Skills() {
  const a = useAll()
  const [open, setOpen] = useState<SkillName | null>(null)
  if (!a) return <Loading />
  const { s, d } = a
  const lv = s.skills.levels
  const chosen = new Set(s.skills.professions)
  const setLevel = (k: SkillName, v: number) => updateSave((x) => {
    const profs = x.skills.professions.filter((id) => { const p = d.professions.find((q) => q.id === id); return !p || p.skill !== k || p.level <= v })
    return { ...x, skills: { levels: { ...x.skills.levels, [k]: v }, professions: profs } }
  })
  const choose = (p: Profession) => updateSave((x) => {
    const same = d.professions.filter((q) => q.skill === p.skill && (q.level === p.level || (p.level === 5 && q.level === 10)))
    const keep = x.skills.professions.filter((id) => !same.some((q) => q.id === id))
    return { ...x, skills: { ...x.skills, professions: [...keep, p.id] } }
  })
  const profBtn = (p: Profession) => {
    const on = chosen.has(p.id)
    return (
      <button aria-pressed={on} onClick={() => choose(p)} style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 0, borderRadius: 14, color: '#26201A', textAlign: 'center', ...(on ? { background: BRAND160, boxShadow: '0 3px 8px rgba(247,164,65,.3)' } : { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E8D9B5' }) }}>
        <Slot size={30} r={8} on={on} ic={`img_profession_${p.id}`} />
        <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{p.name_en}</span>
        <span style={{ fontSize: 12, lineHeight: 1.35, color: on ? '#26201A' : '#6B6157' }}>{profShort(p) ?? NA}</span>
      </button>
    )
  }
  const tree = (k: SkillName) => {
    const l5 = d.professions.filter((p) => p.skill === k && p.level === 5)
    const pick5 = l5.find((p) => chosen.has(p.id))
    const l10 = d.professions.filter((p) => p.skill === k && p.level === 10 && (!pick5 || p.parent_id === pick5.id))
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 14, fontWeight: 700 }}>เลเวล</span><span style={{ fontSize: 12.5, color: '#6B6157' }}>0–10</span></span>
          <button onClick={() => setLevel(k, 10)} style={{ flex: 'none', height: 48, padding: '0 14px', border: 0, borderRadius: 14, background: 'transparent', boxShadow: 'inset 0 0 0 1.5px #FDB927', color: '#A86E0C', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>เต็ม 10</button>
          <Count big font={22} value={lv[k]} min={0} max={10} onChange={(v) => setLevel(k, v)} />
        </div>
        {lv[k] >= 5 && (
          <>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ fontSize: 13.5, fontWeight: 700 }}>อาชีพ ระดับ 5</span><span style={{ fontSize: 12, color: '#6B6157' }}>เลือกได้ 1</span></div>
            <div style={{ display: 'flex', gap: 8 }}>{l5.map(profBtn)}</div>
          </>
        )}
        {lv[k] >= 10 && pick5 && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ fontSize: 13.5, fontWeight: 700 }}>อาชีพ ระดับ 10</span><span style={{ fontSize: 12, color: '#6B6157' }}>ตามที่เลือกด้านบน</span></div>
            <div style={{ display: 'flex', gap: 8 }}>{l10.map(profBtn)}</div>
          </>
        )}
      </>
    )
  }
  // ตัวอย่างผลจริงจากฐานข้อมูล: ราคาก่อน/หลังโบนัส
  const b = bonus(d, s)
  const pump = d.crops.find((c) => c.id === 'pumpkin'), anc = d.crops.find((c) => c.id === 'ancient_fruit')
  const ex: [string, number | null, number | null][] = []
  if (pump) {
    ex.push([`${pump.name_en} ขายสด`, pump.sell_price, Math.floor(pump.sell_price * b.crop)])
    const jar = processOptions(d, { ...s, skills: { ...s.skills, professions: [] } }, pump).find((o) => o.machine === 'preserves_jar')
    const jarB = processOptions(d, s, pump).find((o) => o.machine === 'preserves_jar')
    if (jar && jarB) ex.push([`${pump.name_en} → ${jar.rule.output_name}`, jar.price, jarB.price])
  }
  if (anc) {
    const k0 = processOptions(d, { ...s, skills: { ...s.skills, professions: [] } }, anc).find((o) => o.machine === 'keg')
    const k1 = processOptions(d, s, anc).find((o) => o.machine === 'keg')
    if (k0 && k1) ex.push([`${anc.name_en} ${k0.rule.output_name}`, k0.price, k1.price])
  }
  const q0 = qualityFactor(d, 0, 0), q1 = qualityFactor(d, lv.Farming, 0)
  const profLabel = (k: SkillName) => d.professions.filter((p) => p.skill === k && chosen.has(p.id)).map((p) => { const sh = profShort(p); return p.bonus_kind && sh ? `${p.name_en} · ${sh}` : p.name_en }).join(' · ')
  return (
    <Body>
      <SubHeader title="ระดับ · อาชีพ" sub="ตั้งครั้งเดียว" />
      <Head title="ที่มีผลกับกำไรมากสุด" />
      <Card gap={12}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Slot size={44} r={12} ic="img_skill_farming" />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>Farming</span><span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>ปลูกพืช · เลี้ยงสัตว์ · แปรรูป</span></span>
        </div>
        {d.professions.length ? tree('Farming') : <span style={{ fontSize: 13, color: '#6B6157' }}>{NA}</span>}
      </Card>
      <Head title="ทักษะอื่น" note="แตะเพื่อตั้ง" />
      <Card gap={12}>
        {OTHER.map(([k], i) => (
          <>
            {i > 0 && <Divider />}
            <button onClick={() => setOpen(open === k ? null : k)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 0, border: 0, background: 'none', color: '#26201A', textAlign: 'left' }}>
              <Slot size={40} r={10} ic={`img_skill_${k.toLowerCase()}`} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{k}</span>
                <span style={{ fontSize: 13, color: '#6B6157', lineHeight: 1.35 }}>{profLabel(k) || 'ยังไม่ได้เลือกอาชีพ'}</span>
              </span>
              <span style={{ flex: 'none', height: 28, padding: '0 10px', display: 'inline-flex', alignItems: 'center', borderRadius: 8, background: '#F4F1EB', fontSize: 13, fontWeight: 800 }}>Lv {lv[k]}</span>
              {open === k ? I.down : I.chev()}
            </button>
            {open === k && tree(k)}
          </>
        ))}
      </Card>
      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: '#6B6157', padding: '0 4px' }}>Combat ไม่มีผลกับการคำนวณ จึงไม่ต้องตั้ง</span>
      <Head title="ผลที่ได้" />
      <Card gap={8}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>ตัวเลขจะเปลี่ยนยังไง</span>
        {ex.map(([l, x, y]) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{l}</span>
            {x !== y && <span style={{ fontSize: 13, color: '#6B6157', textDecoration: 'line-through' }}>{x == null ? '—' : `${n(x)}g`}</span>}
            <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>{y == null ? NA : `${n(y)}g`}</span>
          </div>
        ))}
        {q0 != null && q1 != null && lv.Farming > 0 && <span style={{ fontSize: 12.5, color: '#6B6157', lineHeight: 1.5 }}>เลเวล Farming {lv.Farming} ทำให้ผลผลิตได้คุณภาพดีขึ้น ราคาเฉลี่ย ×{q1.toFixed(2)} (เลเวล 0 = ×{q0.toFixed(2)})</span>}
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: '#6B6157' }}>ตามที่ตั้งไว้ด้านบน · ใช้กับแนะนำปลูก แปรรูป และเลี้ยงสัตว์ทุกหน้า</span>
      </Card>
    </Body>
  )
}
export { Skeleton, ConfirmDelete, groupOf }
