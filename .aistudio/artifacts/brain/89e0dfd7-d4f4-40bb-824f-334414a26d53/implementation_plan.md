# UX & Taxonomy Scaling Plan: 30–100 Series Categories Management

> [!IMPORTANT]
> **Summary of User Confirmed Decisions (Phase 1):**
> 1. **2-Tier Navigation Structure**: Scale from a flat 100-tab row to a 2-level hierarchy: Tier 0 Category Group filter (e.g., บุคคล, พฤติกรรม, ธีม) followed by Tier 1 Series chips.
> 2. **Flexible Episode Numbering Scope**: Allow user to choose EP numbering at either Tier 1 (Main Category Series) or Tier 2 (Subcategory Special Series) when building episodes.
> 3. **Dual View Modes in Master Archive**: Provide a prominent view toggle between **รายตอน (Episode View)** and **รายซีรีส์ (Series Shelf Hub)** so editors can manage by individual video or entire show franchises.

---

## 1. Overview & Core Concept

### What It Does
Upgrades Riang-Rueang-Lan CMS's categorization and archive architecture to comfortably manage **30 to 100+ series categories** without UI clutter, endless horizontal scrolling, or lost context. It introduces:
1. **2-Tier Series Filtering Bar** across the archive and builder.
2. **Series Shelf Hub (คลังชั้นวางซีรีส์)**: A catalog dashboard where each card represents an entire series franchise showing total episodes, latest EP, available footage reserve, and a 1-click button to produce the next episode (`+ สร้าง EP ถัดไป`).
3. **Dual-Tier Episode Numbering Engine**: Allows episodes to be automatically sequenced either by Tier 1 Main Category (e.g. *5 อันดับ พระฮาๆ EP.12*) or by Tier 2 Subcategory (e.g. *5 อันดับ หลวงพี่สายฮา EP.3*).

### Target Audience & Persona
- **Channel Creator & Production Lead**: Needs a high-level view of all 30–100 series to identify which shows are running low on content and which series are due for their next weekly episode.
- **Video Editor & Scriptwriter**: Needs quick 2-click filtering to pull up all past episodes of a specific franchise to verify past jokes and scripts.

---

## 2. User Experience & Visual Design

