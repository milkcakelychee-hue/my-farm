#!/usr/bin/env python3
"""ย่อรูปใหญ่ใน public/img (รูปสถานที่ SVE ฯลฯ) ให้กว้างไม่เกิน 780px และบีบเป็น JPEG
แต่คงชื่อไฟล์ .png ไว้ให้ตรงกับฐานข้อมูล (เบราว์เซอร์ดูชนิดรูปจากเนื้อไฟล์เอง)
เฉพาะไฟล์ที่ใหญ่กว่า 150 KB เท่านั้น ไอคอนพิกเซลเล็ก ๆ ไม่ถูกแตะ"""
import glob, io, os, sys
from PIL import Image
root = sys.argv[1] if len(sys.argv) > 1 else 'public/img'
n = 0
for f in glob.glob(os.path.join(root, '*.png')):
    if os.path.getsize(f) < 150 * 1024: continue
    im = Image.open(f).convert('RGB')
    w, h = im.size
    if w > 780: im = im.resize((780, round(h * 780 / w)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=82)
    open(f, 'wb').write(buf.getvalue()); n += 1
print(f'shrunk {n} image(s)')
