# แผนสถาปัตยกรรมรองรับข้อมูลระดับ 10,000+ แถว (High-Scale Data & Cache Engine)

ยกระดับโครงสร้างการจัดเก็บข้อมูล การดึงข้อมูลจาก Cloud และการประมวลผลตัวกรอง/สถิติของระบบให้รองรับข้อมูลระดับ **10,000+ แถว** ทั้งใน **คลังคลิปหลัก (Master Archive)** และ **คลังฟุตเทจ (Footage Vault)** โดยไม่เกิดปัญหาพื้นที่เบราว์เซอร์เต็ม (`QuotaExceededError`) เปิดหน้าแรกได้รวดเร็วทันใจ และไม่กระตุกเมื่อค้นหาหรือสลับหน้า

---

## User Review & Critical Decisions

> [!IMPORTANT] แนวทางสถาปัตยกรรมที่ยืนยันแล้วจากผู้ใช้
> แผนนี้ผสานคำตอบจากผู้ใช้ทั้ง 3 ข้อเข้ากับความต้องการเดิมครบทุกฟังก์ชัน

- **การโหลดข้อมูลและเปลี่ยนหน้า (Progressive First-Paint + Background Sync)**: โหลดชุดข้อมูลหน้าปัจจุบันขึ้นแสดงผลบนหน้าจอทันทีเพื่อให้ใช้งานได้โดยไม่ต้องรอดึงทั้งหมื่นแถว จากนั้นทยอยดึงข้อมูลที่เหลือแบบแบ่งก้อน (Chunked Pagination) ลงเก็บใน `IndexedDB` เบื้องหลัง
- **การดึงตัวเลขสถิติรวมบนหัวตารางและหมวดหมู่**: ใช้คำสั่งนับจำนวนแถวจากเซิร์ฟเวอร์โดยตรง (`getCountFromServer`) คู่กับเอกสารสรุปสถิติกลาง (`system_settings/archive_summary_stats`) เพื่อให้ตัวเลขรวมถูกต้องทันทีตั้งแต่วินาทีแรกที่เปิดแอป โดยไม่ต้องโหลดเอกสารจริงครบทุกแถวก่อน
- **ขอบเขตการขยายระบบ**: ครอบคลุมทั้ง **คลังคลิปหลัก (Episodes)** และ **คลังฟุตเทจ (Footage)** พร้อมระบบป้องกัน `QuotaExceededError` และการคำนวณ/เรียงลำดับแบบไม่บล็อกหน้าจอหลัก

---

## 1. Overview & Core Concept

- **What It Does**: เปลี่ยนสถาปัตยกรรมข้อมูล 4 แกนหลักของระบบ:
  1. **IndexedDB Storage Engine + Safe Quota Guard**: ย้ายการจัดเก็บข้อมูลชุดใหญ่ (`episodes`, `footage`, `sources`) จาก `localStorage` (ที่จำกัด ~5 MB) ไปสู่ `IndexedDB` ที่รองรับข้อมูลระดับหลายร้อย MB พร้อมระบบ Auto-Migration ดึงข้อมูลเดิมจาก `localStorage` มาเข้า `IndexedDB` อัตโนมัติและดักจับ Error ทุกจุดไม่ให้แอปพัง
  2. **Two-Stage Progressive Firestore Loader**: แบ่งการซิงก์จาก Firestore เป็น **Stage 1 (Instant First Window)** ดึงชุดล่าสุดขึ้นแสดงผลทันที และ **Stage 2 (Background Chunked Hydration + Live Delta Listener)** ทยอยดึงก้อนถัดไปทีละชุดในเบื้องหลังพร้อมเปิดรับเฉพาะรายการที่มีการแก้ไขใหม่ (`updatedAt`)
  3. **Server-Side Count & Central Summary Document**: ใช้ `getCountFromServer` นับจำนวนเอกสารรวมของคอลเลกชันด้วยต้นทุนต่ำ และซิงก์เอกสารสรุปสถิติกลาง (`archive_summary_stats`) สำหรับแสดงยอดรวมของแต่ละหมวด/สถานะทันทีตั้งแต่ยังซิงก์เบื้องหลังไม่เสร็จ
  4. **Memoized Indexing & Non-Blocking Worker/Collator Pipeline**: สร้างดัชนีค้นหาล่วงหน้า (Pre-computed Search & Validation Index), ใช้ `Intl.Collator('th')` ประสิทธิภาพสูงแทนการเรียก `localeCompare` ซ้ำในลูป และใช้ Web Worker / Chunked Idle Scheduler คำนวณสถิติชุดใหญ่และตรวจสอบความซ้ำโดยไม่บล็อกเฟรมเรตของหน้าจอหลัก
