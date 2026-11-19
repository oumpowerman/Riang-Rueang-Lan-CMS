# ระบบซิงก์ข้อมูลหลายอุปกรณ์แบบทนทาน (Enterprise SmartSync Hardening & Offline Outbox)

อัปเกรดสถาปัตยกรรมซิงก์ข้อมูลบน Firestore ให้ปิดช่องโหว่การคลาดเคลื่อนของข้อมูลครบทั้ง 5 จุด พร้อมคิวส่งซ้ำอัตโนมัติใน IndexedDB (Offline Outbox Queue), ระบบตรวจจับยอดไม่ตรงแบบไม่เสียโควตา (Zero-Read Drift Detection), และปุ่มรีเฟรชขนาดกะทัดรัดบน Navbar ด้านบนเพื่อให้ผู้ใช้คุมการดึงข้อมูลและโควตาได้อย่างมั่นใจ 100%

---

## User Review & Critical Decisions

> [!IMPORTANT]
> แผนนี้สรุปตามแนวทางที่คุณยืนยันไว้ทั้ง 3 ข้อ และเสนอการจัดการปุ่มซิงก์เดิมใน Sidebar เพื่อป้องกันการเผลอเขียนทับ Cloud โดยไม่ได้ตั้งใจ กรุณาตรวจสอบก่อนเริ่มลงมือพัฒนา

- **Confirmed Decision 1 (ระดับสถาปัตยกรรมซิงก์):** อัปเกรดบนฐานข้อมูล Firestore เดิมครบชุด พร้อมเพิ่ม **Persistent Offline Outbox Queue** ใน IndexedDB เพื่อเก็บคำสั่งที่ส่งขึ้น Cloud ไม่ผ่าน (ตอนเน็ตหลุดหรือโควตาเต็ม) และส่งซ้ำอัตโนมัติเมื่อระบบกลับมาพร้อมใช้งาน
- **Confirmed Decision 2 (ตำแหน่งปุ่มรีเฟรชและสถานะ):** วางปุ่มรีเฟรชซิงก์ขนาดกะทัดรัดไว้ **เฉพาะบน Navbar ด้านบน** (ทั้ง Desktop และ Mobile) โดยกดคลิกเพื่อเปิดหน้าต่างจัดการซิงก์ (Sync Center) หรือกดรีเฟรชด่วนได้ทันที
- **Confirmed Decision 3 (การจัดการเมื่อยอดข้อมูลไม่ตรงกับ Cloud):** ใช้ระบบ **Passive Drift Alert** แสดงสัญญาณเตือนเบาๆ ที่ปุ่มซิงก์บน Navbar (ไม่ดึงข้อมูลเองโดยพลการ) เพื่อให้ผู้ใช้เป็นคนตัดสินใจกดรีเฟรชเองและคุมโควตาการอ่านได้ 100%
- **Safety Adjustment (ปุ่ม "ซิงก์ข้อมูล Cloud" เดิมใน Sidebar):** ปุ่มเดิมใน Sidebar จริงๆ ทำงานแบบ Push ข้อมูลจากเครื่องขึ้นไปทับ Cloud ซึ่งเสี่ยงต่อการเอาข้อมูลเก่าทับข้อมูลใหม่ จึงจะ **ปลดปุ่ม Push แบบกดทีเดียวออกจาก Sidebar** เพื่อให้จุดควบคุมซิงก์ทั้งหมดรวมศูนย์อยู่ที่ปุ่มบน Navbar เพียงจุดเดียว (และเก็บคำสั่งสำรอง/อัปโหลดฉุกเฉินไว้ในส่วนตั้งค่าขั้นสูงภายในหน้าต่าง Sync Center ที่มีคำเตือนยืนยันชัดเจน)

---

## 1. Overview & Core Concept

