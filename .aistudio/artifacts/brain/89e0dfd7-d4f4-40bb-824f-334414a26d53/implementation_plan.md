# แผนการพัฒนา: ปรับปรุงระบบจับคู่แท็กจาก Sheet (ดึงเฉพาะ `#` ในคอลัมน์ B) & เครื่องมือสแกนล้างแท็กชื่อคลิปออกจากคลัง

## 1. ภาพรวมของแนวทางแก้ไข (Solution Overview)

### 1.1 แก้ไขตัวดึงแท็กจาก Sheet ให้ดึงเฉพาะคำที่มี `#` นำหน้าในคอลัมน์ B เท่านั้น (`sheetImportParser.ts` & `SheetTagImportModal.tsx`)
1. **Strict Hashtag Extraction (`/#([^\s#,]+)/g`)**:
   - เปลี่ยนวิธีอ่านคอลัมน์ B จากเดิมที่ใช้ `.split(/[#,\s]+/)` (ซึ่งทำให้ข้อความธรรมดาหรือชื่อคลิปที่ไม่มี `#` ถูกหั่นกลายเป็นแท็ก) มาเป็นการดึง**เฉพาะคำที่มีเครื่องหมาย `#` นำหน้าอย่างชัดเจนเท่านั้น**
   - กรองคำที่เป็นหมายเลขตอน (เช่น `#1`, `#EP1`, `EP.1`) หรือลิงก์ URL ไม่ให้หลุดมาเป็นแท็กหมวดหมู่
2. **ยกเลิกการดึงชื่อคลิปหลัก (คอลัมน์ D) มาสร้างเป็น `#แท็กหมวดหมู่`**:
   - ปรับค่าเริ่มต้น `includeSeriesTagOnFootage` เป็น `false`
   - ยกเลิกการเรียก `ensureTagExists(group.primaryTagName, true)` จากคอลัมน์ D ตอนสร้าง EP — ให้ EP ใช้หมวดหมู่หลักจากแท็ก `#...` ที่มีอยู่ในคอลัมน์ B ของฟุตเทจในกลุ่มนั้นแทน เพื่อไม่ให้ชื่อคลิป EP (เช่น `พี่เสกสุดฮา EP.1` หรือ `5 อันดับ...`) ถูกนำไปสร้างเป็น `#แท็ก` ใหม่อีกต่อไป

---

### 1.2 เพิ่มเครื่องมือค้นหาและลบแท็กที่เป็นชื่อคลิป / แท็กขยะออกจากคลัง (`JunkTagCleanupModal.tsx`)
1. **ระบบตรวจจับแท็กที่เป็นชื่อคลิปอัตโนมัติ (Smart Clip-Title & Junk Tag Detector)**:
   - สแกนแท็กทั้งหมดในคลังและคัดกรองแท็กต้องสงสัยออกเป็นกลุ่มให้เลือกติ๊กลบได้ทันที:
     - **ตรงกับชื่อฟุตเทจย่อยหรือชื่อ EP ในคลัง**: แท็กที่มีชื่อตรงกับ `footage.title`, `episode.title` หรือ `episode.seriesTitle`
     - **แท็กที่ถูกสร้างจากชื่อ EP อัตโนมัติ**: แท็กที่มีคำว่า `EP.`, `อันดับ`, `สุดฮา`, หรือมีคำอธิบาย `"สร้างอัตโนมัติจากชื่อรายการจัดอันดับใน Google Sheets"`
     - **แท็กที่ไม่มีคลิปใช้งาน (`0 คลิป`) หรือประโยคยาวผิดปกติ**: แท็กที่ไม่ได้ผูกกับคลิปใดเลย หรือมีความยาวเกินชื่อหมวดหมู่ปกติ
2. **ระบบลบแท็กแบบกลุ่มความเร็วสูง (`batchDeleteTags` + Cloud Firestore Sync)**:
   - ลบแท็กที่เลือกออกจากรายการหมวดหมู่ทั้งหมดในคลิกเดียว
   - ถอดรหัสแท็กที่ถูกลบออกจาก `footage.tags` และ `sources.tags` อัตโนมัติ (หากคลิปใดถอดแท็กขยะออกแล้วไม่เหลือหมวดหมู่อื่น ระบบจะส่งกลับเข้า **"ไม่มีหมวดหมู่ (Staging)"** อย่างปลอดภัย ไม่ทำให้คลิปหาย)
   - ซิงก์การลบขึ้น Cloud (Firestore) ทันทีเพื่อให้ทุกเครื่องเห็นหมวดหมู่ที่สะอาดตรงกัน