### A. 2-Tier Navigation Bar (Hierarchical Series Filtering)
Instead of 100 flat tabs crammed into one row:
- **Level 1 (Tier 0 Category Groups)**: Clean, soft segmented pill buttons (`ทั้งหมด`, `บุคคล/ดารา`, `พฤติกรรม/กิริยา`, `ธีม/สถานการณ์`, `ทั่วไป`) with total episode counters.
- **Level 2 (Tier 1 Series in Selected Group)**: Shows only the 8–15 series belonging to that group, plus a search-as-you-type filter input with instant category suggestions.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  กลุ่มใหญ่: [ ทั้งหมด (24) ]  [ บุคคล/ดารา (10) ]  [ พฤติกรรม (8) ]  [ ธีม/สถานการณ์ (6) ]    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  ซีรีส์:   [ ทั้งหมด ]  [ #พระฮาๆ (4) ]  [ #พูดผิดฮาๆ (3) ]  [ #ดาราฮาๆ (3) ]  [ 🔍 ค้นหาหมวด... ]  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### B. Dual Archive View Modes: `Episodes View` vs. `Series Shelf Hub`
A clear toggle at the top of `MasterEpisodeArchiveView.tsx`:
1. **มุมมองรายตอน (Episodes View)**:
   - Displays individual produced episodes (Cards or Table) with the series badge (`พระฮาๆ · EP.4`) and Global ID (`EP-0012`).
   - Filterable by 4-Stage Workflow (Mixing, Scripting, Editing, Published).
2. **มุมมองรายซีรีส์ (Series Shelf Hub)**:
   - Grid of Series Franchise Cards (e.g., 30–100 series shelves).
   - Each card displays:
     - **Series Title & Group Badge**: e.g. *ซีรีส์ 5 อันดับ พระฮาๆ* (`ธีม/สถานการณ์`)
     - **Total Episode Count & Latest EP**: e.g. `สร้างแล้ว 4 ตอน` · `ล่าสุด EP.4 (28 ต.ค. 69)`
     - **Stock Health**: Ready footages remaining in this series (`ว่าง 14 ฟุต` · `ฟุตใหม่ 5 ตัว`)
     - **Action Buttons**:
       - `ดูตอนทั้งหมด (View Episodes)`: Filters the Episodes View to this series.
       - `+ สร้าง EP ถัดไป (Build Next EP.5)`: Jumps directly into Episode Builder with this category and recipe pre-loaded!

### C. Visual Identity & Palette
- **Palette**: Strictly light pastel earth-tone palette (`#FAF7F2` Warm Cream canvas, Soft Sage `bg-emerald-50 text-emerald-800 border-emerald-200`, Warm Amber `bg-amber-100 text-amber-950 border-amber-300`).
- **Typography**: Clean sans (`Plus Jakarta Sans` / `Outfit` display) with monospace tabular numerals for episode codes (`EP-0012`) and Thai dates.
- **Anti-AI Slop**: No generic neon purple, no pill badge sandwiches, no fake scoreboard metrics, and responsive desktop layout (max-w-1440px).

---

## 3. Key Architectural Decisions & Data Strategy

### System Architecture Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CMS State & Category Matrix                          │
│        (CategoryGroups: Tier 0 ──▶ MainTags: Tier 1 ──▶ SubTags: Tier 2)        │
└───────────────────────────┬──────────────────────────────────┬───────────────────┘
                            │                                  │
                            ▼                                  ▼
┌───────────────────────────────────────────────┐  ┌────────────────────────────────┐
│           EpisodeBuilderView.tsx              │  │  MasterEpisodeArchiveView.tsx  │
│                                               │  │                                │
│ 1. 3-Tier Category Picker                     │  │ 1. 2-Tier Navigation Bar       │
│ 2. EP Scope Toggle:                           │  │    (Group Filter ──▶ Series)   │
│    - Tier 1 Main (e.g. พระฮาๆ EP.4)           │  │ 2. Dual View Mode:             │
│    - Tier 2 Sub (e.g. หลวงพี่ฮาๆ EP.2)         │  │    ├─ [Episodes View] (Cards)  │
│ 3. Post-Save Success Modal:                   │  │    └─ [Series Shelf Hub] (Grid)│
│    - 1-Click Drive Filename Copy              │  │ 3. 4-Stage Workflow Filters    │
│    - Fast Track "+ ทำตอนต่อไปในหมวดนี้"       │  │ 4. Direct "+ สร้าง EP ถัดไป"   │
└───────────────────────────────────────────────┘  └────────────────────────────────┘
```

### Technical Changes Breakdown

1. **`src/types/episode.types.ts`**:
   - Add `categoryEpisodeScope?: 'MAIN_CATEGORY' | 'SUBCATEGORY';` to `Episode` to record whether the episode was numbered at Tier 1 or Tier 2.
   - Add `seriesId?: string;` (which references either the Tier 1 tag ID or Tier 2 tag ID).

2. **`src/context/cms/useCMSEpisodeActions.ts`**:
   - Update `saveEpisode`: Automatically calculate `categoryEpisodeNo` according to `categoryEpisodeScope`:
     - If `MAIN_CATEGORY`: count existing episodes with matching `mainCategoryTagId`.
     - If `SUBCATEGORY`: count existing episodes with matching `targetSubcategoryId`.

3. **`src/components/episodes/builder/useEpisodeBuilder.ts` & `BuilderStep4MetadataForm.tsx`**:
   - In Step 4, add a clean toggle:
     - `นับเลข EP ตามหมวดหลัก (#ชื่อหมวดหลัก EP.X)` (Default)
     - `นับเลข EP ตามหมวดย่อยเดี่ยว (#ชื่อหมวดย่อย EP.Y)` (Active when in Single Subcategory Special mode)
   - Real-time headline preview updates immediately upon toggling.

4. **`src/components/episodes/MasterEpisodeArchiveView.tsx`**:
   - Implement **Dual View Mode**:
     - `viewType: 'EPISODES' | 'SERIES_SHELF'` (Default: 'EPISODES')
   - Implement **2-Tier Category Filtering**:
     - Level 1: `selectedGroupId` (`ALL` | `GRP-...`)
     - Level 2: `categoryFilter` (`ALL` | `TAG-...`)
   - Build **Series Shelf Hub Component**:
     - Aggregates episode count, latest release date, usable footage stock, and producible episode count per category.
     - 1-click button to jump directly into the builder for that series.
   - Connect **4-Stage Workflow Filter** & Smart Search across both views.

---

## 4. Verification & Testing Plan

1. **Category Scaling Test**:
   - Test filtering with all category groups (Tier 0) to ensure smooth transitions between groups with 0, 5, or 20+ series categories.
2. **Dual Numbering Test**:
   - Create an episode under Tier 1 Main Category Variety: verify it saves as `พระฮาๆ EP.X`.
   - Create an episode under Tier 2 Single Subcategory Special: verify it can save as `หลวงพี่ฮาๆ EP.Y`.
   - Confirm both numbers persist in `localStorage` and Firestore without collision.
3. **Series Shelf Hub Test**:
   - Switch between **รายตอน (Episodes View)** and **รายซีรีส์ (Series Shelf Hub)**.
   - Verify that clicking `ดูตอนทั้งหมด` on a series card filters the episodes list accurately.
   - Verify that clicking `+ สร้าง EP ถัดไป` opens EpisodeBuilder with the target series pre-selected.
4. **Compile & Lint Verification**:
   - Run `lint_applet` (`tsc --noEmit`) to verify zero type mismatches.
   - Run `compile_applet` (`npm run build`) to ensure successful Vite bundling.