- **What It Does:** ยกระดับการทำงานแบบ Local-First + Firestore SmartSync ให้ทนทานต่อการใช้งานพร้อมกันหลายอุปกรณ์และหลายแท็บ ประกอบด้วย 5 กลไกหลัก:
  1. **Persistent Offline Outbox Queue:** จดบันทึกทุกคำสั่งเพิ่ม/แก้ไข/ลบที่ส่งขึ้น Firestore ไม่สำเร็จลง IndexedDB แล้วทยอยส่งซ้ำอัตโนมัติพร้อม Exponential Backoff ทันทีที่อินเทอร์เน็ตกลับมาหรือรีเฟรชหน้าใหม่
  2. **Atomic Transactional Tombstone Merge:** เปลี่ยนการบันทึกประวัติ ID ที่ถูกลบ (`recentDeletes`) บนเอกสารสัญญาณกลางให้ใช้ Firestore Transaction เพื่อป้องกันกรณี 2 เครื่องลบคลิปคนละตัวในเสี้ยววินาทีเดียวกันแล้วทับรายการกัน
  3. **Zero-Read Same-Device Multi-Tab Sync (`BroadcastChannel`):** เมื่อเปิดแอป 2 แท็บขึ้นไปบนเครื่องเดียวกัน แท็บที่บันทึกหรือลบข้อมูลจะกระจายสัญญาณบอกแท็บพี่น้องทันที ทำให้ทุกแท็บอัปเดตตรงกันในระดับมิลลิวินาทีโดย **เสีย 0 Firestore Read**
  4. **Zero-Read Auto Drift Detection:** เทียบยอดรวมในเครื่อง (`footage`, `episodes`, `sources`) กับยอดรวมบนเอกสารสัญญาณกลาง (`archive_summary_stats`) ที่รับมาอยู่แล้ว หากยอดไม่ตรงกันนานเกินช่วง Debounce จะแสดงสัญญาณเตือนเบาๆ บนปุ่ม Navbar
  5. **2-Tier Manual Refresh (Navbar Sync Control):** ปุ่มรีเฟรชขนาดเล็กบน Navbar พร้อมหน้าต่างจัดการซิงก์แบบ Light Pastel ที่แยกชัดเจนระหว่าง **"ดึงข้อมูลล่าสุด (Smart Delta)"** (ประหยัด Read) และ **"ดึงข้อมูลใหม่ทั้งหมดจาก Cloud (Hard Reset Pull)"** (สำหรับล้างแคชเก่าหรือหลังออฟไลน์เกิน 14 วัน)
- **Target Audience / Persona:** ทีมตัดต่อและแอดมินที่เปิดจัดการคลังฟุตเทจและจัดอันดับ 5 อันดับสลับไปมาระหว่างคอมพิวเตอร์, แท็บเล็ต, มือถือ หรือเปิดทำงานพร้อมกันหลายแท็บ
- **Key Value:** หมดกังวลเรื่องคลิปหาย/ค้าง/ไม่ตรงกันระหว่างเครื่อง ลดโอกาสเผลอทับข้อมูลบน Cloud โดยไม่ตั้งใจ และยังคงใช้โควตา Firestore อย่างประหยัดที่สุด

---

## 2. User Experience & Visual Design

### Key User Flows

1. **การใช้งานปกติ (Zero-Friction Background Sync):**
   - ผู้ใช้เพิ่ม แก้ไข หรือลบคลิปได้ทันทีจากเครื่อง (IndexedDB) และระบบซิงก์เบื้องหลังส่งสัญญาณให้เครื่องอื่นและแท็บอื่นอัตโนมัติ
   - บน Navbar ด้านบนจะมี **ปุ่มไอคอนรีเฟรชขนาดกะทัดรัด** แสดงสถานะเรียบง่าย (ไม่เกะกะสายตา ไม่แย่งจุดเด่นจากปุ่มหลัก "+ นำเข้าฟุตเทจ")
