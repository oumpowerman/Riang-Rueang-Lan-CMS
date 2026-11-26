# Relocate Category & Series Filters into Sub-Filters Drawer

Move the two-row Category and 72-Series pill bar out of the top workspace canvas and consolidate both controls as clean dropdowns inside the collapsible Sub-Filters drawer (`ตัวกรองย่อย`), freeing vertical space so Episode Cards/Table and the Series Shelf start higher above the fold.

## User Review & Critical Decisions

> [!IMPORTANT] All three architectural and UX choices for relocating the Category and Series controls were confirmed during clarification:
> - **Series Shelf Filtering Scope**: Remove the top Category & Series bar completely across all tabs; the Series Shelf tab filters strictly via its built-in search box (`ค้นหารายการหรือแท็ก...`).
> - **Control Format Inside Sub-Filters**: Replace the multi-row pill strips and 72-item `กางดู` expansion with compact single-row native/styled `<select>` dropdowns for both Category (`หมวดคลัง`) and 5-Rank Series (`รายการ`), alongside Production Format and Subcategory.
> - **Drawer Behavior on External Selection**: Keep the Sub-Filters drawer collapsed by default even when a Category or Series filter is triggered externally (from KPI cards or Series Shelf `"ดู (N)"`), communicating active selections via the badge counter on the Sub-Filters button and removable filter chips in the active strip below.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates the persistent two-row horizontal pill bar (`หมวด` + `รายการ` with 72 items) that currently sits between the KPI strip and the main content tabs, tucking Category (`หมวดคลัง`) and Series (`รายการ`) selection cleanly inside the animated `ตัวกรองย่อย` panel inside the Episodes view.
- **Target Audience / Persona**: Video editors and content producers browsing or filtering the Master Episode Archive who primarily search by keyword, status, or 3-tier tags—and only drill down by Category or Series on demand.
- **Key Value**: Reclaims ~90px of prime vertical screen height, removes visual bloat of 70+ pills above every view, eliminates horizontal pill scrollbars, and makes the Series Shelf purely search-driven.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Default Episodes View**: Displays only the compact KPI header, optional Standard-Fix warning strip, and unified Search/Filter toolbar—pushing Episode Cards/Table directly into the primary viewport.
  2. **Drilling Down via Sub-Filters (`ตัวกรองย่อย`)**: Clicking `ตัวกรองย่อย` smoothly slides down a compact grid containing 4 single-row controls: `หมวดคลัง` (Dropdown with item/EP counts), `รายการ` (Dropdown showing scoped series filtered by selected Category + EP counts), `รูปแบบ` (Segmented toggle), and `หมวดย่อย` (Conditional dropdown).
  3. **Selecting Category Filters Cascade**: Changing `หมวดคลัง` updates the options inside the `รายการ` dropdown automatically and resets an incompatible series selection to `ทั้งหมด`.
  4. **External Selection & Active Chips**: Clicking a KPI card (`ผลิตสูงสุด` / `ผลิตน้อยสุด`) or clicking `ดู (N)` from a Series Shelf card applies the filter while leaving `ตัวกรองย่อย` collapsed. The `ตัวกรองย่อย (N)` button badge increments to reflect active sub-filters, and removable filter chips (`หมวด: ...`, `รายการ: ...`) slide into the active strip below for instant 1-click clearing.
  5. **Series Shelf Tab**: Contains only its unified toolbar (`ค้นหารายการหรือแท็ก...`, total summary count, and `ดูหมวด 0 ตอน` toggle) above the responsive 3-column shelf cards—unaffected by any Category filter chosen on the Episodes tab.
- **Visual Identity & Theme**:
  - *Palette*: Warm parchment/linen neutrals (`#FDFBF7`, `#FAF6EE`, `#E8DFD3` 1px borders) with restrained forest green (`#224A2D`) and warm amber-brown (`#6B4616`) active accents.
  - *Typography & Layout*: Single-row `whitespace-nowrap` control labels paired with crisp `tabular-nums` EP counts inside dropdown options (`คนไทยเป็นคนตลก (33)`) and uncluttered whitespace alignment.
