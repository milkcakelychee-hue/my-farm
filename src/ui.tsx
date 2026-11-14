// คอมโพเนนต์ระบบดีไซน์ — ค่าทุกตัวคัดจากบอร์ด 33 (DS_Components) และ 34 (DS_States)
import type { ComponentChildren, JSX } from 'preact'

type S = JSX.CSSProperties

const PLUS = 'M12 5v14M5 12h14'
const MINUS = 'M5 12h14'
export function Icon({ d, size = 18, color = 'var(--ink)', width = 2.8 }: { d: string; size?: number; color?: string; width?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width={width} stroke-linecap="round" stroke-linejoin="round">
      <path d={d} />
    </svg>
  )
}

/* ---------- หน้า / การ์ด ---------- */
export function Page({ title, sub, children }: { title: string; sub?: string; children?: ComponentChildren }) {
  return (
    <div style={{ padding: '52px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{title}</h1>
        {sub && <span style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--soft)' }}>{sub}</span>}
      </div>
      {children}
    </div>
  )
}

export function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 15, fontWeight: 800 }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--soft)' }}>{note}</span>
    </div>
  )
}

export function Card({ title, note, children, gap = 10 }: { title?: string; note?: string; children?: ComponentChildren; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, padding: 14, borderRadius: 'var(--r-card)', background: 'var(--card)', boxShadow: 'var(--sh-card)' }}>
      {title && <SectionHead title={title} note={note} />}
      {children}
    </div>
  )
}

export function Caption({ children }: { children: ComponentChildren }) {
  return <span style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--soft)' }}>{children}</span>
}

/* ---------- ปุ่ม ---------- */
export function PrimaryButton({ children, onClick, style }: { children: ComponentChildren; onClick?: () => void; style?: S }) {
  return (
    <button onClick={onClick} style={{ width: '100%', height: 56, border: 0, borderRadius: 28, background: 'var(--brand)', boxShadow: 'var(--sh-primary)', color: 'var(--ink)', fontSize: 17, fontWeight: 700, ...style }}>
      {children}
    </button>
  )
}

export function DashedButton({ children, onClick }: { children: ComponentChildren; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 0, borderRadius: 20, background: 'transparent', boxShadow: 'inset 0 0 0 2px var(--slot-line)', color: 'var(--amber-deep)', fontSize: 15, fontWeight: 700 }}>
      <Icon d={PLUS} color="var(--amber-deep)" />
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick }: { children: ComponentChildren; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ flex: 1, height: 44, border: 0, borderRadius: 14, background: 'var(--card)', boxShadow: 'inset 0 0 0 1.5px var(--hairline)', color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>
      {children}
    </button>
  )
}

export function DeleteButton({ children, onClick }: { children: ComponentChildren; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', height: 48, border: 0, borderRadius: 16, background: 'var(--warn-bg)', color: 'var(--warn)', fontSize: 14, fontWeight: 700 }}>
      {children}
    </button>
  )
}

/* ---------- ช่องไอคอน (ยังไม่มีรูป) ---------- */
export function Slot({ size = 34, radius = 10 }: { size?: number; radius?: number }) {
  return <span aria-hidden="true" style={{ flex: 'none', width: size, height: size, borderRadius: radius, border: '2px dashed var(--slot-line)', background: 'var(--slot-bg)' }} />
}

/* ---------- ทายล์เลือก ---------- */
export function Tile({ label, selected, onClick, icon }: { label: string; selected?: boolean; onClick?: () => void; icon?: ComponentChildren }) {
  return (
    <button aria-pressed={selected} onClick={onClick} style={{
      flex: 1, minWidth: 0, height: 84, padding: '8px 4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, border: 0, borderRadius: 'var(--r-tile)', color: 'var(--ink)',
      ...(selected
        ? { background: 'var(--brand-160)', boxShadow: '0 3px 8px rgba(247,164,65,.3)', fontWeight: 700 }
        : { background: 'var(--card)', boxShadow: 'inset 0 0 0 1.5px var(--hairline)', fontWeight: 600 }),
    }}>
      {icon ?? <Slot />}
      <span style={{ fontSize: 13 }}>{label}</span>
    </button>
  )
}

/* ---------- ตัวนับ ---------- */
const stepBtn: S = { width: 44, height: 44, border: 0, borderRadius: 12, background: 'var(--sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
export function Stepper({ value, onChange, max, min = 0 }: { value: number; onChange: (v: number) => void; max?: number; min?: number }) {
  const clamp = (v: number) => Math.max(min, max == null ? v : Math.min(max, v))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {max != null && (
        <button onClick={() => onChange(max)} style={{ height: 44, padding: '0 14px', border: 0, borderRadius: 12, background: 'var(--explain-bg)', boxShadow: 'inset 0 0 0 1.5px var(--explain-line)', color: 'var(--amber-deep)', fontSize: 14, fontWeight: 700 }}>
          เต็ม {max}
        </button>
      )}
      <span style={{ flex: 1 }} />
      <button aria-label="ลด" style={stepBtn} onClick={() => onChange(clamp(value - 1))}><Icon d={MINUS} /></button>
      <span style={{ minWidth: 34, textAlign: 'center', fontSize: 20, fontWeight: 800 }}>{value}</span>
      <button aria-label="เพิ่ม" style={stepBtn} onClick={() => onChange(clamp(value + 1))}><Icon d={PLUS} /></button>
    </div>
  )
}