2. **กรณีตรวจพบข้อมูลไม่ตรงกับ Cloud หรือมีคิวรอส่ง (Subtle Passive Alert):**
   - หากยอดรวมในเครื่องไม่ตรงกับยอดบน Cloud (เช่น ออฟไลน์เกิน 14 วัน หรือลบชุดใหญ่เกิน 400 รายการ) ปุ่มรีเฟรชบน Navbar จะเปลี่ยนกรอบและไอคอนเป็นโทนสี **Amber Pastel** พร้อมตัวเลข/ข้อความสั้นแบบกระชับ (เช่นจุดแจ้งเตือนสถานะจริง + tooltip อธิบายส่วนต่าง)
   - หากเน็ตหลุดหรือโควตาเต็มขณะบันทึกและมีรายการค้างใน Outbox Queue ปุ่มบน Navbar จะแสดงจำนวนรายการที่รอส่งซ้ำด้วยตัวเลขแบบ Tabular Numerals (เช่น `รอส่ง 3`)
3. **การกดปุ่มรีเฟรชบน Navbar (Sync Center Modal):**
   - คลิกที่ปุ่มรีเฟรชบน Navbar จะเปิดหน้าต่าง **ศูนย์ซิงก์ข้อมูล (Sync Center)** ผ่าน `BaseModal` (Portal + Framer Motion) แสดงข้อมูลเปรียบเทียบแบบสะอาดตา:
     - **ตารางเทียบยอด ในเครื่อง vs บน Cloud** (ฟุตเทจ / ตอน EP / คลิปต้นฉบับ) ด้วยตัวเลข `tabular-nums` จัดชิดขวาอ่านง่าย และเวลาซิงก์ล่าสุด
     - **สถานะคิวรอส่ง (Offline Outbox):** แสดงจำนวนรายการค้างส่ง (ถ้ามี) พร้อมปุ่ม **"ส่งคิวที่ค้างตอนนี้"** และปุ่ม **"ล้างคิวที่ผิดพลาด"**
     - **ปุ่มการทำงาน 2 ระดับชัดเจน:**
       1. **ดึงข้อมูลที่เปลี่ยนล่าสุด (Smart Delta Refresh)** — ปุ่มหลักที่แนะนำ ดึงย้อนหลังครอบคลุม 24 ชม. พร้อมตรวจสอบรายการลบ ใช้โควตาน้อยมาก
       2. **ดึงข้อมูลใหม่ทั้งหมดจาก Cloud (Full Pull)** — ปุ่มรองสำหรับซ่อมแซมเมื่อยอดไม่ตรงกัน พร้อมแสดงจำนวนรายการโดยประมาณที่จะถูกอ่านก่อนกดยืนยัน
     - **ส่วนขั้นสูงแบบพับเก็บได้ (Advanced Recovery):** เก็บคำสั่งสำรองข้อมูลจากเครื่องขึ้น Cloud (`Push Local to Cloud`) ไว้ด้านในพร้อมคำเตือนชัดเจน ป้องกันการกดพลาดจาก Sidebar เดิม

### Visual Identity & Theme

- **Aesthetic Direction:** Light Pastel Enterprise SaaS Dashboard — สะอาด โปร่ง ตาไม่ล้า เน้นลำดับชั้นข้อมูลแบบมืออาชีพตามโครงสร้างแอปปัจจุบัน
- **Color Palette & Mood (60-30-10 + Light Pastel Semantic Tokens):**
  - **60% Neutral Canvas:** พื้นหลังขาวนวล (`bg-white` / `bg-slate-50/80`) และเส้นแบ่งบาง 1px (`border-slate-200/80`)
  - **30% Structural Surfaces:** การ์ดและแผงสรุปแบบ Single-Elevation Depth ในโทนพาสเทลอ่อน (`bg-slate-50`, `bg-indigo-50/60`) ไม่มีกรอบซ้อนการ์ดในหลายชั้น
  - **10% Semantic Sync Accents (paired with text/icon — never color alone):**
    - ซิงก์ตรงกันปกติ: Emerald Pastel (`bg-emerald-50`, `text-emerald-700`, `border-emerald-200/80`)
    - พบยอดข้อมูลไม่ตรง (Drift) หรือมีคิวรอส่ง: Amber Pastel (`bg-amber-50`, `text-amber-800`, `border-amber-200`)
    - ข้อผิดพลาด/โควตาเต็ม: Rose Pastel (`bg-rose-50`, `text-rose-700`, `border-rose-200`)