- **Target Audience / Persona**: ทีมโปรดักชันและผู้ดูแลระบบที่มีคลังฟุตเทจและคลังคลิปหลักสะสมต่อเนื่องตั้งแต่หลักพันไปจนถึง 10,000+ รายการ
- **Key Value**: เปิดหน้าแอปเร็วขึ้นหลายเท่า ประหยัดโควตาการอ่านข้อมูล Firestore ตัดปัญหาเบราว์เซอร์ค้างหรือแครชเมื่อข้อมูลทะลุ 5 MB และทำให้การค้นหา/กรอง/สลับหน้าลื่นไหลในระดับ 60fps

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **เปิดเข้าแอปครั้งแรก / รีเฟรชหน้าจอ**:
     - ระบบดึงข้อมูลจาก `IndexedDB` ในเครื่องขึ้นมาแสดงผลทันทีภายในเสี้ยววินาที (Zero-Wait Local Hydration)
     - พร้อมกันนั้น ดึงตัวเลขยอดรวมจากเซิร์ฟเวอร์ (`getCountFromServer` + เอกสารสถิติกลาง) และดึงข้อมูลชุดแรก (First Window) จาก Firestore มาอัปเดตหน้าแรกทันที
  2. **การทยอยโหลดเบื้องหลังและกดเปลี่ยนหน้า Pagination**:
     - หากฐานข้อมูลมีรายการมากกว่าชุดแรก ระบบจะทยอยดึงก้อนถัดไป (ทีละชุด เช่น 500 รายการ) ในเบื้องหลังเงียบๆ และบันทึกลง `IndexedDB`
     - หากผู้ใช้กดกระโดดไปยังหน้า Pagination ลึกๆ ก่อนที่เบื้องหลังจะดึงถึง ระบบจะดึงช่วงหน้านั้นขึ้นมาให้ทันทีโดยไม่ติดขัด
  3. **การค้นหา กรอง และเรียงลำดับ 10,000 แถว**:
     - เมื่อพิมพ์ค้นหา เลือกหมวดหมู่ หรือสลับสถานะ (`ทั้งหมด`, `พร้อมสมบูรณ์`, `ข้อมูลไม่ครบ`, `ฟุตไม่ครบ 5`) ระบบจะใช้ดัชนีที่คำนวณเก็บไว้ล่วงหน้า (`EpisodeSearchIndex` / `FootageSearchIndex`) และ `React.startTransition` เพื่อให้การพิมพ์และคลิกปุ่มตอบสนองทันทีโดยหน้าจอไม่ค้าง
- **Visual Identity & Theme**:
  - คงเอกลักษณ์ **Light Pastel Earth-Tone** ที่สะอาดตา ไม่มีแถบสถานะเทคนิคหรือหน้าต่างแจ้งเตือนรกตา
  - ขณะกำลังทยอยซิงก์ข้อมูลก้อนใหญ่ในเบื้องหลัง ตัวเลขบนการ์ดสถิติและปุ่มตัวกรองจะแสดงค่าจริงจากเซิร์ฟเวอร์ทันทีด้วยฟอนต์ `tabular-nums` โดยไม่กระโดดไปมา

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: IndexedDB เป็นคลังหลักในเครื่อง + Safe `localStorage` สำหรับข้อมูลตั้งค่าขนาดเล็ก**
  - *Chosen Approach*: เก็บ `episodes`, `footage`, และ `sources` ใน `IndexedDB` แบบ Asynchronous Store พร้อม In-Memory Cache และคงเฉพาะ `settings`, `categoryGroups`, `tags` (ที่มีขนาดเล็กไม่กี่ KB) ไว้ใน `localStorage` ที่ครอบด้วยตัวดักจับ `try/catch` (`safeLocalStorageSet`)
  - *Why*: `IndexedDB` รองรับข้อมูลขนาดใหญ่ระดับ 10,000–50,000+ แถวได้สบายและไม่บล็อก Main Thread เหมือน `JSON.stringify` ก้อนใหญ่ใน `localStorage`

- **Decision 2: โหลดชุดแรกทันที + ทยอยซิงก์เบื้องหลัง + ฟังเฉพาะ Delta ที่เปลี่ยนใหม่**
  - *Chosen Approach*:
    1. โหลดแคชจาก `IndexedDB` ทันทีเมื่อเปิดแอป
    2. ดึงหน้าต่างแรกจาก Firestore มาแสดงผลก่อน แล้วทยอยดึงก้อนที่เหลือด้วย Cursor Pagination (`limit` + `startAfter`) จนครบลง `IndexedDB`
    3. เมื่อซิงก์ฐานข้อมูลเริ่มต้นครบแล้ว เปิด Realtime Listener เฉพาะเอกสารที่มีการแก้ไขใหม่หรือใช้ Snapshot Merge แบบประหยัดหน่วยความจำ
  - *Why*: ทำให้หน้าจอแรกพร้อมใช้งานทันทีแม้เน็ตช้า และยังคงความสามารถในการค้นหาข้ามแท็ก 3 ชั้น การคำนวณคูลดาวน์ฟุตเทจ (1:N Traceability) และการตรวจจับฟุตเทจซ้ำได้ครบ 100% เหมือนเดิม

