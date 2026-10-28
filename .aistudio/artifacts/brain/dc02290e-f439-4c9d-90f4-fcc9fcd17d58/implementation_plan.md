# แผนการอัปเกรดดีไซน์สู่ Professional Lucide SVG Icons & Premium Tinted Badges

## 1. วัตถุประสงค์ (Design Philosophy & Visual Upgrade)
ยกระดับดีไซน์ของทั้งแอปพลิเคชันจากอิโมจิพื้นฐานทั่วไป (`🔵`, `🟢`, `🟡`, `🔴`, `🥇`, `🥈`, `📥`, `👤`, `🐾`) มาเป็น **Lucide React SVG Icons ระดับมืออาชีพ** ด้วยสไตล์ **Translucent Tinted Badges** (พื้นหลังโปร่งแสงอ่อนๆ พร้อมเส้นขอบคมชัดบาง 1px และสีไอคอนตามความหมาย) เพื่อให้ดูเรียบหรู คมชัด สแกนสายตาง่าย และมีความเป็น Enterprise SaaS Footage Management System อย่างแท้จริง

---

## 2. รายละเอียดการอัปเกรดคอมโพเนนต์ส่วนกลาง (Global Core Components)

### 2.1 ป้ายสถานะฟุตเทจทั่วทั้งระบบ (`src/components/ui/StatusBadge.tsx`)
เปลี่ยนจากอิโมจิวงกลมสี (`🔵 🟢 🟡 🔴`) เป็นป้าย Badge แบบ Lucide SVG Icon พร้อมพื้นหลังโปร่งแสงและขอบเส้น:
- **`NEW_UNTOUCHED` (ใหม่แกะกล่อง)**:
  - ใช้ `<Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />`
  - สไตล์: `bg-sky-50/80 border border-sky-200/90 text-sky-900 rounded-lg px-2.5 py-0.5`
- **`READY_FRESH` (พร้อมใช้ / พักสด)**:
  - ใช้ `<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />`
  - สไตล์: `bg-emerald-50/80 border border-emerald-200/90 text-emerald-900 rounded-lg px-2.5 py-0.5`
- **`HIGH_VELOCITY_WARNING` (ใช้ถี่ / เพิ่งพ้นพัก)**:
  - ใช้ `<AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />`
  - สไตล์: `bg-amber-50/80 border border-amber-200/90 text-amber-950 rounded-lg px-2.5 py-0.5`
- **`RECENT_COOLDOWN` (ติดระยะพักห้ามซ้ำ)**:
  - ใช้ `<Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />`
  - สไตล์: `bg-rose-50/80 border border-rose-200/90 text-rose-950 rounded-lg px-2.5 py-0.5`

### 2.2 ป้ายแท็กหมวดหมู่ทั่วทั้งระบบ (`src/components/ui/TagPill.tsx`)
เปลี่ยนจากอิโมจิบุคคล/สัตว์/หัวข้อ (`📥 👤 🐾 🎯 ⚡ 🏷️`) เป็น Lucide SVG Icons คมชัด:
- **พื้นที่พัก (Staging)**: `<Inbox className="w-3.5 h-3.5 text-amber-600" />`
- **บุคคล / สตรีมเมอร์ (Person)**: `<User className="w-3.5 h-3.5 text-indigo-600" />`
- **สัตว์ (Animal)**: `<PawPrint className="w-3.5 h-3.5 text-emerald-600" />`
- **หัวข้อ / ประเด็น (Topic)**: `<Target className="w-3.5 h-3.5 text-rose-600" />`
- **กิริยา / มุกฮา (Action)**: `<Zap className="w-3.5 h-3.5 text-amber-600" />`
- **ทั่วไป (General)**: `<Tag className="w-3.5 h-3.5 text-slate-500" />`

---

## 3. รายละเอียดการปรับโฉม `FootageTraceabilityModal` & Subcomponents

### 3.1 ส่วนหัวหน้าต่าง (`TraceabilityModalHeader.tsx`)
- **แถวระบุตัวตน & ที่มา**:
  - รหัสคลิป: `<Film className="w-3.5 h-3.5 text-slate-400" /> FT-XXXX`
  - ที่มาคลิป: `<Video className="w-3.5 h-3.5 text-slate-600" /> คลิปเดี่ยว 1:1` หรือ `<Scissors className="w-3.5 h-3.5 text-indigo-600" /> SRC-XXXX (12:05-12:45)`
  - วันที่นำเข้า: `<Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatThaiDate(createdAt)}`
  - สถานะขวาสุด: `StatusBadge` แบบ SVG ใหม่