/* ---------- ป้ายสถานะ ---------- */
const BADGE = {
  win: ['var(--win-bg)', 'var(--win-ink)'],
  note: ['var(--note-bg)', 'var(--note-ink)'],
  warn: ['var(--warn-bg)', 'var(--warn)'],
  neutral: ['var(--sunken)', 'var(--soft)'],
} as const
export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof BADGE; children: ComponentChildren }) {
  const [bg, fg] = BADGE[tone]
  return <span style={{ display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 10px', borderRadius: 8, background: bg, color: fg, fontSize: 12, fontWeight: 700 }}>{children}</span>
}

/* ---------- กล่องเปรียบเทียบ 2 ช่อง ---------- */
export function Compare({ items }: { items: { label: string; value: string; win?: boolean }[] }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {items.map((it) => (
        <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 14, ...(it.win ? { background: 'var(--win-bg)', boxShadow: 'inset 0 0 0 2px var(--win-line)' } : { background: 'var(--sunken)' }) }}>
          <span style={{ fontSize: 12, color: 'var(--soft)' }}>{it.label}</span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>{it.value}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: it.win ? 'var(--win-ink)' : 'transparent' }}>{it.win ? '✓ ดีกว่า' : '.'}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- กล่องอธิบาย ---------- */
export function Explain({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 16, background: 'var(--explain-bg)', boxShadow: 'inset 0 0 0 1.5px var(--explain-line)' }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--body2)' }}>{children}</span>
    </div>
  )
}

/* ---------- แถวไอเท็ม: EN บรรทัดแรก ไทยบรรทัดสอง ("ชื่อไทย" ถ้ายังไม่มี) ---------- */
export function ItemRow({ en, th, onClick }: { en: string; th: string | null; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', minHeight: 68, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', border: 0, background: 'none', textAlign: 'left', color: 'var(--ink)' }}>
      <Slot size={48} radius={10} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{en}</span>
        <span style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.3, color: 'var(--soft)' }}>{th ?? 'ชื่อไทย'}</span>
      </span>
      <Icon d="M9 6l6 6-6 6" size={20} color="var(--soft)" width={2.2} />
    </button>
  )
}

/* ---------- สถานะ (บอร์ด 34) ---------- */
export function EmptyState({ title, body, action, onAction }: { title: string; body?: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', padding: '18px 14px', borderRadius: 'var(--r-card)', background: 'var(--card)', boxShadow: 'var(--sh-card)' }}>
      <Slot size={64} radius={18} />
      <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.35 }}>{title}</span>
      {body && <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--soft)' }}>{body}</span>}
      {action && (
        <button onClick={onAction} style={{ marginTop: 4, height: 48, padding: '0 22px', border: 0, borderRadius: 24, background: 'var(--brand)', boxShadow: '0 5px 14px rgba(247,164,65,.32)', color: 'var(--ink)', fontSize: 15, fontWeight: 700 }}>
          {action}
        </button>
      )}
    </div>
  )
}

export function OfflineBanner() {
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 16, background: 'var(--note-bg)', boxShadow: 'inset 0 0 0 1.5px var(--explain-line)' }}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A4B0C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 017 0" /><path d="M5 12.5a10 10 0 015-2.5" /><path d="M19 12.5a10 10 0 00-3-1.900" /><circle cx="12" cy="20" r=".8" />
      </svg>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--note-ink)' }}>ออฟไลน์อยู่ · ใช้ได้ตามปกติ</span>
        <span style={{ fontSize: 12, color: 'var(--body2)' }}>ข้อมูลทั้งหมดอยู่ในเครื่อง ไม่ต้องใช้เน็ต</span>
      </span>
    </div>
  )
}

const shimmer: S = { display: 'block', borderRadius: 7, background: 'linear-gradient(90deg,#ECE6DC 0%,#F6F0E4 50%,#ECE6DC 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }
export function Skeleton() {
  return (
    <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 'var(--r-card)', background: 'var(--card)', boxShadow: 'var(--sh-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--empty)' }} />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ ...shimmer, width: '60%', height: 16 }} />
          <span style={{ ...shimmer, width: '35%', height: 12 }} />
        </span>
      </div>
      <span style={{ ...shimmer, width: '100%', height: 14 }} />
      <span style={{ ...shimmer, width: '82%', height: 14 }} />
    </div>
  )
}

export function WarnBar({ title, body, action, onAction }: { title: string; body: string; action: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, background: 'var(--warn-bg)' }}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--warn)' }}>{title}</span>
        <span style={{ fontSize: 12.5, color: 'var(--body2)' }}>{body}</span>
      </span>
      <button onClick={onAction} style={{ flex: 'none', height: 40, padding: '0 14px', border: 0, borderRadius: 12, background: 'var(--card)', color: 'var(--warn)', fontSize: 13, fontWeight: 700 }}>{action}</button>
    </div>
  )
}

export function ConfirmDelete({ title, body, onCancel, onConfirm, confirmLabel = 'ลบเลย' }: { title: string; body: string; onCancel: () => void; onConfirm: () => void; confirmLabel?: string }) {
  return (
    <div role="alertdialog" aria-label={title} class="dialog" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 24, background: 'var(--card)', boxShadow: 'var(--sh-dialog)' }}>
      <span style={{ fontSize: 17, fontWeight: 800 }}>{title}</span>
      <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--soft)' }}>{body}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, height: 48, border: 0, borderRadius: 14, background: 'var(--sunken)', color: 'var(--ink)', fontSize: 15, fontWeight: 700 }}>ยกเลิก</button>
        <button onClick={onConfirm} style={{ flex: 1, height: 48, border: 0, borderRadius: 14, background: 'var(--warn)', color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>{confirmLabel}</button>
      </div>
    </div>
  )
}

/* ค่าที่ฐานข้อมูลยังไม่มี: ใช้รูปแบบสถานะว่างของบอร์ด 34 */
export function NoData() {
  return <EmptyState title="ยังไม่มีข้อมูล" body="ฐานข้อมูลยังไม่มีค่านี้" />
}
