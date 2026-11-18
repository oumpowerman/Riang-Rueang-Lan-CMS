# แผนงานปรับปรุงสถาปัตยกรรม Smart Cache-First & Delta Sync (แก้ปัญหาโควตา Firestore เต็มถาวร)

แผนงานยกระดับระบบประสานข้อมูล (Data Synchronization) ระหว่าง **เครื่องผู้ใช้ (IndexedDB)** กับ **Google Firebase Firestore (Cloud)** เพื่อแก้ไขปัญหาโควตาอ่านฟรี 50,000 Document Reads/วัน หมดเร็วอย่างถาวร โดยเปลี่ยนจากการดึงข้อมูลทุกคอลเลกชันใหม่ทั้ง 1,700 รายการทุกครั้งที่เปิดหน้าเว็บ มาเป็นการโหลดจากแคชในเครื่องทันที 100% แล้วตรวจเช็กเฉพาะ Timestamp จากเอกสารสรุปส่วนกลางเพียง **1 การอ่าน (1 Read)** ส่งผลให้ลดการใช้โควตาลงถึง 99.9% (จากเปิดได้ 30 ครั้ง/วัน เพิ่มเป็น 50,000 ครั้ง/วัน)

---

## User Review & Critical Decisions

> [!IMPORTANT] สรุปหลักการทำงานสำคัญที่ยืนยันร่วมกัน:
> - **Zero-Wait Local Paint**: เมื่อเปิดหน้าเว็บ ระบบจะโหลดข้อมูล 889 ฟุตเทจ, 118 ตอน EP, แท็ก และการตั้งค่าจาก IndexedDB ในเครื่องขึ้นมาแสดงผลทันทีภายใน 5–15ms โดยไม่ต้องรอ Network
> - **Single-Document Health Check (1 Read)**: ตรวจสอบเฉพาะเอกสาร `system_settings/archive_summary_stats` เพียง 1 เอกสาร หาก `updatedAt` บน Cloud ตรงกับเวลาซิงก์ล่าสุดในเครื่อง จะ**ไม่ดาวน์โหลดคอลเลกชันใดๆ เลย** (ประหยัด 1,700 อ่านในทุกการเปิดหน้าเว็บ)
> - **Delta-Only Sync (ดึงเฉพาะส่วนต่าง)**: กรณีที่พบว่ามีข้อมูลใหม่บน Cloud (เช่น มีการเพิ่มคลิปหรือตัดต่อตอนใหม่จากเครื่องอื่น) ระบบจะยิง Query เฉพาะเอกสารที่มี `updatedAt > localLastSyncTime` เช่น มีคลิปใหม่ 2 คลิป ก็จะอ่านเพียง 2 เอกสารเท่านั้น แทนที่จะโหลดซ้ำ 889 รายการ
> - **ตัดคำสั่งโหลดซ้ำซ้อน (Eliminate Double-Fetch)**: ลบคำสั่ง `getDocs(limit(300))` ที่สั่งโหลดซ้อนกับ `onSnapshot` ใน `subscribeFootagesProgressive` และ `subscribeEpisodesProgressive` ออกถาวร

---

## 1. ภาพรวมและหลักการทำงาน (Overview & Core Concept)

### ปัญหาของระบบเดิม (Current Architecture Flaw)
* ทุกครั้งที่มีการ Refresh หรือเปิดแท็บใหม่ โค้ดจะเปิด Listeners (`onSnapshot`) คลุมทั้งคอลเลกชัน:
  * `footages`: 889 รายการ (+ `getDocs` อีก 300 รายการ) = **1,189 อ่าน**
  * `episodes`: 118 รายการ (+ `getDocs` อีก 118 รายการ) = **236 อ่าน**
  * `sources`: **100+ อ่าน**
  * `categories`: **150+ อ่าน**
  * `category_groups`: **15 อ่าน**
  * **รวมเฉลี่ยต่อการเปิดหน้าเว็บ 1 ครั้ง = ~1,700 Document Reads**
  * โควตาฟรี 50,000 ต่อวัน จึงหมดลงหลังจากการเปิดหน้าเว็บเพียง **29–30 ครั้ง** เท่านั้น

### สถาปัตยกรรมใหม่ (Smart Cache-First & Delta Sync Architecture)
1. **Local State (IndexedDB)** เป็น Source of Truth สำหรับการแสดงผลหน้าจอแบบเรียลไทม์
2. **Cloud Version Stamp**: บันทึก `lastSyncedCloudTimestamp` ลงใน `idbStorageService` / `localStorage`
3. **Lightweight Check**: ใช้ Snapshot Listener ตรวจเฉพาะเอกสารเดี่ยว `system_settings/archive_summary_stats` (1 Read)
4. **Conditional Invalidation**:
   * หาก `cloudSummary.updatedAt === localTimestamp` -> ปรับสถานะเป็น `Online · ซิงก์แล้ว` ทันที โดยไม่แตะต้องคอลเลกชันใหญ่
   * หาก `cloudSummary.updatedAt !== localTimestamp` -> ยิงคำสั่งดึงเฉพาะส่วนต่าง (Delta) แล้วรวมเข้ากับ IndexedDB ในเครื่อง

---

## 2. ประสบการณ์ใช้งานและการแสดงผล (User Experience & Visual Design)

