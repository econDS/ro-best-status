# RO Best Status

เว็บภาษาไทยสำหรับหา Status ที่ดีที่สุดในการ **สร้าง Rune**, **ทำยาแอส (Poison)** และ **ปรุงยา (Potion)** ตามสูตรที่เผยแพร่บน **iRO Wiki** โดยใช้ต้นทุน/งบ Status จาก [econDS/RO-help-tool](https://github.com/econDS/RO-help-tool/tree/1cc20f489887228eec0ff5b91e4c5fe71c75961f)

- Static HTML/CSS/JavaScript, ไม่มี backend หรือ runtime dependency
- รันใน browser และ deploy บน GitHub Pages ได้
- เปรียบเทียบค่าปัจจุบันกับค่าที่ดีที่สุดภายใต้งบแต้ม
- รองรับการอัปต่อจากค่าเดิม หรือรีเซ็ตทุกค่าเป็น1
- โบนัส Status คงที่ไม่เสียแต้ม และไม่เปลี่ยนลำดับคำตอบที่ดีที่สุด
- ใช้ **exact dynamic programming แบบ score-indexed**, ไม่ใช้ brute force หรือ greedy approximation

## สูตรที่ตรวจเทียบกับ iRO Wiki

ตรวจเอกสารวันที่ **2026-09-30** เป็นสูตรที่ชุมชนเผยแพร่ ไม่ใช่การทดสอบเซิร์ฟเวอร์หรือสูตรทางการจาก Gravity

| กิจกรรม / สกิล | สูตรดิบ (%) | สถานะ |
|---|---|---|
| Rune Mastery | 30 + 2×Skill + DEX/30 + LUK/10 + Job/10 + Stone − Rank | ปรับตามสูตรหลังแพตช์2022-10-13ที่ Wiki ระบุ |
| Create Deadly Poison | 20 + 0.4×DEX + 0.2×LUK | ตรงกับสูตรต้นทาง |
| Prepare Potion | 3×Prepare Potion + Potion Research + Instruction Change + Job/5 + DEX/10 + LUK/10 + INT/20 + Potion_Rate | **Wiki ระบุว่าสูตรยังมีข้อโต้แย้ง**; บางชนิดระบุ Potion_Rate เป็นช่วง |

- **Rune:** เลือก Rune Mastery, Job Level, Rune Stone และสูตรRuneจริง ระบบใช้Rankและตรวจขั้นต่ำสกิลตามสูตรที่เลือก
- **Poison:** คำนวณ Poison Bottle จาก **Create Deadly Poison** ไม่ใช่ New Poison Creation ของ Guillotine Cross
- **Potion:** คำนวณ **Prepare Potion** ที่สืบทอดจากAlchemist ไม่ใช่ Special Pharmacy ของGenetic เลือกสกิล, Job, Instruction Change (0หากไม่ใช้) และชนิดยา
- DEX/LUK/INT ในสูตรใช้ Base Stat + โบนัสรวมจาก Job/อุปกรณ์/บัฟที่กรอก
- ช่วงPotionแสดงค่าต่ำ–สูงตามเอกสาร **ไม่เฉลี่ยกลาง ไม่สุ่ม และไม่อ้างว่าเป็นช่วงความเชื่อมั่น**
- หน้าสูตรไม่ได้ระบุกฎปัดเศษหรือเพดานโอกาสคราฟต์ที่ชัดเจน จึง optimize **ค่าดิบ** และไม่ถือว่า100%เป็นการรับประกันผล ตัวเลขอาจเกิน100%; แถบภาพจำกัด0–100เพื่อแสดงผลเท่านั้น
- ตัว optimizer ให้คำตอบดีที่สุดแน่นอนสำหรับสมการที่เลือก แต่ความแม่นยำของสมการในเกมขึ้นกับเอกสารและแพตช์ ไม่อาจยืนยันด้วยคณิตศาสตร์ของoptimizer

เทียบหลายแหล่งแล้ว: iRO Wiki, โค้ดrAthenaที่pin commit, เอกสารทางการและรายงานผู้เล่น โดยแยกความน่าเชื่อถือและความขัดแย้ง ไม่ถือว่าemulatorเป็นหลักฐานตรงของiRO เช่น Lux Anima: Wikiหัก20 แต่rAthenaหัก15; แอปใช้Wiki20 ความต่างนี้เปลี่ยนอัตราดิบ5ppแต่ไม่เปลี่ยนชุดStatusที่ดีที่สุด เพราะเป็นค่าคงที่

ดูรายละเอียดการเปรียบเทียบ,ลิงก์โค้ด,ตารางmodifierและข้อจำกัดที่ [SOURCE_NOTES.md](SOURCE_NOTES.md)

ต้นทุนเพิ่ม Status จาก s → s+1:
- s ≤99: floor((s−1)/10)+2
- s ≥100: 16+4×floor((s−100)/5)

งบเริ่มต้น48 (ปกติ) หรือ100 (Transcended) บวกแต้มจากการเพิ่มเลเวลตาม `gen_config.py` ของแหล่งอ้างอิง ค่า99/130เป็นเพดาน base stat; โบนัสแยกต่างหาก

อ้างอิงต้นทุน/งบ Status (ยังคงใช้snapshotต้นทาง ไม่ได้อ้างว่าเป็นตารางทุกคลาส/ทุกแพตช์ปัจจุบันของiRO):
- [สูตร Rune/Poison/Potion Class3](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/class3.py)
- [สูตร Assassin Cross](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/high_class.py)
- [สูตร Alchemist](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/class2.py)
- [การสร้างตารางแต้มและค่าอัป](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/gen_config.py)
- [การกำหนดเพดาน Status](https://github.com/econDS/RO-help-tool/blob/1cc20f489887228eec0ff5b91e4c5fe71c75961f/domain/player.py)

แหล่งสูตรอัตราสำเร็จ: [Rune Mastery](https://irowiki.org/wiki/Rune_Mastery), [Create Deadly Poison](https://irowiki.org/wiki/Create_Deadly_Poison), [Potion Creation](https://irowiki.org/wiki/Potion_Creation), [Instruction Change](https://irowiki.org/wiki/Instruction_Change)

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

การตรวจ parity: ต้นทุนครบ130ค่าและงบเลเวลครบ400ค่า (200เลเวล×2โหมด) ตรงกับsnapshot RO-help-tool สูตรRune/PotionถูกปรับแยกตามiRO Wikiแล้ว จึงไม่คาดหวังอัตราสำเร็จเท่ากับค่าคงที่เดิม ตัวคูณStatusไม่เปลี่ยนจึงยังใช้score-indexed DPเดิมได้ และrecipeช่วงต่ำ/สูงให้ชุดStatusเหมาะที่สุดชุดเดียวกัน
