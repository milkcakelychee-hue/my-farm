// หน้าตรวจของขั้น 1 (ชั่วคราว): ตัวอย่างข้อมูลจริง 10 พืช + ทดสอบสำรองแล้วกู้กลับ
import { useEffect, useState } from 'preact/hooks'
import { cropsQuery, meta, query, type CropRow } from './data/gamedb'
import { listSaves, newSave, putSave, deleteSave, type SaveData } from './data/save'
import { buildBackup, parseBackup, restoreBackup } from './data/backup'
import { Badge, Caption, Card, EmptyState, Explain, Page, PrimaryButton, Skeleton } from './ui'

const NA = <span style={{ color: 'var(--soft)', fontWeight: 500 }}>ยังไม่มีข้อมูล</span>
const g = (v: number | null) => (v == null ? NA : `${v.toLocaleString()}g`)

function CropCard({ c }: { c: CropRow }) {
  const row = (k: string, v: preact.ComponentChildren) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
      <span style={{ color: 'var(--soft)' }}>{k}</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span>
    </div>
  )
  return (
    <Card gap={6}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {c.image_path
          ? <img src={`${import.meta.env.BASE_URL}img/${c.image_path.split('/').pop()}`} alt="" width={48} height={48} style={{ flex: 'none', imageRendering: 'pixelated' }} />
          : <span aria-hidden="true" style={{ flex: 'none', width: 48, height: 48, borderRadius: 10, border: '2px dashed var(--slot-line)', background: 'var(--slot-bg)' }} />}
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{c.name_en}</span>
          <span style={{ fontSize: 13, color: 'var(--soft)', lineHeight: 1.3 }}>{c.name_th ?? 'ชื่อไทย'}</span>
        </span>
        {c.verified ? <Badge tone="win">ตรวจแล้ว</Badge> : <Badge>ยังไม่ตรวจ</Badge>}
      </div>
      {row('ประเภท', c.regrow_days ? 'เก็บซ้ำ' : c.category === 'Flower' ? 'ไม้ดอก' : 'โตครั้งเดียว')}
      {row('ฤดู', c.seasons ?? NA)}
      {row('โต', c.growth_days == null ? NA : `${c.growth_days} วัน`)}
      {row('เก็บซ้ำทุก', c.regrow_days == null ? '—' : `${c.regrow_days} วัน`)}
      {row('ได้ต่อครั้ง', `${c.min_harvest} ผล`)}
      {row('ราคาขาย (ปกติ)', g(c.sell_price))}
      {row('เมล็ด Pierre', g(c.pierre))}
      {c.source_url && <Caption>ที่มา: {decodeURIComponent(c.source_url.replace('https://', ''))}</Caption>}
    </Card>
  )
}

function BackupTest() {
  const [log, setLog] = useState<string[]>([])
  const [ok, setOk] = useState<boolean | null>(null)
  const run = async () => {
    const L: string[] = []
    const id = 'roundtrip-test'
    try {
      const s: SaveData = { ...newSave(id, 'เซฟทดสอบ', { season: 'Fall', day: 12, year: 2 }), machines: { keg: 24, preserves_jar: 12 }, ginger_island: true }
      await putSave(s); L.push('1) สร้างเซฟทดสอบ (Keg 24 · Jar 12 · Fall 12 ปี 2)')
      const text = JSON.stringify(await buildBackup(id)); L.push(`2) ส่งออกเป็นไฟล์ JSON ${text.length.toLocaleString()} ไบต์`)
      await deleteSave(id); L.push(`3) ลบเซฟ เหลือ ${(await listSaves()).filter((x) => x.id === id).length} เซฟทดสอบ`)
      const r = await restoreBackup(parseBackup(text)); L.push(`4) กู้จากไฟล์ ${r.restored} เซฟ`)
      const back = (await listSaves()).find((x) => x.id === id)
      const same = !!back && back.machines.keg === 24 && back.machines.preserves_jar === 12 && back.date.day === 12 && back.ginger_island
      L.push(same ? '5) ค่าที่กู้กลับตรงกับก่อนลบทุกช่อง' : '5) ค่าที่กู้กลับไม่ตรง')
      let rejected = false
      try { parseBackup('{"hello":1}') } catch { rejected = true }
      L.push(rejected ? '6) ไฟล์ที่ไม่ใช่ไฟล์สำรองถูกปฏิเสธ' : '6) ไฟล์ผิดรูปแบบไม่ถูกปฏิเสธ')
      await deleteSave(id); L.push('7) ลบเซฟทดสอบทิ้ง')
      setOk(same && rejected)
    } catch (e) { L.push('ผิดพลาด: ' + (e as Error).message); setOk(false) }
    setLog(L)
  }
  return (
    <Card title="ทดสอบสำรองแล้วกู้กลับ" note={ok == null ? '' : ok ? 'ผ่าน' : 'ไม่ผ่าน'}>
      {log.map((l) => <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{l}</span>)}
      <PrimaryButton onClick={run} style={{ height: 48, fontSize: 15 }}>รันทดสอบ</PrimaryButton>
    </Card>
  )
}