- **Typography & Hierarchy:** คงชุดฟอนต์หลักของแอปเดิมทั้งหมด ใช้ตัวเลข `font-mono tabular-nums` กับยอดเทียบจำนวนคลิป, จำนวนคิวรอส่ง, และเวลาซิงก์ล่าสุดเพื่อให้คอลัมน์เรียงตรงกันไม่กระตุก Metadata แบบคงที่แสดงเป็นข้อความเรียบคั่นด้วย `·` (ไม่ห่อเป็น Pill ซ้อนกัน)
- **Navbar Ergonomics & Mobile Responsive:**
  - **Desktop (`md+`):** วางปุ่มรีเฟรชขนาดกะทัดรัดไว้ด้านซ้ายของตัวนับ "ฟุตพร้อมใช้" ในโซนขวาของ Navbar (`h-9`, `whitespace-nowrap shrink-0`, Touch target $\ge 40\text{px}$)
  - **Mobile (`< md`):** แสดงเป็นปุ่มไอคอนรีเฟรชทรงโค้งมนขนาด `36x36px` ถึง `40x40px` กะทัดรัด พร้อมจุดสถานะเฉพาะเมื่อมี Drift หรือ Outbox ค้างส่ง เพื่อรักษาความสูง Sticky Navbar ให้อยู่ภายใต้เพดาน $\le 15\%$ ของหน้าจอมือถือ
- **Modal & Scrollbar Harmony:**
  - หน้าต่าง Sync Center ครอบด้วย `BaseModal` เรนเดอร์ผ่าน `React.createPortal` แยกเลเยอร์ Framer Motion (enter/exit) ออกจาก CSS layout ชัดเจน
  - เนื้อหาภายในหน้าต่างใช้ Slim Custom Scrollbars (`scrollbar-thin`) รองรับทั้งจอเล็กและจอใหญ่โดยไม่ตัดขอบ

### Interactive Feedback & Motion

- ไอคอนรีเฟรชหมุนนุ่มนวลขณะดึงข้อมูลหรือระบายคิว Outbox และคืนรูปภายใน $\le 200\text{ms}$ เมื่อเสร็จสิ้น
- แสดงแถบสรุปผลลัพธ์ภายในหน้าต่างทันทีหลังกดรีเฟรช (เช่น *"อัปเดตเพิ่ม 4 คลิป, ลบออก 2 คลิป — ข้อมูลตรงกับ Cloud แล้ว"* หรือแจ้งข้อความภาษาไทยที่เข้าใจง่ายกรณีติดเพดานโควตา Firestore)
- รองรับ `prefers-reduced-motion` สำหรับผู้ใช้ที่ปิดแอนิเมชัน

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Persistent IndexedDB Outbox Queue (แทนการปล่อยให้ Write ล้มเหลวแล้วเงียบหาย)**
  - *Chosen Approach:* เก็บทุก Mutation ที่ยิงขึ้น Firestore ไม่ผ่าน (จากเน็ตหลุด, หลับเครื่องกลางคัน, หรือโควตาชั่วคราว) ลง Object Store ใหม่ใน IndexedDB (`sync_outbox`) พร้อมกลไก Coalesce (หากแก้เอกสารเดิมซ้ำ 5 ครั้งขณะออฟไลน์ ให้ยุบเหลือคำสั่งล่าสุด 1 ครั้ง) และส่งซ้ำอัตโนมัติเมื่อเบราว์เซอร์ส่งเหตุการณ์ `online` หรือเมื่อผู้ใช้กดปุ่มส่งซ้ำ
  - *Why:* การันตีความครบถ้วนของข้อมูลในโหมด Local-First และประหยัดโควตา Write เพราะยุบการแก้ไขซ้ำก่อนส่ง
  - *Alternatives Considered:* ใช้แคช Offline ในตัว Firestore SDK เพียงอย่างเดียว — ถูกคัดออกเพราะระบบเรามี Custom IndexedDB cache + SmartSync pulse แยกต่างหาก หากพึ่ง SDK cache อย่างเดียวจะควบคุมสถานะคิวและจัดการตอนโควตาเต็มให้ผู้ใช้เห็นไม่ได้

