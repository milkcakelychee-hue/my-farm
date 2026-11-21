// รูปไอคอนทุกรูปที่ดาวน์โหลดแล้ว (image.id -> ชื่อไฟล์ใน public/img) โหลดครั้งเดียวตอนเปิดแอป
import { useEffect, useState } from 'preact/hooks'
import { query } from './gamedb'

let map: Record<string, string> = {}
let ready: Promise<void> | null = null
export const loadIcons = () => (ready ??= query<{ id: string; f: string }>(`SELECT id, file_path f FROM image WHERE status = 'downloaded'`)
  .then((rows) => { map = Object.fromEntries(rows.map((r) => [r.id, r.f.split('/').pop()!])) }).catch(() => {}))
/** ชื่อไฟล์ของรูป id (เช่น 'img_building_barn') หรือ undefined ถ้ายังไม่มีรูป */
export const icon = (id?: string | null) => (id ? map[id] : undefined)
/** ให้คอมโพเนนต์วาดใหม่เมื่อโหลดรายการรูปเสร็จ */
export function useIconsReady() {
  const [, set] = useState(0)
  useEffect(() => { loadIcons().then(() => set(1)) }, [])
}