const TABLES: [string, string][] = [['item', 'ไอเท็ม'], ['crop', 'พืช + ไม้ผล'], ['fish', 'ปลา'], ['npc', 'NPC'], ['gift_taste', 'ความชอบของขวัญ'],
  ['calendar_event', 'วันเกิด + เทศกาล'], ['bundle', 'Bundle'], ['machine', 'เครื่องแปรรูป'], ['processing_rule', 'กฎแปรรูป'],
  ['recipe', 'สูตรอาหาร/คราฟต์'], ['building', 'อาคาร'], ['tool_upgrade', 'อัปเกรดเครื่องมือ'], ['animal', 'สัตว์'], ['monster', 'มอนสเตอร์']]

function Counts() {
  const [rows, setRows] = useState<{ t: string; label: string; all: number; sve: number | null }[]>([])
  useEffect(() => {
    Promise.all(TABLES.map(async ([t, label]) => {
      const all = (await query<{ n: number }>(`SELECT count(*) AS n FROM ${t}`))[0].n
      const hasPack = (await query<{ name: string }>(`SELECT name FROM pragma_table_info('${t}') WHERE name='content_pack'`)).length > 0
      const sve = hasPack ? (await query<{ n: number }>(`SELECT count(*) AS n FROM ${t} WHERE content_pack='sve'`))[0].n : null
      return { t, label, all, sve }
    })).then(setRows)
  }, [])
  return (
    <Card title="จำนวนข้อมูลในฐานข้อมูล" gap={4}>
      {rows.map((r) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--soft)' }}>{r.label}</span>
          <span style={{ fontWeight: 700 }}>{r.all.toLocaleString()}{r.sve ? ` (SVE ${r.sve})` : ''}</span>
        </div>
      ))}
    </Card>
  )
}

export function Stage1Data() {
  const [crops, setCrops] = useState<CropRow[] | null>(null)
  const [m, setM] = useState<Record<string, string>>({})
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    Promise.all([query<CropRow>(cropsQuery), meta()]).then(([c, mm]) => { setCrops(c); setM(mm) }).catch((e) => setErr(String(e.message ?? e)))
  }, [])
  return (
    <Page title="ข้อมูลขั้น 1" sub="หน้าชั่วคราว · ข้อมูลจริงจากฐานข้อมูลในเครื่อง · ตัวอย่าง 10 พืช">
      <Explain title="ฐานข้อมูลที่โหลด">รอบ {m.data_round ?? '…'} · schema v{m.schema_version ?? '…'} · เกม {m.game_version_target ?? '…'} · ตัวเลขทุกตัวยังมาจากวิกิแหล่งเดียว จึงเป็น "ยังไม่ตรวจ"</Explain>
      <Counts />
      <BackupTest />
      {err ? <EmptyState title="เปิดฐานข้อมูลไม่ได้" body={err} /> : crops == null ? <><Skeleton /><Skeleton /></> : crops.map((c) => <CropCard c={c} />)}
    </Page>
  )
}