- **Decision 2: Firestore `runTransaction` สำหรับการอัปเดต Tombstone (`recentDeletes`)**
  - *Chosen Approach:* เมื่อ Pulse มีรายการ `deletedItems` ให้ใช้ `runTransaction` อ่านเอกสารสัญญาณกลาง (`archive_summary_stats`) ฉบับล่าสุดก่อน แล้วค่อยผสาน Tombstone ใหม่ + ตัดรายการหมดอายุ (>14 วัน / >400 รายการ) แล้วเขียนกลับแบบอะตอมมิก (ส่วนการแก้/เพิ่มปกติที่ไม่มีการลบยังคงใช้ `setDoc(..., { merge: true })` แบบ 0 Read เหมือนเดิม)
  - *Why:* ปิดช่องโหว่การลบพร้อมกัน 2 เครื่องในเสี้ยววินาทีได้อย่างเด็ดขาดโดยเสียเพิ่มเพียง 1 Read เฉพาะตอนที่มีคำสั่ง "ลบ" เท่านั้น
  - *Alternatives Considered:* สร้าง Collection `sync_tombstones` แยกต่างหาก — ถูกคัดออกเพราะจะทำให้ทุกเครื่องต้อง Query เพิ่มอีก 1 Collection ทุกรอบซิงก์ซึ่งเปลือง Read กว่ามาก

- **Decision 3: Same-Device Multi-Tab Sync ผ่าน `BroadcastChannel`**
  - *Chosen Approach:* ใช้ `BroadcastChannel` เฉพาะโดเมนเดียวกันกระจายเหตุการณ์เมื่อแท็บใดแท็บหนึ่งเขียนลง IndexedDB หรือรับ Delta จาก Cloud สำเร็จ ให้แท็บพี่น้องโหลดข้อมูลใหม่จาก IndexedDB ทันที
  - *Why:* ปิดปัญหาการแชร์ `localStorage` ข้ามแท็บและอัปเดตหน้าจอทุกแท็บในเครื่องเดียวกันทันทีด้วยต้นทุน **0 Firestore Read**
  - *Alternatives Considered:* ให้แต่ละแท็บเปิด Firestore Listener แยกและไม่แชร์ Timestamp — เปลือง Read ซ้ำซ้อนและทำให้โควตาหมดเร็ว

- **Decision 4: Passive Drift Detection แทน Auto Full-Pull**
  - *Chosen Approach:* เปรียบเทียบยอดในเครื่องกับ `archive_summary_stats` หลังจากหยุดการแก้ไขไปแล้วอย่างน้อย 3 วินาที (Debounce เพื่อไม่ให้แจ้งเตือนหลอกระหว่างกำลังอัปโหลด) หากยอดยังต่างกันให้ขึ้นสัญลักษณ์เตือนเบาๆ ที่ปุ่มบน Navbar ให้ผู้ใช้กดตัดสินใจเอง
  - *Why:* ป้องกันลูปการดึงข้อมูลทั้งหมดอัตโนมัติที่อาจผลาญโควตา Firestore หมดในพริบตา และตรงตามความต้องการของคุณ

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                           Browser UI Layer                                 │
│  ┌──────────────────────────────────┐   ┌───────────────────────────────┐  │
│  │  Navbar (Desktop & Mobile)       │   │  Sync Center Modal (BaseModal)│  │
│  │  • Compact Sync Refresh Button   │──▶│  • Local vs Cloud Count Table │  │
│  │  • Drift / Outbox Subtle Signal  │   │  • Outbox Retry Queue Panel   │  │
│  └──────────────────────────────────┘   │  • Tier 1: Smart Delta Pull   │  │
│                                         │  • Tier 2: Full Cloud Pull    │  │
│                                         │  • Advanced: Local Push Guard │  │
│                                         └──────────────┬────────────────┘  │
└────────────────────────────────────────────────────────┼───────────────────┘
                                                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     CMS Sync Orchestration Layer                           │