### สถานะการเชื่อมต่อบนแถบ Sidebar / Navbar
- **สถานะปกติ (Online · ซิงก์แล้ว)**: จุดสีเขียวมรกตพาสเทล (`bg-emerald-500`) พร้อมข้อความ `Online` (เปิดหน้าเว็บได้ลื่นไหล ไม่กินโควตา)
- **สถานะกำลังซิงก์ส่วนต่าง (Syncing Delta)**: ไอคอนหมุนนุ่มนวล พร้อมข้อความ `กำลังซิงก์ส่วนต่าง (N รายการ)...`
- **สถานะออฟไลน์ / โควตาจำกัด (Local Mode)**: จุดสีเทาพาสเทล (`bg-slate-300`) พร้อมข้อความ `Local` ผู้ใช้ยังคงดูและบันทึกงานในเครื่องได้ 100% ข้อมูลไม่หาย

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser (Local Client)                                          │
│ ┌──────────────────────────┐    1. Instant Load (0 ms, 0 Read)  │
│ │ IndexedDB / Local Cache  │ ─────────────────────────────────► │ UI Paints instantly
│ │ (889 Footages, 118 EPs)  │                                    │ (คลิปและตอนพร้อมใช้)
│ └──────────────────────────┘                                    │
│              ▲                                                  │
│              │ 4. Merge Delta Changes                           │
│              │                                                  │
│ ┌──────────────────────────┐    2. Health Check (1 Read Only)   │
│ │ Cloud Sync Manager       │ ─────────────────────────────────► │ Firestore Cloud
│ │                          │ ◄───────────────────────────────── │ system_settings/
│ │ - Check updatedAt        │    3. Match? -> Finish (0 more)    │ archive_summary_stats
│ │ - Fetch Delta if needed  │    3. Differ? -> Fetch Delta Only  │
│ └──────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. การตัดสินใจเชิงเทคนิค (Key Technical Decisions & Trade-Offs)

1. **ทำไมไม่ปิด Firestore ไปเลยแล้วใช้แค่ IndexedDB?**:
   - เพื่อให้ระบบยังคงความสามารถในการซิงก์ข้อมูลข้ามเครื่อง (Multi-Device Sync) ระหว่างทีมงาน และสามารถ Backup ข้อมูลขึ้น Cloud ได้อย่างปลอดภัย
2. **ทำไมใช้ `archive_summary_stats.updatedAt` เป็นตัวเปรียบเทียบ?**:
   - เพราะระบบมีเอกสารสรุปตัวนี้อยู่แล้ว ซึ่งจะถูกแสตมป์เวลาทุกครั้งที่มีการเพิ่ม/ลบ/แก้ไขตอนหรือฟุตเทจ การอ่านเอกสารเดี่ยวนี้ 1 ครั้ง มีค่าเท่ากับ 1 Read ทำให้ประหยัดโควตาถึง 1,700 เท่า
3. **การจัดการเมื่อเปิดใช้งานบนเครื่องใหม่ครั้งแรก (Cold Device)**:
   - หากตรวจพบว่า IndexedDB ในเครื่องยังว่างเปล่า (0 รายการ) ระบบจะทำ Full Initial Sync เพียงครั้งแรกครั้งเดียว จากนั้นจะเข้าสู่โหมด Smart Cache-First ตลอดไป

---

## 4. แผนการปรับปรุงโค้ด (Implementation Steps)

### ขั้นตอนที่ 1: เพิ่มระบบบันทึกเวลาซิงก์ใน `src/services/cmsRepository.ts`
- เพิ่มฟังก์ชัน `getLastCloudSyncTimestamp()` และ `setLastCloudSyncTimestamp(ts: string)`
- จัดเก็บใน IndexedDB Meta เพื่อให้อยู่ถาวรแม้ปิดเบราว์เซอร์

### ขั้นตอนที่ 2: เพิ่มฟังก์ชัน Delta Queries ใน `src/firebase/firestoreService.ts`
- เพิ่มฟังก์ชันดึงเฉพาะรายการที่แก้ไขใหม่:
  - `fetchFootagesDelta(sinceIso: string): Promise<Footage[]>`
  - `fetchEpisodesDelta(sinceIso: string): Promise<Episode[]>`
  - `fetchSourcesDelta(sinceIso: string): Promise<RawSource[]>`
  - `fetchCategoriesDelta(sinceIso: string): Promise<CategoryTag[]>`
- ตัดการสั่ง `getDocs(limit(300))` ที่ซ้ำซ้อนใน `subscribeFootagesProgressive` และ `subscribeEpisodesProgressive` ออก

### ขั้นตอนที่ 3: ปรับปรุง `src/context/cms/useCMSCloudAndStorageSync.ts`
- เปลี่ยน Flow ใน `useEffect` การเชื่อมต่อ Cloud:
  1. ฟังเฉพาะ `subscribeArchiveSummaryStats` (1 Read)
  2. เปรียบเทียบ `cloudSummary.updatedAt` กับ `localLastSync`
  3. หากตรงกัน: ยืนยันสถานะ `Online` ทันทีโดยไม่เปิด Listeners คอลเลกชันใหญ่
  4. หากไม่ตรงกัน หรือเป็นเครื่องใหม่: เรียกใช้ `fetchDelta` เฉพาะส่วนต่างแล้วอัปเดตลง IndexedDB

### ขั้นตอนที่ 4: ปรับปรุง `useSavedDriveFolders.ts`
- เก็บประวัติโฟลเดอร์ Google Drive ในแคชในเครื่อง แทนที่จะยิง `getAllDriveSyncRecords()` ทุกครั้งที่เปิด Modal

### ขั้นตอนที่ 5: ตรวจสอบและทดสอบระบบ (Verification)
- ตรวจสอบว่าแอปเปิดขึ้นมาแสดงข้อมูล 889 ฟุตเทจและ 118 ตอนได้ทันที
- ตรวจสอบ Network / Firestore Requests ว่าไม่มีการยิง 1,700 อ่านอีกต่อไป
- รัน `compile_applet` และ `lint_applet` เพื่อยืนยันความสมบูรณ์ 0 errors
