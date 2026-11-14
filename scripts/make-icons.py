# ย่อไอคอนต้นฉบับของ Blue (../icon-1024.png) เป็นทุกขนาดที่ PWA ต้องใช้
# ต้นฉบับเว้นขอบ 2/20 ช่อง (=10%) อยู่แล้ว จึงใช้เป็น maskable ได้เลย
from PIL import Image
src = Image.open('../icon-1024.png').convert('RGB')
src.save('public/icon-1024.png')
for s, n in [(512,'icon-512.png'),(192,'icon-192.png'),(180,'apple-touch-icon.png'),(512,'icon-maskable-512.png')]:
    src.resize((s,s), Image.LANCZOS).save('public/'+n)