- **Decision 3: คำสั่ง `getCountFromServer` คู่กับเอกสารสรุปสถิติกลาง (`archive_summary_stats`)**
  - *Chosen Approach*: ใช้ `getCountFromServer` ดึงจำนวนแถวทั้งหมดของคอลเลกชัน `episodes`, `footages`, `sources` จากเซิร์ฟเวอร์โดยตรง และอัปเดตเอกสารสรุปสถิติกลางเมื่อมีการเพิ่ม/ลบ/แก้ไขข้อมูล
  - *Why*: การนับด้วย `getCountFromServer` ใช้โควตาการอ่านต่ำมากและได้ตัวเลขรวมทั้ง 10,000 แถวกลับมาทันทีโดยไม่ต้องรอโหลดเอกสารทั้งหมด

- **Decision 4: Pre-Computed Index Cache + `Intl.Collator` + Web Worker ประมวลผลเบื้องหลัง**
  - *Chosen Approach*:
    - สร้างตัวแปร Cache ตามรหัสเอกสาร (`id` + `updatedAt`) เพื่อไม่ต้องรัน `validateEpisodeStandard`, `evaluateEpisodeCompleteness`, หรือแยกชื่อซีรีส์ซ้ำทุกครั้งที่กดเปลี่ยนตัวกรอง
    - ใช้ `new Intl.Collator('th', { sensitivity: 'base', numeric: true })` ตัวเดียวในการเรียงลำดับภาษาไทยและรหัส EP/FT (เร็วกว่า `localeCompare` แบบเดิม 5–10 เท่าบนข้อมูล 10,000 แถว)
    - ใช้ Web Worker (พร้อม Fallback อัตโนมัติ) สำหรับงานคำนวณหนักในเบื้องหลังเพื่อไม่ให้รบกวนแอนิเมชันและการเลื่อนหน้าจอ

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Data Flow Diagram**:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                        Firestore Cloud Database                            │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ episodes / footages  │  │ getCountFromServer() │  │ system_settings/ │  │
│  │ (10,000+ Documents)  │  │ (Instant Row Counts) │  │ archive_summary  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              │ 1. First Window (Fast)  │ 2. Server Counts      │ 3. Summary
              │ + Background Chunks     ▼                       ▼
              ▼              ┌───────────────────────────────────────────────┐
┌─────────────────────────┐  │       Fast-Boot Summary & Count Store         │
│   IndexedDB Repository  │  │  Instant KPI Totals, Completeness & Cooldown  │
│  (idbStorageService)    │  └──────────────────────┬────────────────────────┘
│  • episodes store       │                         │
│  • footage store        │                         ▼
│  • sources store        │  ┌───────────────────────────────────────────────┐
│  • Safe Quota Guard     ├─►│   Incremental Analytics & Search Index Cache  │
└─────────────────────────┘  │  • Per-Item Memoized Validation & Series Key  │
                             │  • Reusable Thai Intl.Collator('th')          │
                             │  • Background Worker / Idle Chunk Processor   │
                             └──────────────────────┬────────────────────────┘
                                                    │
                                                    ▼
                             ┌───────────────────────────────────────────────┐
                             │    Master Archive & Footage Vault UI Views    │
                             │  • Paginated Card Grid / Table (12-50 rows)   │
                             │  • Non-blocking Filter & Status Dropdown      │
                             └───────────────────────────────────────────────┘
```

- **Data Model & State Strategy**:
  - **IndexedDB Stores**: สร้างฐานข้อมูล `rrl_cms_idb_v1` แยก Object Stores สำหรับ `episodes`, `footage`, `sources`, และ `meta` (เก็บเวลาซิงก์ล่าสุดและสถิติสรุป) พร้อมระบบย้ายข้อมูลจาก `localStorage` เดิมมาเข้า `IndexedDB` อัตโนมัติในครั้งแรกแล้วล้างกุญแจก้อนใหญ่ใน `localStorage` เพื่อคืนพื้นที่
  - **Central Summary Document (`system_settings/archive_summary_stats`)**: เก็บตัวเลขสรุปยอดรวม เช่น `totalEpisodes`, `completeEpisodesCount`, `incompleteEpisodesCount`, `incompleteFootageEpisodesCount`, `distinctSeriesCount`, `totalFootage`, `readyFootageCount`, `newFootageCount`, `coolingFootageCount`, `untaggedFootageCount`, `missingDriveCount` เพื่อให้ส่วนหัวของทั้งสองคลังแสดงตัวเลขระดับ 10,000 แถวได้แม่นยำทันที
  - **Incremental Item Cache**: เก็บผลลัพธ์การคำนวณของแต่ละ `Episode` และ `Footage` ผูกกับคู่คีย์ `${item.id}_${item.updatedAt}` เมื่อข้อมูลแถวใดไม่ได้แก้ไข ระบบจะดึงผลการตรวจสอบความสมบูรณ์ (`completeness`), ข้อมูลซีรีส์ (`seriesInfo`), และดัชนีคำค้นหา (`searchTokens`) จาก Cache ทันทีในระดับ $O(1)$
