// อัปเดตแอปเอง (ผู้ใช้กำหนด 6 พ.ย. 2569) — โหมด prompt: แอปคุมการรีเฟรชเอง
// เจอเวอร์ชันใหม่ → ถ้าไม่ได้กรอกฟอร์มอยู่ รีเฟรชทันที · ถ้ากรอกอยู่ รอจนออกจากหน้าฟอร์มหรือกลับมาเปิดแอปครั้งถัดไป (ข้อมูลที่กรอกไม่หาย)
import { registerSW } from 'virtual:pwa-register'

// กำลังเปิด bottom sheet/ป๊อปอัป หรือกำลังพิมพ์ในช่องใดก็ตาม
const busy = () => {
  if (document.querySelector('.sheet, .dialog')) return true
  const el = document.activeElement
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
}

let pending = false
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    pending = true
    tryApply()
  },
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}) }
    setInterval(check, 60_000) // ตัวเสริม — iOS หยุดตัวจับเวลาตอนอยู่เบื้องหลัง
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      tryApply()
      check() // สำคัญที่สุดบน iPhone
    })
  },
})

function tryApply() {
  if (pending && !busy()) updateSW(true)
}
// ออกจากหน้าฟอร์ม / เลิกพิมพ์ → อัปเดตที่รออยู่
addEventListener('hashchange', tryApply)
document.addEventListener('focusout', () => setTimeout(tryApply, 300))