3. **จุดกดเรียกใช้งานสะดวก 2 จุด**:
   - ปุ่ม **"ล้างแท็กชื่อคลิป/แท็กขยะ"** บนแถบด้านขวาบนของหน้าต่าง **ซิงก์แท็กจาก Sheet (`SheetTagImportModal`)**
   - ปุ่ม **"ล้างแท็กชื่อคลิป/แท็กขยะ"** ในหน้าต่าง **จัดการหมวดหมู่ 3 ระดับ (`ThreeTierCategoryManagerModal`)**

---

## 2. รายละเอียดการแก้ไขไฟล์ (File Changes)

1. **`src/components/footage/sheetImport/sheetImportParser.ts`**:
   - เพิ่มฟังก์ชัน `extractHashtagsOnly(rawColB: string): string[]` ที่ดึงเฉพาะคำที่มี `#` นำหน้า และกรองชื่อคลิป/เลข EP ออก
   - ปรับ `parseEpisodeTitleAndNumber` ให้รองรับกรณีที่มีข้อความต่อท้ายหลัง `EP.X` (เช่น `5 อันดับ... EP.1 สุดฮา!`)
   - ยกเลิกการนำ `primaryTagName` จากคอลัมน์ D เข้าสู่ `uniqueNewTags`
2. **`src/components/footage/SheetTagImportModal.tsx` & `src/components/footage/sheetImport/SheetInspectionHeaderBar.tsx`**:
   - เปลี่ยนค่าเริ่มต้น `includeSeriesTagOnFootage` เป็น `false`
   - ยกเลิกการบังคับสร้างแท็กจาก `group.primaryTagName` (คอลัมน์ D) ใน Phase 1 โดยให้ผูก `primaryTagId` ของ EP เข้ากับแท็ก `#` ตัวแรกของแถวในกลุ่มนั้นแทน
   - เพิ่มปุ่มเปิดหน้าต่าง **ล้างแท็กชื่อคลิป (`JunkTagCleanupModal`)**
3. **`src/firebase/firestoreService.ts` & `src/context/cms/useCMSCategoryActions.ts` & `src/context/cms/cms.types.ts`**:
   - เพิ่ม `batchDeleteCategories(categoryIds: string[])` ใน `firestoreService.ts`
   - เพิ่ม `batchDeleteTags(tagIds: string[])` ใน `useCMSCategoryActions.ts` ที่ลบแท็กแบบกลุ่มพร้อมอัปเดต `footage` และ `sources` ขึ้น Cloud ในครั้งเดียว
4. **`src/components/tags/JunkTagCleanupModal.tsx` & `src/components/tags/ThreeTierCategoryManagerModal.tsx`**:
   - สร้าง Modal สแกนและลบแท็กที่เป็นชื่อคลิป/แท็กขยะ (ใช้ `BaseModal` + Portal + Light Pastel Theme) พร้อมตัวกรอง ค้นหา เลือกทั้งหมด และรายงานผลการลบ

---

## 3. ขั้นตอนการตรวจสอบ (Verification Plan)
1. ตรวจสอบการคอมไพล์และ TypeScript ด้วย `compile_applet` และ `lint_applet`
2. ทดสอบวางข้อมูล Sheet ใน `SheetTagImportModal` เพื่อยืนยันว่าระบบดึงเฉพาะคำที่มี `#` นำหน้าในคอลัมน์ B เท่านั้น และไม่นำชื่อ EP ในคอลัมน์ D มาสร้างเป็นแท็กใหม่
3. ทดสอบเปิด `JunkTagCleanupModal` เพื่อตรวจสอบการสแกนหาแท็กที่เป็นชื่อคลิป/ชื่อ EP และการกดลบแบบกลุ่มขึ้น Cloud