│  ┌───────────────────────┐   ┌──────────────────────┐  ┌────────────────┐  │
│  │ Drift Detector Engine │   │ Outbox Queue Worker  │  │ Multi-Tab Bus  │  │
│  │ Local vs Cloud Counts │   │ Auto-Retry + Backoff │  │ BroadcastChan  │  │
│  │ (0 Extra Reads)       │   │ Online/Focus Trigger │  │ (0 Extra Reads)│  │
│  └──────────┬────────────┘   └──────────┬───────────┘  └───────┬────────┘  │
│             └───────────────────────────┼──────────────────────┘           │
│                                         ▼                                  │
│                     ┌───────────────────────────────────┐                  │
│                     │  SmartSync Engine (5 Collections) │                  │
│                     │  Delta Pull · Full Pull · Merge   │                  │
│                     └──────┬─────────────────────┬──────┘                  │
└────────────────────────────┼─────────────────────┼─────────────────────────┘
                             │                     │
              Local-First    ▼                     ▼   Authoritative Cloud
┌──────────────────────────────────┐   ┌─────────────────────────────────────┐
│  Browser IndexedDB (Local Cache) │   │       Firebase Firestore Cloud      │
│  • footages / episodes / sources │   │  • system_settings/                 │
│  • categories / category_groups  │   │      archive_summary_stats (1 Read) │
│  • meta (summary & timestamps)   │   │      [Transactional Tombstones]     │
│  • sync_outbox (Persistent Queue)│   │  • 5 Data Collections               │
└──────────────────────────────────┘   └─────────────────────────────────────┘
```

### Data Model & State

- **Outbox Queue Item (เก็บใน IndexedDB Store `sync_outbox`):**
  - `opKey` (Unique Coalescing Key เช่น `footage::FT-0177` เพื่อรวมการแก้ซ้ำบนเอกสารเดิม)
  - `collection`: 1 ใน 5 กลุ่มข้อมูล (`footages`, `episodes`, `sources`, `categories`, `category_groups`) หรือ `settings`
  - `action`: `upsert` หรือ `delete`
  - `entityId`: รหัสเอกสารเป้าหมาย
  - `payload`: ข้อมูลล่าสุดสำหรับเขียน (เฉพาะกรณี `upsert`)
  - `createdAt`, `updatedAt`, `retryCount`, `lastError`
- **Sync Health Snapshot (In-Memory State สำหรับ Navbar & Sync Center):**
  - `status`: `'synced' | 'syncing' | 'drift_detected' | 'outbox_pending' | 'offline_or_quota'`
  - `lastSyncedAt`: เวลาซิงก์ล่าสุดของเครื่องนี้
  - `outboxCount`: จำนวนรายการค้างส่งใน IndexedDB
  - `driftSummary`: ผลต่างจำนวนรายการเทียบกับ Cloud (`footageDiff`, `episodeDiff`, `sourceDiff`, `hasDrift`)
  - `lastManualSyncReport`: สรุปผลการดึงข้อมูลครั้งล่าสุดที่ผู้ใช้กดเอง (เพิ่ม/แก้กี่รายการ ลบออกกี่รายการ)

### Interactive Component & State Mapping

- **Navbar Compact Sync Button:**
  - แสดงไอคอนรีเฟรช + สถานะแบบกระชับตาม `syncHealth.status`
  - คลิกเปิดหน้าต่าง **Sync Center Modal** (และมี tooltip แสดงเวลาซิงก์ล่าสุด + สาเหตุหากพบ Drift หรือมี Outbox ค้าง)
- **Sync Center Modal (`BaseModal` + Portal):**
  - **กดปุ่ม "ดึงข้อมูลล่าสุด (Smart Delta)":** เรียก `manualDeltaRefresh()` -> อ่าน `archive_summary_stats` 1 ครั้งจากเซิร์ฟเวอร์ -> ดึงเอกสารที่อัปเดตใน 24 ชม. ล่าสุด (หรือตั้งแต่ `localSyncTs - 60s` แล้วแต่ว่าอันไหนเก่ากว่า) + ประยุกต์ใช้ Tombstones -> อัปเดต IndexedDB + กระจายบอกแท็บอื่นผ่าน `BroadcastChannel` -> แสดงรายงานผลลัพธ์
  - **กดปุ่ม "ดึงข้อมูลใหม่ทั้งหมด (Full Reset Pull)":** แสดงขั้นยืนยันสั้นๆ พร้อมระบุยอดเอกสารที่จะอ่านโดยประมาณ -> ดาวน์โหลดทั้ง 5 กลุ่มจาก Firestore มาแทนที่แคช IndexedDB ในเครื่อง -> รีเซ็ต `localSyncTs` และเคลียร์สถานะ Drift
  - **กดปุ่ม "ส่งรายการที่ค้างตอนนี้" (เมื่อ `outboxCount > 0`):** ปลุก Outbox Worker ให้รันทันทีและอัปเดตตัวเลขคิวแบบเรียลไทม์ หากติดโควตา Firestore จะหยุดรอบการส่งอย่างสุภาพและแจ้งข้อความเตือนภาษาไทยให้ลองใหม่เมื่อโควตารีเซ็ต
  - **ส่วนขั้นสูง "อัปโหลดจากเครื่องขึ้น Cloud":** ซ่อนอยู่ใต้แผงพับเก็บได้พร้อมกล่องยืนยัน 2 จังหวะ แทนที่ปุ่ม `seedToCloud` เดิมที่เคยอยู่ใน Sidebar

### Key Sequences & Reliability Safeguards

1. **ลำดับเมื่อเกิด Write Failure (Offline / Quota):**
   - ผู้ใช้แก้หรือลบข้อมูล -> อัปเดต UI + IndexedDB ทันที -> ยิง Firestore -> หากล้มเหลวจะบันทึกลง `sync_outbox` อัตโนมัติ (ไม่โยนข้อมูลทิ้ง) -> Navbar แสดงสถานะรอส่ง -> เมื่อเบราว์เซอร์กลับมา `online` หรือผู้ใช้เปิดแอปใหม่ Worker จะทยอยส่งชุดที่ค้างด้วย Exponential Backoff (2s -> 5s -> 15s -> 30s) แล้วส่ง Write Pulse เมื่อระบายคิวสำเร็จ
2. **ลำดับการป้องกัน Tombstone Race Condition:**
   - เมื่อมี `deletedItems` ใน Pulse -> `flushPendingSyncPulse` ใช้ `runTransaction` อ่าน `recentDeletes` ปัจจุบันจากเซิร์ฟเวอร์ -> Merge + Dedupe + Prune (>14 วัน / >400 รายการ) -> เขียนกลับอย่างปลอดภัย -> แจ้ง Error Handler ตามมาตรฐานหากติดโควตาหรือสิทธิ์เข้าถึง
3. **ลำดับ Same-Device Multi-Tab Sync:**
   - แท็บ A บันทึก/ลบ หรือดึง Delta สำเร็จ -> เขียนลง IndexedDB -> โพสต์ข้อความ `{ type: 'IDB_UPDATED', collections, syncTs, senderTabId }` ผ่าน `BroadcastChannel` -> แท็บ B รับข้อความ (ข้ามหาก `senderTabId` เป็นตัวเอง) -> อ่านข้อมูลล่าสุดจาก IndexedDB เข้า React State ทันทีโดยไม่ยิง Firestore เลย
4. **ข้อควรระวังด้าน Security Rules:**
   - การใช้ `runTransaction` บน `system_settings/archive_summary_stats` ใช้สิทธิ์ read/write บนเอกสารเดิมที่มีอยู่แล้ว ไม่ต้องเพิ่ม Collection ใหม่บน Firestore และยังคงต้องตรวจสอบความถูกต้องของสิทธิ์ (`firestore.rules`) เสมอก่อนใช้งานในวงกว้าง
