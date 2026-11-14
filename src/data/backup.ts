// สำรอง / กู้ข้อมูล (บอร์ด 29b) — ไฟล์ JSON มีเลขเวอร์ชันเพื่อกู้ไฟล์เก่าได้
import { SAVE_SCHEMA_VERSION, MAX_SAVES, listSaves, putSave, type SaveData } from './save'

export const BACKUP_FORMAT = 'my-farm-backup'
export interface BackupFile { format: typeof BACKUP_FORMAT; schema_version: number; exported_at: string; saves: SaveData[] }

export async function buildBackup(onlyId?: string): Promise<BackupFile> {
  const saves = (await listSaves()).filter((s) => !onlyId || s.id === onlyId)
  return { format: BACKUP_FORMAT, schema_version: SAVE_SCHEMA_VERSION, exported_at: new Date().toISOString(), saves }
}

export function backupFileName(b: BackupFile, label = 'ทั้งหมด') {
  return `myfarm-${label}-${b.exported_at.slice(0, 10)}.json`
}

/** ย้ายเซฟเวอร์ชันเก่าขึ้นเวอร์ชันปัจจุบัน — เพิ่มขั้นที่นี่ทุกครั้งที่ขึ้น SAVE_SCHEMA_VERSION */
function migrate(s: SaveData, from: number): SaveData {
  if (from > SAVE_SCHEMA_VERSION) throw new Error('ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า อัปเดตแอปก่อนแล้วลองอีกครั้ง')
  return { ...s, schema_version: SAVE_SCHEMA_VERSION }
}

export function parseBackup(text: string): BackupFile {
  let j: any
  try { j = JSON.parse(text) } catch { throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ My Farm') }
  if (j?.format !== BACKUP_FORMAT || !Array.isArray(j.saves) || typeof j.schema_version !== 'number')
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ My Farm')
  for (const s of j.saves) if (typeof s?.id !== 'string' || typeof s?.name !== 'string' || !s?.date) throw new Error('ข้อมูลเซฟในไฟล์ไม่ครบ')
  return { ...j, saves: j.saves.map((s: SaveData) => migrate(s, j.schema_version)) }
}

/** กู้จากไฟล์: เซฟที่ id ตรงกันจะถูกเขียนทับ (UI ต้องเตือนก่อนตามบอร์ด 29b) */
export async function restoreBackup(b: BackupFile): Promise<{ restored: number; overwritten: number }> {
  const existing = new Set((await listSaves()).map((s) => s.id))
  const incomingNew = b.saves.filter((s) => !existing.has(s.id)).length
  if (existing.size + incomingNew > MAX_SAVES) throw new Error(`เก็บได้สูงสุด ${MAX_SAVES} เซฟ ลบเซฟเดิมก่อนกู้`)
  for (const s of b.saves) await set(s)
  return { restored: b.saves.length, overwritten: b.saves.length - incomingNew }
  async function set(s: SaveData) { await putSave(s) }
}

export function downloadBackup(b: BackupFile, label?: string) {
  const blob = new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = backupFileName(b, label)
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