- **Interactive Feedback & Motion**:
  - Smooth Framer Motion `height: 0 <-> auto` + `opacity` slide-down/up for the `ตัวกรองย่อย` container and active chip row (`ease: [0.16, 1, 0.3, 1]`, respecting `useReducedMotion()`).
  - Rotating chevron indicator driven purely by Framer Motion without CSS transform conflicts.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Remove Category Filtering from Series Shelf**
  - *Chosen Approach*: Ignore `selectedGroupId` when computing Shelf cards so the Shelf always searches across the full catalog via its own search input.
  - *Why*: With no visible Category control on the Shelf tab, silently inheriting a hidden Category filter from the Episodes tab would confuse users into thinking series disappeared.
  - *Alternatives Considered*: Keeping a slim Category pill bar or dropdown inside Shelf (passed over per user preference for search-only Shelf).

- **Decision 2: Native Dropdowns vs. Custom Popover Menu for Category & 72 Series**
  - *Chosen Approach*: Clean styled `<select>` dropdowns matching the existing Subcategory selector inside `ตัวกรองย่อย`.
  - *Why*: Zero z-index stacking bugs, keyboard/mobile native wheel friendliness for 72+ series options, zero extra DOM height when closed, and instant cross-filtering by Category.
  - *Alternatives Considered*: Keeping 72 wrap-able pills inside `ตัวกรองย่อย` (too tall when expanded) or custom searchable comboboxes (unnecessary when main Search already supports smart series/tag search).

- **Decision 3: User-Controlled Sub-Filters Open State**
  - *Chosen Approach*: Remove automatic forced expansion when `activeSecondaryCount > 0`; display a numeric badge on `ตัวกรองย่อย` instead and show removable pills in the Active Filter Strip.
  - *Why*: Prevents UI layout jump when clicking KPI cards or navigating from the Series Shelf.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│ Master Episode Archive Coordinator                                   │
│  ├─ Overview Header (Tab Switcher: Episodes | Shelf + 4 KPI Cards)   │
│  ├─ Compact Standard-Fix Strip                                       │
│  └─ Animated Tab Viewport                                            │
│      ├─ [Episodes Tab]                                               │
│      │   ├─ Filter Controls                                          │
│      │   │   ├─ Search Input + [3-Tier Tags] + [Sub-Filters (N)]     │
│      │   │   ├─ Slide-Down Sub-Filters Panel (User-Toggled)          │
│      │   │   │   ├─ Category <select> (archiveCategoryStats)         │
│      │   │   │   ├─ Series <select>   (categoriesInGroup)            │
│      │   │   │   ├─ Format Segmented  (ALL | Variety | Subcategory)  │
│      │   │   │   └─ Subcategory <select> (when available)            │
│      │   │   ├─ Status Dropdown + Count + Sort + Cards/Table Switch  │
│      │   │   └─ Active Filter Chips Strip (always shows active state)│
│      │   ├─ 3-Tier Tag Filter Drawer                                 │
│      │   └─ Episode Cards Grid / Table View                          │
│      └─ [Series Shelf Tab]                                           │
│          └─ Shelf Toolbar (Search Only + 0 EP Toggle) + Series Cards │
└──────────────────────────────────────────────────────────────────────┘
```

- **State & Data Flow**:
  - `selectedGroupId` and `categoryFilter` remain managed in the archive filter hook; `categoriesInGroup` dynamically scopes the `รายการ` `<select>` options whenever `selectedGroupId` changes, and `useMemo` for Shelf items computes strictly from `categoryRanking` + `unproducedSeriesRanking` + `queryTokens` without filtering by `selectedGroupId`.
  - Changing `หมวดคลัง` calls `onGroupChange(nextGroupId)` and resets `onCategoryChange('ALL')` so invalid cross-group selections cannot persist.
  - `activeSecondaryCount` aggregates `(selectedGroupId !== 'ALL') + (categoryFilter !== 'ALL') + (subcategoryFilter !== 'ALL') + (productionTargetFilter !== 'ALL')` to badge the `ตัวกรองย่อย` trigger without forcing the drawer open.
  - The standalone navigation pill bar component (`SeriesNavigationFilterBar`) becomes obsolete and can be cleanly removed once wired.
