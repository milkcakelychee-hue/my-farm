import { useEffect, useState } from 'preact/hooks'
import { get, set } from 'idb-keyval'
import {
  Badge, Caption, Card, Compare, ConfirmDelete, DashedButton, DeleteButton, EmptyState, Explain,
  ItemRow, OfflineBanner, Page, PrimaryButton, SecondaryButton, SectionHead, Skeleton, Stepper, Tile, WarnBar,
} from './ui'
import { Stage1Data } from './stage1'
import { AdvisorFresh, AdvisorProcess, AnimalAdvisor, Calculate, SeedPlan, Skills } from './calculate'
import { AnimalHousing, Buildings, EditPlot, FarmError, Greenhouse, MyFarm, MyFarmIsland } from './myfarm'
import { Component, type ComponentChildren } from 'preact'

class Catch extends Component<{ children: ComponentChildren }, { e: Error | null }> {
  state = { e: null as Error | null }
  static getDerivedStateFromError(e: Error) { return { e } }
  render() { return this.state.e ? <FarmError e={this.state.e} /> : this.props.children }
}

/* ---------- แถบนำทางล่าง (จากบอร์ด 01 Today) ---------- */
const TABS = [
  { label: 'วันนี้', icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></> },
  { label: 'Wiki', icon: <><path d="M4 5.5A1.5 1.5 0 015.5 4H19v14H5.5A1.5 1.5 0 004 19.5z" /><path d="M8 8h7" /></> },
  { label: 'My Farm', icon: <><path d="M12 21v-9" /><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z" /><path d="M12 16c0-3-2-5-6-5 0 3 2 5 6 5z" /></> },
  { label: 'คำนวณ', icon: <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 13h.01M12 13h.01M15 13h.01M9 17h.01M12 17h.01M15 17h.01" /></> },
  { label: 'เพิ่มเติม', icon: <><rect x="4" y="4" width="6.5" height="6.5" rx="2" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="2" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" /></> },
]

function BottomNav({ tab, onTab }: { tab: number; onTab: (i: number) => void }) {
  return (
    <nav style={{ flex: 'none', display: 'flex', padding: '8px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)', minHeight: 90, background: 'var(--card)', borderRadius: '28px 28px 0 0', boxShadow: 'var(--sh-nav)' }}>
      {TABS.map((t, i) => {
        const on = i === tab
        const c = on ? 'var(--ink)' : 'var(--soft)'
        return (
          <button aria-current={on ? 'page' : undefined} onClick={() => onTab(i)} style={{ flex: 1, height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, border: 0, background: 'none', color: c, fontSize: 12, fontWeight: on ? 700 : 600 }}>
            <span style={{ width: 56, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: on ? 'var(--nav-pill)' : 'none' }}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">{t.icon}</svg>
            </span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

/* ---------- Splash (บอร์ด 36) ---------- */
export function Splash({ progress }: { progress: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--page-bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <img src="./icon-512.png" alt="" width={112} height={112} style={{ borderRadius: 26, boxShadow: '0 4px 12px rgba(247,164,65,.35)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2 }}>My Farm</span>
          <span style={{ fontSize: 14, color: 'var(--soft)' }}>คู่มือฟาร์ม Stardew Valley</span>
        </div>
      </div>
      <div style={{ padding: '0 40px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'block', width: '100%', height: 5, borderRadius: 3, background: 'var(--empty)', overflow: 'hidden' }}>
          <span style={{ display: 'block', width: `${progress}%`, height: '100%', borderRadius: 3, background: 'var(--brand)', transition: 'width .3s' }} />
        </span>
        <span style={{ fontSize: 12, color: 'var(--soft)' }}>กำลังเปิดข้อมูลในเครื่อง</span>
      </div>
    </div>
  )
}

/* ---------- ตัวอย่างคอมโพเนนต์ (เทียบบอร์ด 33) ---------- */
function ComponentsDemo() {
  const [tile, setTile] = useState(0)
  const [a, setA] = useState(24)
  const [b, setB] = useState(12)
  return (
    <Page title="Components" sub="ชิ้นส่วนที่ใช้ซ้ำ · ทุกชิ้นกดได้ ≥ 44px">
      <Card title="ปุ่ม">
        <PrimaryButton>บันทึก</PrimaryButton>
        <DashedButton>เพิ่มแปลงใหม่</DashedButton>
        <div style={{ display: 'flex', gap: 8 }}><SecondaryButton>ยกเลิก</SecondaryButton><SecondaryButton>แก้ไข</SecondaryButton></div>
        <DeleteButton>ลบเซฟ</DeleteButton>
        <Caption>ปุ่มหลักมีได้ 1 ปุ่มต่อหน้า · ปุ่มลบใช้พื้นแดงอ่อน ไม่ใช้ไล่สี</Caption>
      </Card>
      <Card title="ทายล์เลือกหมวด" note="ไม่ใช้ปุ่มทรงแคปซูล">
        <div style={{ display: 'flex', gap: 8 }}>
          {['ฟาร์มหลัก', 'Ginger Island', 'อื่น ๆ'].map((l, i) => <Tile label={l} selected={tile === i} onClick={() => setTile(i)} />)}
        </div>
      </Card>
      <Card title="ตัวนับจำนวน" note="ปุ่ม เต็ม + ปุ่ม − / +">
        <Stepper value={a} onChange={setA} max={40} />
        <Stepper value={b} onChange={setB} />
        <Caption>ไม่มีช่องพิมพ์ตัวเลข · กด เต็ม เพื่อตั้งเท่าจำนวนสูงสุดทันที</Caption>
      </Card>
      <Card title="ป้ายสถานะ">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone="win">ใส่ปุ๋ยคุ้ม +1,200</Badge><Badge tone="note">ต่อวัน → Jar</Badge><Badge tone="warn">ไม่คุ้มปลูก</Badge><Badge>ตัวอย่าง</Badge>
        </div>
        <Caption>ป้ายสั้น ไม่เกิน 3–4 คำ · ข้อความยาวย้ายไปกล่องคำอธิบาย</Caption>
      </Card>
      <Card title="กล่องเปรียบเทียบ">
        <Compare items={[{ label: 'ต่อชิ้น', value: '+400' }, { label: 'ต่อวัน', value: '+123', win: true }]} />
        <Explain title="กล่องคำอธิบาย">ใช้อธิบายวิธีคิดสั้น ๆ ใต้ตัวเลข</Explain>
      </Card>
      <Card title="แถวรายการไอเท็ม" note="ชื่อไทยว่าง → แสดง ชื่อไทย" gap={0}>
        <ItemRow en="Ancient Fruit" th="ผลไม้โบราณ" />
        <ItemRow en="Pumpkin" th={null} />
      </Card>
      <Caption>ตัวเลขในหน้านี้เป็นตัวอย่างจากบอร์ด 33 ใช้เฉพาะหน้าตัวอย่างนี้</Caption>
    </Page>
  )
}

/* ---------- ตัวอย่างสถานะ (เทียบบอร์ด 34) ---------- */
function StatesDemo() {
  const [dlg, setDlg] = useState(true)
  return (
    <Page title="สถานะต่าง ๆ" sub="ว่าง · ออฟไลน์ · กำลังโหลด · เตือน · ยืนยันก่อนลบ">
      <SectionHead title="ว่าง (ยังไม่มีข้อมูล)" />
      <EmptyState title="ยังไม่มีแปลง" body="เพิ่มแปลงแรกแล้วเลือกสปริงเกลอร์ ระบบจะนับช่องปลูกให้เอง" action="เพิ่มแปลงใหม่" />
      <EmptyState title="ไม่พบที่ค้นหา" body="ลองพิมพ์ชื่อภาษาอังกฤษ หรือเลือกจากหมวดแทน" />
      <SectionHead title="ออฟไลน์" />
      <OfflineBanner />
      <SectionHead title="กำลังโหลด" note="ใช้เฉพาะตอนเปิดฐานข้อมูลครั้งแรก" />
      <Skeleton />
      <SectionHead title="เตือน" />
      <WarnBar title="ยังไม่ได้สำรองข้อมูล 9 วัน" body="กดสำรองก่อนล้างข้อมูลหรือเปลี่ยนเครื่อง" action="สำรองเลย" />
      <SectionHead title="ยืนยันก่อนลบ" />
      {dlg
        ? <ConfirmDelete title="ลบ เซฟ 2 ?" body="ข้อมูลฟาร์มทั้งหมดของเซฟนี้จะหายและกู้คืนไม่ได้ ถ้าเคยสำรองไว้ ยังกู้จากไฟล์ได้" onCancel={() => setDlg(false)} onConfirm={() => setDlg(false)} />
        : <SecondaryButton onClick={() => setDlg(true)}>แสดงกล่องยืนยันอีกครั้ง</SecondaryButton>}
    </Page>
  )
}

/* ---------- ทดสอบที่เก็บบน iPhone (ชั่วคราว ขั้น 0) ---------- */
type Probe = { count: number; first: string; last: string }
function StorageTest() {
  const [persisted, setPersisted] = useState<string>('…')
  const [quota, setQuota] = useState('…')
  const [probe, setProbe] = useState<Probe | null>(null)
  const [standalone] = useState(() => matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true)
  const refresh = async () => {
    setProbe((await get<Probe>('probe')) ?? null)
    if (navigator.storage?.persisted) setPersisted((await navigator.storage.persisted()) ? 'ได้ (persisted)' : 'ยังไม่ได้')
    else setPersisted('เบราว์เซอร์ไม่รองรับ')
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate()
      setQuota(`${((e.usage ?? 0) / 1024).toFixed(0)} KB / ${((e.quota ?? 0) / 1048576).toFixed(0)} MB`)
    }
  }
  useEffect(() => { refresh() }, [])
  const write = async () => {
    const now = new Date().toLocaleString('th-TH')
    const p = await get<Probe>('probe')
    await set('probe', { count: (p?.count ?? 0) + 1, first: p?.first ?? now, last: now })
    refresh()
  }
  const askPersist = async () => { await navigator.storage?.persist?.(); refresh() }
  const row = (k: string, v: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}><span style={{ color: 'var(--soft)' }}>{k}</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span></div>
  )
  return (
    <Page title="ทดสอบที่เก็บข้อมูล" sub="หน้าชั่วคราวของขั้น 0 · ตรวจว่า iPhone เก็บข้อมูลอยู่จริง">
      <Card title="สถานะเครื่อง">
        {row('เปิดแบบแอป (standalone)', standalone ? 'ใช่' : 'ไม่ใช่ (เปิดใน Safari)')}
        {row('ขอเก็บถาวร', persisted)}
        {row('ใช้ที่เก็บ', quota)}
        {row('เวอร์ชันแอป', __APP_VERSION__)}
      </Card>
      <Card title="ค่าทดสอบใน IndexedDB">
        {probe ? <>{row('บันทึกไปแล้ว', `${probe.count} ครั้ง`)}{row('ครั้งแรก', probe.first)}{row('ล่าสุด', probe.last)}</> : <Caption>ยังไม่มีค่า กดบันทึกด้านล่าง</Caption>}
      </Card>
      <PrimaryButton onClick={write}>บันทึกค่าทดสอบ</PrimaryButton>
      <div style={{ display: 'flex', gap: 8 }}><SecondaryButton onClick={askPersist}>ขอเก็บถาวร</SecondaryButton><SecondaryButton onClick={refresh}>อ่านใหม่</SecondaryButton></div>
      <Explain title="วิธีทดสอบ">เพิ่มแอปลงหน้าจอโฮม → กดบันทึก 1 ครั้ง → ปัดปิดแอป เปิดโหมดเครื่องบิน แล้วเปิดใหม่ → ตัวเลขต้องยังอยู่และแอปเปิดได้ · ลองอีกครั้งหลังรีสตาร์ต iPhone</Explain>
    </Page>
  )
}

/* ---------- หน้ารวมของขั้น 0 ใต้แท็บเพิ่มเติม ---------- */
type Sub = string
function Stage0Menu({ go }: { go: (s: Sub) => void }) {
  return (
    <Page title="เพิ่มเติม" sub="หน้าตรวจของขั้น 0–1 (ชั่วคราว)">
      <Card gap={8}>
        <SecondaryButton onClick={() => go('components')}>ตัวอย่างคอมโพเนนต์ (บอร์ด 33)</SecondaryButton>
        <SecondaryButton onClick={() => go('states')}>ตัวอย่างสถานะ (บอร์ด 34)</SecondaryButton>
        <SecondaryButton onClick={() => go('splash')}>Splash (บอร์ด 36)</SecondaryButton>
        <SecondaryButton onClick={() => go('storage')}>ทดสอบที่เก็บข้อมูล</SecondaryButton>
        <SecondaryButton onClick={() => go('data')}>ข้อมูลขั้น 1 (10 พืช + สำรอง/กู้)</SecondaryButton>
      </Card>
    </Page>
  )
}

function parseHash(): { tab: number; sub?: Sub } {
  const m = location.hash.match(/^#\/(\d)(?:\/([\w/-]+))?/)
  return m ? { tab: Math.min(4, +m[1]), sub: m[2] } : { tab: 0 }
}

export function App() {
  const [route, setRoute] = useState(parseHash)
  const [online, setOnline] = useState(navigator.onLine)
  const [boot, setBoot] = useState(0)
  useEffect(() => {
    const h = () => { setRoute(parseHash()); document.querySelector('main')?.scrollTo(0, 0) }
    const on = () => setOnline(navigator.onLine)
    addEventListener('hashchange', h); addEventListener('online', on); addEventListener('offline', on)
    navigator.storage?.persist?.().catch(() => {})
    // ขั้น 0 ยังไม่มีฐานข้อมูล: แสดง splash สั้น ๆ ระหว่างเปิด IndexedDB
    get('probe').finally(() => { setBoot(100); setTimeout(() => setBoot(-1), 350) })
    return () => { removeEventListener('hashchange', h); removeEventListener('online', on); removeEventListener('offline', on) }
  }, [])
  const nav = (tab: number, sub?: Sub) => { location.hash = `#/${tab}${sub ? '/' + sub : ''}` }

  let body
  const sub = route.sub ?? ''
  if (route.tab === 2) {
    body = <Catch key={sub}>{sub === 'island' ? <MyFarmIsland /> : sub === 'animals' ? <AnimalHousing /> : sub === 'greenhouse' ? <Greenhouse />
      : sub === 'buildings' ? <Buildings /> : sub === 'skills' ? <Skills /> : sub.startsWith('plot/') ? <EditPlot key={sub} id={sub.slice(5)} /> : <MyFarm />}</Catch>
  }
  else if (route.tab === 3) {
    body = <Catch key={sub}>{sub === 'fresh' ? <AdvisorFresh /> : sub === 'process' ? <AdvisorProcess /> : sub === 'seeds' ? <SeedPlan /> : sub === 'animals' ? <AnimalAdvisor /> : <Calculate />}</Catch>
  }
  else if (route.sub === 'components') body = <ComponentsDemo />
  else if (route.sub === 'states') body = <StatesDemo />
  else if (route.sub === 'storage') body = <StorageTest />
  else if (route.sub === 'data') body = <Stage1Data />
  else if (route.tab === 4) body = <Stage0Menu go={(s) => nav(4, s)} />
  else body = (
    <Page title={TABS[route.tab].label}>
      <EmptyState title="ยังไม่ได้สร้างหน้านี้" body="หน้านี้จะทำในขั้นถัดไป" />
    </Page>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--page-bg)' }}>
      {(boot >= 0 || route.sub === 'splash') && <div onClick={() => route.sub === 'splash' && nav(4)}><Splash progress={route.sub === 'splash' ? 45 : boot || 45} /></div>}
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {!online && <div style={{ padding: '52px 16px 0', marginBottom: -38 }}><OfflineBanner /></div>}
        {body}
      </main>
      {!(route.tab === 2 && sub.startsWith('plot/')) && <BottomNav tab={route.tab} onTab={(i) => nav(i)} />}
    </div>
  )
}