- **แถบ 4 KPIs แถวเดียว (Single-Row Lucide Badges)**:
  1. `<Clapperboard className="w-3.5 h-3.5 text-indigo-600" /> ใช้ {totalUsageCount}x` (bg-indigo-50/70 border-indigo-200)
  2. `<Activity className="w-3.5 h-3.5 text-amber-600" /> 90d: {usageLast90Days}/{max}` (bg-amber-50/70 border-amber-200)
  3. `<Clock className="w-3.5 h-3.5 text-emerald-600" /> พัก {daysSinceLastUsed}d` หรือ `<Sparkles className="w-3.5 h-3.5 text-sky-600" /> ใหม่แกะกล่อง`
  4. `<GitMerge className="w-3.5 h-3.5 text-purple-600" /> คู่ผสม {coUsedCount} ฟุต` (bg-purple-50/70 border-purple-200)
- **แถบสลับแท็บ Segmented**:
  - แท็บ 1: `<FileEdit className="w-3.5 h-3.5" /> ข้อมูล & แท็ก`
  - แท็บ 2: `<Trophy className="w-3.5 h-3.5" /> ประวัติ EP ({count})`
  - แท็บ 3: `<GitMerge className="w-3.5 h-3.5" /> คู่ผสมซ้ำ ({count})`

### 3.2 แท็บข้อมูล ลิงก์ & หมวดหมู่ (`TraceabilityDetailsTab.tsx`)
- **การ์ดข้อมูลและชื่อไฟล์**:
  - หัวการ์ด: `<FileText className="w-4 h-4 text-indigo-600" /> ข้อมูลช็อต & ชื่อไฟล์`
  - กล่องชื่อไฟล์มาตรฐาน: `<FileCode className="w-3.5 h-3.5 text-slate-500" /> {standardFileName}` พร้อมปุ่ม `<Copy /> / <Check /> คัดลอก`
  - ช่องกรอก: `<Film /> ชื่อช็อตฟุตเทจ` และ `<Mic /> บทพากย์มาสคอต`
- **การ์ดลิงก์ 2 ช่อง (Drive & Original Link)**:
  - Google Drive: `<FolderCheck className="w-4 h-4 text-emerald-600" /> Google Drive` พร้อม Badge สถานะ `<CheckCircle2 /> พร้อมใช้` หรือ `<Clock /> รออัปโหลด`
  - ลิงก์ต้นฉบับ: `<Link2 className="w-4 h-4 text-indigo-600" /> ลิงก์คลิปต้นฉบับ` พร้อมป้ายแพลตฟอร์ม `<ExternalLink />`
- **การจัดการหมวดหมู่แบบพับเก็บ (Clean Accordion)**:
  - แสดงแถบหมวดหมู่ปัจจุบันด้วย `TagPill` ชุดใหม่
  - ปุ่มสลับด่วน `<Inbox className="w-3.5 h-3.5" /> พักไว้ก่อน`
  - ปุ่ม `<SlidersHorizontal className="w-3.5 h-3.5" /> แก้ไขหมวดหมู่ 3 ชั้น` ที่กดแล้วกางตัวเลือกออกอย่างนุ่มนวลด้วย Framer Motion

### 3.3 แท็บประวัติใช้ในคลิปหลัก (`TraceabilityEpisodeHistoryTab.tsx`)
- อันดับ 1: Badge `<Trophy className="w-3.5 h-3.5 text-amber-500" /> อันดับ 1` (bg-amber-50 border-amber-200)
- อันดับ 2: Badge `<Medal className="w-3.5 h-3.5 text-slate-400" /> อันดับ 2` (bg-slate-100 border-slate-200)
- อันดับ 3: Badge `<Medal className="w-3.5 h-3.5 text-amber-700" /> อันดับ 3` (bg-amber-100/60 border-amber-300)
- อันดับ 4–5: Badge `<Award className="w-3.5 h-3.5 text-indigo-600" /> อันดับ 4 / 5`
- รอบเวลา: Badge `<Sun className="w-3 h-3 text-amber-500" /> 06:00` หรือ `<Moon className="w-3 h-3 text-indigo-500" /> 18:00`

### 3.4 แท็บคู่ผสมซ้ำ (`TraceabilityCoUsageTab.tsx`)
- ป้ายหัวการ์ด: `<Film className="w-3.5 h-3.5 text-slate-500" /> FT-XXXX` คู่กับ Badge `<Layers className="w-3.5 h-3.5 text-amber-600" /> {count} EP`
- แสดงแท็กด้วย `TagPill` แบบ SVG ใหม่ พร้อมปุ่ม `<ArrowUpRight className="w-3.5 h-3.5" /> ตรวจสอบฟุตนี้`
