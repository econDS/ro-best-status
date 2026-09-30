# RO Best Status

เว็บภาษาไทยสำหรับหา Status ที่ดีที่สุดในการ **สร้าง Rune**, **ทำยาแอส (Poison)** และ **ปรุงยา (Potion)** ตามสูตรของ [econDS/RO-help-tool](https://github.com/econDS/RO-help-tool/tree/1cc20f489887228eec0ff5b91e4c5fe71c75961f)

- Static HTML/CSS/JavaScript, ไม่มี backend หรือ runtime dependency
- รันใน browser และ deploy บน GitHub Pages ได้
- เปรียบเทียบค่าปัจจุบันกับค่าที่ดีที่สุดภายใต้งบแต้ม
- รองรับการอัปต่อจากค่าเดิม หรือรีเซ็ตทุกค่าเป็น1
- โบนัส Status คงที่ไม่เสียแต้ม และไม่เปลี่ยนลำดับคำตอบที่ดีที่สุด
- ใช้ **exact dynamic programming แบบ score-indexed**, ไม่ใช้ brute force หรือ greedy approximation

## ขอบเขตของสูตร

นี่คือเครื่องมือ optimize **แบบจำลองจาก repo อ้างอิง** ไม่ใช่การยืนยันอัตราสำเร็จจริงของทุกเซิร์ฟเวอร์ สูตรต้นฉบับมี `todo: enhance this formula` และตรึงค่าทักษะ/Job ไว้ ส่วนความต่างของไอเท็ม อุปกรณ์ และเซิร์ฟเวอร์ไม่ได้ถูกจำลอง หากเพิ่มโบนัสเอง ผลลัพธ์อาจเกิน100%; ตัวเลขแสดงค่าจากสูตรดิบ ส่วนแถบภาพจำกัด0–100

| กิจกรรม | สูตรอัตราสำเร็จ (%) | Integer objective |
|---|---|---|
| Rune | 71 + DEX/30 + LUK/10 + 14/10 + 2 − 5 | DEX + 3 LUK |
| Poison | 20 + 0.4 DEX + 0.2 LUK | 2 DEX + LUK |
| Potion | 40 + 70×0.2 + 0.1 DEX + 0.1 LUK + 0.05 INT | 2 DEX + 2 LUK + INT |

ต้นทุนเพิ่ม Status จาก s → s+1:
- s ≤99: floor((s−1)/10)+2
- s ≥100: 16+4×floor((s−100)/5)

งบเริ่มต้น48 (ปกติ) หรือ100 (Transcended) บวกแต้มจากการเพิ่มเลเวลตาม `gen_config.py` ของแหล่งอ้างอิง ค่า99/130เป็นเพดาน base stat; โบนัสแยกต่างหาก

อ้างอิงที่ตรวจสอบ:
- [สูตร Rune/Poison/Potion Class3](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/class3.py)
- [สูตร Assassin Cross](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/high_class.py)
- [สูตร Alchemist](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/class2.py)
- [การสร้างตารางแต้มและค่าอัป](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/gen_config.py)
- [การกำหนดเพดาน Status](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/player.py)

เป็น implementation ใหม่จากสมการและข้อมูลแบบจำลอง ไม่ได้คัดลอก UI หรือ implementation ของ repo เดิม

## ทำไมเร็วและยังได้คำตอบดีที่สุด

คูณน้ำหนักของแต่ละสูตรให้เป็นจำนวนเต็มเล็กๆ แล้วกำหนด DP[i][q] เป็น **ต้นทุนต่ำที่สุดเพื่อเพิ่ม score ให้ได้ q หลังพิจารณา i stats**

สำหรับแต่ละ stat พิจารณาค่าสุดท้ายที่เป็นไปได้และรวมเข้ากับสถานะก่อนหน้า เก็บเฉพาะต้นทุนต่ำที่สุดของ score เดียวกัน เพราะสถานะที่ใช้แต้มมากกว่าแต่ score เท่ากันไม่สามารถชนะได้ในอนาคต สุดท้ายเลือก score สูงที่สุดที่ต้นทุนไม่เกินงบ ด้วย induction ตามจำนวน stats DP เก็บทางเลือกที่ดีที่สุดครบทุก score จึงให้ global optimum ของสูตรนี้

- เวลา O(n × Q × S), หน่วยความจำ O(n × Q) สำหรับ reconstruction
- n ≤3 stats, S ≤130, Q ≤645 (คะแนนเพิ่มสูงสุดของPotion)
- ไม่โตตามงบแต้ม และไม่ไล่ combinations แบบ Sⁿ
- กรณีคะแนนเท่ากัน: ใช้แต้มน้อยที่สุด แล้วเลือกเส้นทางแรกอย่าง deterministic
- ค่า STR/AGI/VIT หรือ stat ที่ไม่อยู่ในสูตรยังคงเสียแต้มและถูกเก็บไว้ในโหมดอัปต่อ

Greedy ตามอัตราผลตอบแทน/ต้นทุนไม่รับประกันคำตอบที่ดีที่สุด เช่น Rune งบ162 เริ่มDEX=LUK=1: greedy ที่เสมอแล้วเลือกDEXก่อนให้คะแนนเพิ่ม130 แต่DPให้131

## ใช้งานและทดสอบ

ต้องใช้ Node.js20+ สำหรับ tests เท่านั้น ตัวเว็บไม่ต้องติดตั้งแพ็กเกจ

```sh
npm test
npm run benchmark
npm run serve
# เปิด http://localhost:4173
```

Tests ใช้ exhaustive oracle **เฉพาะใน tests** เทียบคำตอบทุกงบ0–100กับเพดาน2/4/7/11ทุกกิจกรรม รวมทั้งต้นทุน/แต้มที่ขอบช่วง, โบนัส, current stats, saturated budget, invalid inputs และ greedy counterexample

ผล benchmark ตัวอย่างใน cloud Node24 (500ครั้งต่อกิจกรรม หลังwarmup; ไม่ใช่การรับประกันทุกอุปกรณ์): Rune0.305ms, Poison0.329ms, Potion0.964ms สำหรับเลเวล200/transcended/cap130

## เปิดใช้งาน

[เปิด RO Best Status บน GitHub Pages](https://econds.github.io/ro-best-status/)

ทุก asset ใช้ relative URL จึงรองรับ project Pages ภายใต้ `/ro-best-status/` โดยไม่ต้องเปลี่ยน base path และไม่มี build step

การตรวจ parity กับ source ณ commitข้างต้น: ต้นทุนครบ130ค่าและงบเลเวลครบ400ค่า (200เลเวล×2โหมด) ตรงกันทั้งหมด; อัตราสำเร็จของ18เคส (เลเวล99/150/200 × normal/transcended ×3กิจกรรม) ตรงกับ Python DP ต้นฉบับด้วย tolerance1e−9 สัดส่วน Status อาจต่างกันในคำตอบที่คะแนนเท่ากัน เพราะแอปนี้เลือกใช้แต้มน้อยที่สุดเป็นเกณฑ์รอง
