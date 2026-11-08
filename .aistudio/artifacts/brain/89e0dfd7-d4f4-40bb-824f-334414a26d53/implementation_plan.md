# แผนการพัฒนาระบบบันทึกข้อมูลก้อนใหญ่ขึ้น Cloud (Firestore) ครบ 100% (Batch Write Lock & Await All Chunks)

## 1. ภาพรวมของปัญหาและแนวทางแก้ไข (Overview)
เมื่อนำเข้าคลิปหรือจัดการข้อมูลจำนวนมาก (เช่น 900+ คลิป หรือหลายพันคลิป) Firestore จำกัดการเขียนต่อ 1 Batch ไม่เกิน **400 รายการ** (`MAX_BATCH_OPERATIONS = 400`) จึงต้องแบ่งส่งเป็นก้อนๆ (เช่น 950 คลิป = 3 ก้อน: 400 + 400 + 150)

**สาเหตุที่ข้อมูลเหลือ 400 รายการก่อนหน้านี้:**
1. **`onSnapshot` แทรกกลางระหว่างส่งก้อนข้อมูล:** ทันทีที่ก้อนที่ 1 (400 คลิปแรก) บันทึกเสร็จ Listener `onSnapshot` ของ Firestore จะยิงข้อมูล 400 คลิปกลับมาทับ State บนหน้าจอและ `localStorage` ทันทีในขณะที่ก้อนที่ 2 และ 3 ยังส่งไม่เสร็จ
2. **UI แจ้ง 100% ก่อนส่งขึ้น Cloud ครบทุกก้อน:** ฟังก์ชัน `batchAddDirectFootage`, `batchSyncFootageTagsByMap`, และคำสั่งกลุ่มอื่นๆ ไม่ได้ `await` รอให้ทุกก้อนบันทึกลง Firestore เสร็จสมบูรณ์ ทำให้หน้าจอขึ้น "สำเร็จ 100%" ทันที และหากผู้ใช้กดรีเฟรชเบราว์เซอร์ ก้อนที่เหลือจะถูกตัดจบกลางคัน

---

## 2. รายละเอียดการปรับปรุงระบบ (Key Changes)

### 2.1 ระบบล็อก `onSnapshot` ชั่วคราวระหว่างส่งข้อมูลก้อนใหญ่ (`activeBatchWritesCount`)
- **ไฟล์ที่เกี่ยวข้อง:** `src/firebase/firestoreService.ts`, `src/context/cms/useCMSCloudAndStorageSync.ts`
- **การทำงาน:**
  - เพิ่มตัวนับสถานะการเขียนข้อมูลก้อนใหญ่ (`activeBatchWritesCount`) และฟังก์ชัน `firestoreService.isBatchWriteInProgress()`
  - ในขณะที่ `activeBatchWritesCount > 0` ระบบจะระงับการนำข้อมูลครึ่งๆ กลางๆ จาก `onSnapshot` (`subscribeFootages`, `subscribeSources`, `subscribeEpisodes`, `subscribeCategories`, `subscribeCategoryGroups`) มาทับ State บนหน้าจอชั่วคราว
  - เมื่อส่งครบทุกก้อนแล้ว (`activeBatchWritesCount === 0`) ระบบจะปลดล็อกและซิงก์ข้อมูลล่าสุดจาก Firestore ลงหน้าจอและ `localStorage` ให้ตรงกัน 100%

### 2.2 ระบบรอ (`await`) ให้ครบทุกก้อนและรายงานความคืบหน้ารายก้อน (`BatchChunkProgress`)
- **ไฟล์ที่เกี่ยวข้อง:**
  - `src/firebase/firestoreService.ts`
  - `src/context/cms/cms.types.ts`
  - `src/context/cms/useCMSFootageActions.ts`
  - `src/context/cms/useCMSCategoryActions.ts`
  - `src/context/cms/useCMSEpisodeActions.ts`
- **การทำงาน:**
  - เพิ่ม Callback `onProgress?: (progress: BatchChunkProgress) => void` ใน `commitOperationsInChunks` เพื่อส่งค่า `{ completedChunks, totalChunks, completedOps, totalOps }` หลังแต่ละก้อนบันทึกขึ้น Cloud สำเร็จ
  - ปรับฟังก์ชันจัดการข้อมูลกลุ่มทั้งหมด (`batchAddDirectFootage`, `batchAddTags`, `batchSyncFootageTagsByMap`, `batchUpdateFootageTags`, `batchDeleteFootage`, `batchUpsertEpisodes`) ให้คืนค่าเป็น `Promise` ที่รอจนกว่าทุกก้อนจะบันทึกขึ้น Firestore เสร็จสมบูรณ์

### 2.3 แสดงสถานะก้อนข้อมูลจริง (ก้อนที่ 1/3 ➔ 2/3 ➔ 3/3) ในทุกหน้าต่างนำเข้าและซิงก์
- **ไฟล์ที่เกี่ยวข้อง:**
  - `src/components/footage/driveImport/useGoogleDriveBatchImport.ts`
  - `src/components/footage/GoogleDriveBatchImportModal.tsx`
  - `src/components/footage/driveImport/DriveImportModalFooter.tsx`
  - `src/components/footage/SheetTagImportModal.tsx`
- **การทำงาน:**
  - **หน้าต่างนำเข้า Google Drive (`GoogleDriveBatchImportModal`):** รอ (`await`) การบันทึกหมวดหมู่และคลิปทุกก้อนขึ้น Cloud จริงๆ พร้อมแสดงข้อความสถานะ เช่น `"กำลังบันทึกขึ้น Cloud ก้อนที่ 2/3 (800/950 รายการ)..."` และแสดงเปอร์เซ็นต์ตามก้อนที่ส่งจริง ก่อนเปลี่ยนเป็นหน้าจอสำเร็จ 100%
  - **หน้าต่างซิงก์ Google Sheet (`SheetTagImportModal`):** รอ (`await`) การบันทึกคลิปใหม่, อัปเดตหมวดหมู่, และสร้าง/อัปเดต EP จนครบทุกก้อนบน Cloud พร้อมแสดงความคืบหน้ารายก้อนแบบเรียลไทม์

### 2.4 ระบบป้องกันการเผลอปิดหน้าต่างหรือรีเฟรชเบราว์เซอร์ก่อนครบ 100%
- **ไฟล์ที่เกี่ยวข้อง:**
  - `src/firebase/firestoreService.ts`
  - `src/components/footage/GoogleDriveBatchImportModal.tsx`
  - `src/components/footage/SheetTagImportModal.tsx`
- **การทำงาน:**
  - **เตือนเมื่อกด Refresh / ปิดแท็บ (`beforeunload`):** ผูก Event `window.addEventListener('beforeunload', ...)` อัตโนมัติตราบใดที่ยังมีก้อนข้อมูลกำลังส่งขึ้น Cloud (`activeBatchWritesCount > 0`) เพื่อแจ้งเตือนผู้ใช้ไม่ให้เผลอรีเฟรชหน้าเว็บก่อนส่งครบทุกก้อน
  - **ล็อกปุ่มปิด Modal ชั่วคราว:** ปิดการทำงานของปุ่มปิด (`X`), ปุ่มยกเลิก, การคลิกพื้นหลัง (`closeOnBackdropClick={false}`), และปุ่ม `ESC` (`closeOnEsc={false}`) ในระหว่างที่กำลังส่งก้อนข้อมูลขึ้น Cloud
