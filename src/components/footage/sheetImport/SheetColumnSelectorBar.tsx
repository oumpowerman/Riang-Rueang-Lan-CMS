import React from 'react';
import {
  Check,
  Columns3,
  KeyRound,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_SHEET_COLUMN_SYNC_CONFIG,
  SheetColumnSyncConfig,
} from './sheetImport.types';

interface SheetColumnSelectorBarProps {
  columnSyncConfig: SheetColumnSyncConfig;
  onChangeColumnSyncConfig: (next: SheetColumnSyncConfig) => void;
  syncEpisodesFromColD: boolean;
}

interface ColumnToggleItem {
  key: keyof SheetColumnSyncConfig;
  colBadge: string;
  label: string;
  desc: string;
  activeClass: string;
}

const COLUMN_TOGGLE_ITEMS: ColumnToggleItem[] = [
  {
    key: 'syncColB_EpTitle',
    colBadge: 'Col B',
    label: 'ชื่อคลิป EP',
    desc: 'ถ้าปิด = คงชื่อคลิปหลัก (และคำสร้อยท้ายชื่อคลิป) ที่มีอยู่ในระบบเดิมไว้ ไม่เอาชื่อในชีทไปทับ',
    activeClass: 'bg-[#EEF5EE] text-[#1C4824] border-[#9CC5A4]',
  },
  {
    key: 'syncColC_RankTitle',
    colBadge: 'Col C',
    label: 'ชื่ออันดับ',
    desc: 'อัปเดตชื่ออันดับ (เช่น จอมยุทธ์เสก) ลงในสล็อตจัดอันดับ 5–1 และโน้ตฟุตเทจ',
    activeClass: 'bg-[#FEF6E8] text-[#734B17] border-[#E6C794]',
  },
  {
    key: 'syncColD_Punchline',
    colBadge: 'Col D',
    label: 'คำสร้อย',
    desc: 'อัปเดตคำสร้อยประจำอันดับ (เช่น สำนักไหนเนี่ย) ลงในสล็อตจัดอันดับ 5–1 และโน้ตฟุตเทจ',
    activeClass: 'bg-[#FEF6E8] text-[#734B17] border-[#E6C794]',
  },
  {
    key: 'syncColE_Tier1Tags',
    colBadge: 'Col E',
    label: 'แท็ก Tier 1',
    desc: 'ซิงก์แท็กหมวดกว้าง/วงการ (เช่น #คนดัง #ศิลปิน)',
    activeClass: 'bg-[#EEF5FB] text-[#1E40AF] border-[#A7C8EC]',
  },
  {
    key: 'syncColF_Tier2Tags',
    colBadge: 'Col F',
    label: 'แท็ก Tier 2',
    desc: 'ซิงก์แท็กบริบท/สไตล์คลิป (เช่น #ไลฟ์สด #สัมภาษณ์)',
    activeClass: 'bg-[#FEF6E8] text-[#8A4D1F] border-[#E6C794]',
  },
  {
    key: 'syncColG_Tier3Tags',
    colBadge: 'Col G',
    label: 'แท็ก Tier 3',
    desc: 'ซิงก์แท็กชื่อบุคคล/รายการ (เช่น #พี่เสก #โหนกระแส #แก๊นโบ้)',
    activeClass: 'bg-[#EDF6F0] text-[#1C4824] border-[#9CC5A4]',
  },
  {
    key: 'syncColH_Url',
    colBadge: 'Col H',
    label: 'ลิงค์ YouTube',
    desc: 'อัปเดตลิงก์ YouTube Shorts เข้าคลิปหลัก EP (และใช้ช่วยจับคู่ EP เดิมอัตโนมัติ)',
    activeClass: 'bg-[#F3EFFA] text-[#5B328A] border-[#C9B6E4]',
  },
  {
    key: 'syncColIJ_DateAndTime',
    colBadge: 'Col I–J',
    label: 'วันที่ & เวลา',
    desc: 'อัปเดตวันที่และรอบเวลาเผยแพร่ (ถ้าปิดหรือเว้นว่าง จะคงวันที่เดิมในระบบไว้)',
    activeClass: 'bg-[#EEF5EE] text-[#1C4824] border-[#9CC5A4]',
  },
];

export const SheetColumnSelectorBar: React.FC<SheetColumnSelectorBarProps> = ({
  columnSyncConfig,
  onChangeColumnSyncConfig,
  syncEpisodesFromColD,
}) => {
  const handleToggleKey = (key: keyof SheetColumnSyncConfig) => {
    onChangeColumnSyncConfig({
      ...columnSyncConfig,
      [key]: !columnSyncConfig[key],
    });
  };

  const applyPresetKeepSystemEpTitle = () => {
    onChangeColumnSyncConfig({
      syncColB_EpTitle: false, // ปิด Col B เพื่อไม่ให้ทับชื่อคลิปหลักที่แต่งคำสร้อยไว้ในระบบแล้ว
      syncColC_RankTitle: true,
      syncColD_Punchline: true,
      syncColE_Tier1Tags: true,
      syncColF_Tier2Tags: true,
      syncColG_Tier3Tags: true,
      syncColH_Url: true,
      syncColIJ_DateAndTime: false,
    });
  };

  const applyPresetTagsOnly = () => {
    onChangeColumnSyncConfig({
      syncColB_EpTitle: false,
      syncColC_RankTitle: false,
      syncColD_Punchline: false,
      syncColE_Tier1Tags: true,
      syncColF_Tier2Tags: true,
      syncColG_Tier3Tags: true,
      syncColH_Url: false,
      syncColIJ_DateAndTime: false,
    });
  };

  const applyPresetPunchlineAndRankOnly = () => {
    onChangeColumnSyncConfig({
      syncColB_EpTitle: false,
      syncColC_RankTitle: true,
      syncColD_Punchline: true,
      syncColE_Tier1Tags: false,
      syncColF_Tier2Tags: false,
      syncColG_Tier3Tags: false,
      syncColH_Url: false,
      syncColIJ_DateAndTime: false,
    });
  };

  const applyPresetAll = () => {
    onChangeColumnSyncConfig({ ...DEFAULT_SHEET_COLUMN_SYNC_CONFIG });
  };

  const enabledCount = Object.values(columnSyncConfig).filter(Boolean).length;

  return (
    <div className="px-4 sm:px-5 py-2 bg-[#F7F3EC] border-b border-[#E5DBC9] shrink-0 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3D332A]">
            <Columns3 className="w-3.5 h-3.5 text-[#3B6845]" />
            <span>เลือกคอลัมน์ที่จะซิงก์ ({enabledCount}/8 ช่อง):</span>
          </span>

          {/* Locked Primary Key: Col A */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#E9E2D8] text-[#524538] border border-[#D5C9B8]"
            title="คอลัมน์ A (ชื่อฟุต) ใช้เป็นคีย์หลักสำหรับจับคู่ฟุตเทจในคลังเสมอ"
          >
            <KeyRound className="w-3 h-3 text-[#6E5F52]" />
            <span className="font-mono">Col A</span>
            <span>ชื่อฟุต (คีย์จับคู่)</span>
          </span>

          {/* Individual Column Toggles (Col B - Col J) */}
          {COLUMN_TOGGLE_ITEMS.map((item) => {
            const isChecked = columnSyncConfig[item.key];
            const isEpRelatedButDisabled =
              !syncEpisodesFromColD &&
              (item.key === 'syncColB_EpTitle' ||
                item.key === 'syncColH_Url' ||
                item.key === 'syncColIJ_DateAndTime');

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggleKey(item.key)}
                title={item.desc}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer select-none ${
                  isEpRelatedButDisabled
                    ? 'bg-[#F2EFE9] text-[#A89B8D] border-[#E2D9CC] opacity-60'
                    : isChecked
                    ? `${item.activeClass} shadow-2xs`
                    : 'bg-white/80 hover:bg-white text-[#8C7B6C] border-[#DFD5C7] line-through decoration-[#B5A798]'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    isChecked && !isEpRelatedButDisabled
                      ? 'bg-[#3B6845] border-[#3B6845] text-white'
                      : 'bg-white border-[#C5B49E]'
                  }`}
                >
                  {isChecked && !isEpRelatedButDisabled && (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  )}
                </span>
                <span className="font-mono text-[10px] opacity-85">
                  {item.colBadge}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="text-[#7D6E61] font-semibold hidden xl:inline">
            โหมดด่วน:
          </span>
          <button
            type="button"
            onClick={applyPresetKeepSystemEpTitle}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition-colors cursor-pointer ${
              !columnSyncConfig.syncColB_EpTitle &&
              columnSyncConfig.syncColC_RankTitle &&
              columnSyncConfig.syncColD_Punchline &&
              columnSyncConfig.syncColE_Tier1Tags
                ? 'bg-[#3B6845] text-white border-[#2D5236]'
                : 'bg-white hover:bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF]'
            }`}
            title="ซิงก์คำสร้อย Col C-D + แท็ก 3 ชั้น Col E-G + ลิงก์ Col H โดยไม่เอาชื่อคลิป Col B ในชีทไปทับชื่อคลิปหลักในระบบ"
          >
            <Lock className="w-3 h-3" />
            <span>ล็อกชื่อคลิป EP ในระบบ (ซิงก์เฉพาะ C–H)</span>
          </button>

          <button
            type="button"
            onClick={applyPresetTagsOnly}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition-colors cursor-pointer ${
              !columnSyncConfig.syncColB_EpTitle &&
              !columnSyncConfig.syncColC_RankTitle &&
              !columnSyncConfig.syncColD_Punchline &&
              columnSyncConfig.syncColE_Tier1Tags &&
              columnSyncConfig.syncColF_Tier2Tags &&
              columnSyncConfig.syncColG_Tier3Tags
                ? 'bg-[#1E40AF] text-white border-[#1E3A8A]'
                : 'bg-white hover:bg-[#EEF5FB] text-[#1E40AF] border-[#C6DDF2]'
            }`}
            title="อัปเดตเฉพาะแท็ก 3 ชั้น (Col E, F, G) อย่างเดียว"
          >
            <span>เฉพาะ Tag 3 Tier (E–G)</span>
          </button>

          <button
            type="button"
            onClick={applyPresetPunchlineAndRankOnly}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition-colors cursor-pointer ${
              !columnSyncConfig.syncColB_EpTitle &&
              columnSyncConfig.syncColC_RankTitle &&
              columnSyncConfig.syncColD_Punchline &&
              !columnSyncConfig.syncColE_Tier1Tags
                ? 'bg-[#8A4D1F] text-white border-[#734B17]'
                : 'bg-white hover:bg-[#FEF6E8] text-[#734B17] border-[#EAD5AE]'
            }`}
            title="อัปเดตเฉพาะชื่ออันดับและคำสร้อยแต่ละอันดับ (Col C, D) อย่างเดียว"
          >
            <span>เฉพาะชื่ออันดับ & คำสร้อย (C–D)</span>
          </button>

          <button
            type="button"
            onClick={applyPresetAll}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold bg-white hover:bg-[#FAF7F2] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer"
            title="เปิดซิงก์ครบทุกคอลัมน์ (B–J)"
          >
            <Sparkles className="w-3 h-3 text-[#8A5A22]" />
            <span>เลือกครบ (B–J)</span>
          </button>
        </div>
      </div>

      {!columnSyncConfig.syncColB_EpTitle && syncEpisodesFromColD && (
        <div className="text-[11px] text-[#1C4824] bg-[#EEF5EE] border border-[#BAD8BF] rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-[#3B6845] shrink-0" />
          <span>
            <strong>ล็อกชื่อคลิปหลัก EP ในระบบ:</strong> ระบบจะจับคู่ EP เดิมจาก{' '}
            <strong>ลิงก์ YouTube (Col H)</strong> หรือ{' '}
            <strong>ชุดฟุตเทจ 5 อันดับที่ตรงกัน</strong> แล้วอัปเดตเฉพาะคอลัมน์ที่ติ๊กเลือก{' '}
            <u>โดยไม่เอาชื่อคลิป Col B ในชีทไปทับชื่อคลิปหลักในระบบ</u>
          </span>
        </div>
      )}
    </div>
  );
};
