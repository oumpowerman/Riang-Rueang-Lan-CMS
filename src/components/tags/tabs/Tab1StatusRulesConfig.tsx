import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { ComputedFootage } from '../../../types/footage.types';
import { SystemSettings } from '../../../types/tag.types';
import { INITIAL_SETTINGS } from '../../../services/seedData';
import { simulateStatusDistribution } from '../../../utils/cooldownCalculator';
import { STATUS_RULE_PRESETS } from '../constants/tagPastelPalette';

interface Tab1StatusRulesConfigProps {
  settings: SystemSettings;
  computedFootage: ComputedFootage[];
  onUpdateSettings: (updates: Partial<SystemSettings>) => void;
  onProceedToTab2: () => void;
}

export const Tab1StatusRulesConfig: React.FC<Tab1StatusRulesConfigProps> = ({
  settings,
  computedFootage,
  onUpdateSettings,
  onProceedToTab2,
}) => {
  const [cooldownDays, setCooldownDays] = useState<number>(settings.cooldownDays ?? 14);
  const [greenReadyDays, setGreenReadyDays] = useState<number>(settings.greenReadyDays ?? 21);
  const [maxUsagePer90Days, setMaxUsagePer90Days] = useState<number>(
    settings.maxUsagePer90Days ?? 3
  );
  const [yellowTotalUsageCount, setYellowTotalUsageCount] = useState<number>(
    settings.yellowTotalUsageCount ?? 4
  );
  const [maxTotalUsageCount, setMaxTotalUsageCount] = useState<number>(
    settings.maxTotalUsageCount ?? 8
  );
  const [minAvgDaysBetweenUses, setMinAvgDaysBetweenUses] = useState<number>(
    settings.minAvgDaysBetweenUses ?? 25
  );
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setCooldownDays(settings.cooldownDays ?? 14);
    setGreenReadyDays(settings.greenReadyDays ?? 21);
    setMaxUsagePer90Days(settings.maxUsagePer90Days ?? 3);
    setYellowTotalUsageCount(settings.yellowTotalUsageCount ?? 4);
    setMaxTotalUsageCount(settings.maxTotalUsageCount ?? 8);
    setMinAvgDaysBetweenUses(settings.minAvgDaysBetweenUses ?? 25);
  }, [settings]);

  const draftSettings: SystemSettings = useMemo(() => {
    const safeRedDays = Math.max(1, Number(cooldownDays) || 1);
    const safeGreenDays = Math.max(safeRedDays, Number(greenReadyDays) || safeRedDays);
    const safeYellow90 = Math.max(1, Number(maxUsagePer90Days) || 1);
    const safeYellowTotal = Math.max(1, Number(yellowTotalUsageCount) || 1);
    const safeRedMaxTotal = Math.max(
      safeYellowTotal + 1,
      Number(maxTotalUsageCount) || safeYellowTotal + 1
    );
    const safeMinAvgDays = Math.max(5, Number(minAvgDaysBetweenUses) || 25);

    return {
      ...settings,
      cooldownDays: safeRedDays,
      greenReadyDays: safeGreenDays,
      maxUsagePer90Days: safeYellow90,
      yellowTotalUsageCount: safeYellowTotal,
      maxTotalUsageCount: safeRedMaxTotal,
      minAvgDaysBetweenUses: safeMinAvgDays,
    };
  }, [
    settings,
    cooldownDays,
    greenReadyDays,
    maxUsagePer90Days,
    yellowTotalUsageCount,
    maxTotalUsageCount,
    minAvgDaysBetweenUses,
  ]);

  const livePreview = useMemo(
    () => simulateStatusDistribution(computedFootage, draftSettings),
    [computedFootage, draftSettings]
  );

  const commitDraftSettings = () => {
    onUpdateSettings({
      cooldownDays: draftSettings.cooldownDays,
      greenReadyDays: draftSettings.greenReadyDays,
      maxUsagePer90Days: draftSettings.maxUsagePer90Days,
      yellowTotalUsageCount: draftSettings.yellowTotalUsageCount,
      maxTotalUsageCount: draftSettings.maxTotalUsageCount,
      minAvgDaysBetweenUses: draftSettings.minAvgDaysBetweenUses,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleSaveAndNext = () => {
    commitDraftSettings();
    onProceedToTab2();
  };

  const totalClips = Math.max(1, computedFootage.length);
  const bluePct = Math.round((livePreview.blueNew / totalClips) * 100);
  const greenPct = Math.round((livePreview.greenReady / totalClips) * 100);
  const yellowPct = Math.round((livePreview.yellowWarning / totalClips) * 100);
  const redPct = Math.max(0, 100 - bluePct - greenPct - yellowPct);

  return (
    <div className="space-y-5">
      {/* Live Vault Simulation Pastel Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-emerald-50/60 border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-indigo-200 text-[11px] font-bold text-indigo-700 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>จำลองผลลัพธ์จากคลังฟุตเทจจริง ({computedFootage.length} คลิป)</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              ปรับตัวเลขด้านล่างเพื่อดูสัดส่วนสี ฟ้า · เขียว · เหลือง · แดง เปลี่ยนแปลงทันที
            </h3>
          </div>

          {/* Preset Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_RULE_PRESETS.map((preset) => (
              <motion.button
                key={preset.id}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setCooldownDays(preset.values.cooldownDays);
                  setGreenReadyDays(preset.values.greenReadyDays);
                  setMaxUsagePer90Days(preset.values.maxUsagePer90Days);
                  setYellowTotalUsageCount(preset.values.yellowTotalUsageCount);
                  setMaxTotalUsageCount(preset.values.maxTotalUsageCount);
                }}
                title={preset.desc}
                className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white/90 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                {preset.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Animated 4-Color Stacked Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden bg-white border border-slate-200/80 flex p-0.5 gap-0.5 mb-3 shadow-inner">
          <motion.div
            animate={{ width: `${bluePct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="h-full bg-sky-400 rounded-l-full"
            title={`สีฟ้า: ${livePreview.blueNew} คลิป`}
          />
          <motion.div
            animate={{ width: `${greenPct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="h-full bg-emerald-400"
            title={`สีเขียว: ${livePreview.greenReady} คลิป`}
          />
          <motion.div
            animate={{ width: `${yellowPct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="h-full bg-amber-300"
            title={`สีเหลือง: ${livePreview.yellowWarning} คลิป`}
          />
          <motion.div
            animate={{ width: `${redPct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="h-full bg-rose-400 rounded-r-full"
            title={`สีแดง: ${livePreview.redCooldown} คลิป`}
          />
        </div>

        {/* 4 Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-sky-50/90 border border-sky-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>ฟ้า (ใหม่)</span>
            </span>
            <span className="text-sm font-mono font-bold text-sky-800 tabular-nums">
              {livePreview.blueNew} คลิป
            </span>
          </div>
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>เขียว (พร้อม)</span>
            </span>
            <span className="text-sm font-mono font-bold text-emerald-800 tabular-nums">
              {livePreview.greenReady} คลิป
            </span>
          </div>
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>เหลือง (เตือน)</span>
            </span>
            <span className="text-sm font-mono font-bold text-amber-800 tabular-nums">
              {livePreview.yellowWarning} คลิป
            </span>
          </div>
          <div className="bg-rose-50/90 border border-rose-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>แดง (ห้ามใช้)</span>
            </span>
            <span className="text-sm font-mono font-bold text-rose-800 tabular-nums">
              {livePreview.redCooldown} คลิป
            </span>
          </div>
        </div>
      </motion.div>

      {/* 4 Pastel Color Threshold Configurator Cards (Responsive 1 col mobile -> 2x2 desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Sky Pastel Card (Blue) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-sky-50/75 border-2 border-sky-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
                <Sparkles className="w-3 h-3 text-sky-600" />
                <span>สถานะสีฟ้า · ฟุตเทจใหม่แกะกล่อง</span>
              </span>
              <h4 className="text-sm font-bold text-sky-950 mt-1.5">
                ยังไม่เคยถูกใช้งานเลย (0 ครั้ง)
              </h4>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-white border border-sky-200 text-xs font-mono font-black text-sky-700">
              {livePreview.blueNew} คลิป
            </div>
          </div>

          <p className="text-xs text-sky-900/80 leading-relaxed bg-white/85 border border-sky-100 rounded-xl p-3">
            คลิปที่เพิ่งนำเข้าคลังและมีประวัติใช้งาน <strong className="font-bold">0 ครั้ง</strong>{' '}
            จะได้รับป้ายสีฟ้าอัตโนมัติ เพื่อให้ทีมคัดเป็นฟุตเปิดต้นคลิป (Hook) ได้ง่ายที่สุด
          </p>
        </motion.div>

        {/* 2. Mint Pastel Card (Green) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-50/75 border-2 border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>สถานะสีเขียว · พักครบพร้อมใช้งาน</span>
              </span>
              <h4 className="text-sm font-bold text-emerald-950 mt-1.5">
                กำหนดวันพักที่ถือว่าสดพร้อมนำกลับมาใช้
              </h4>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200 text-xs font-mono font-black text-emerald-700">
              {livePreview.greenReady} คลิป
            </div>
          </div>

          <div className="bg-white/90 border border-emerald-200/80 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-emerald-950">
                จำนวนวันพักเป้าหมายให้เป็นสีเขียว (วัน)
              </label>
              <div className="inline-flex items-center gap-1">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setGreenReadyDays((v) => Math.max(draftSettings.cooldownDays, v - 1))
                  }
                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <input
                  type="number"
                  min={draftSettings.cooldownDays}
                  max={180}
                  value={greenReadyDays}
                  onChange={(e) => setGreenReadyDays(Number(e.target.value))}
                  className="w-16 text-center py-1 text-sm font-mono font-black text-emerald-950 bg-emerald-50/60 border border-emerald-300 rounded-lg"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setGreenReadyDays((v) => v + 1)}
                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800">
              ต้องพักอย่างน้อย <strong>{draftSettings.greenReadyDays} วัน</strong> และใช้ไม่เกินเกณฑ์สีเหลืองจึงจะได้สีเขียว
            </p>
          </div>
        </motion.div>

        {/* 3. Butter Pastel Card (Yellow) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-amber-50/75 border-2 border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>สถานะสีเหลือง · เริ่มใช้บ่อย (เตือนให้ระวัง)</span>
              </span>
              <h4 className="text-sm font-bold text-amber-950 mt-1.5">
                กำหนดโควตาจำนวนครั้งที่เริ่มแจ้งเตือนสีเหลือง
              </h4>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-xs font-mono font-black text-amber-800">
              {livePreview.yellowWarning} คลิป
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white/90 border border-amber-200/80 rounded-xl p-2.5">
              <label className="block text-[11px] font-bold text-amber-950 mb-1.5">
                ใช้ซ้ำในรอบ 90 วันตั้งแต่ (ครั้ง)
              </label>
              <div className="flex items-center justify-between">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMaxUsagePer90Days((v) => Math.max(1, v - 1))}
                  className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={maxUsagePer90Days}
                  onChange={(e) => setMaxUsagePer90Days(Number(e.target.value))}
                  className="w-14 text-center py-1 text-sm font-mono font-black text-amber-950 bg-amber-50/60 border border-amber-300 rounded-lg"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMaxUsagePer90Days((v) => v + 1)}
                  className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            <div className="bg-white/90 border border-amber-200/80 rounded-xl p-2.5">
              <label className="block text-[11px] font-bold text-amber-950 mb-1.5">
                ใช้สะสมรวมตั้งแต่ (ครั้ง)
              </label>
              <div className="flex items-center justify-between">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setYellowTotalUsageCount((v) => Math.max(1, v - 1))}
                  className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={yellowTotalUsageCount}
                  onChange={(e) => setYellowTotalUsageCount(Number(e.target.value))}
                  className="w-14 text-center py-1 text-sm font-mono font-black text-amber-950 bg-amber-50/60 border border-amber-300 rounded-lg"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setYellowTotalUsageCount((v) => v + 1)}
                  className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Rose Pastel Card (Red) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-rose-50/75 border-2 border-rose-200/90 rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                <Clock className="w-3 h-3 text-rose-600" />
                <span>สถานะสีแดง · ติดวันพัก / ห้ามใช้ซ้ำ</span>
              </span>
              <h4 className="text-sm font-bold text-rose-950 mt-1.5">
                กำหนดวันพักขั้นต่ำ & เพดานการใช้ซ้ำสูงสุด
              </h4>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-xs font-mono font-black text-rose-700">
              {livePreview.redCooldown} คลิป
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white/90 border border-rose-200/80 rounded-xl p-2.5">
              <label className="block text-[11px] font-bold text-rose-950 mb-1.5">
                พักหลังใช้ล่าสุดไม่ถึง (วัน)
              </label>
              <div className="flex items-center justify-between">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCooldownDays((v) => Math.max(1, v - 1))}
                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={cooldownDays}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value);
                    setCooldownDays(nextVal);
                    if (greenReadyDays < nextVal) setGreenReadyDays(nextVal);
                  }}
                  className="w-14 text-center py-1 text-sm font-mono font-black text-rose-950 bg-rose-50/60 border border-rose-300 rounded-lg"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const nextVal = cooldownDays + 1;
                    setCooldownDays(nextVal);
                    if (greenReadyDays < nextVal) setGreenReadyDays(nextVal);
                  }}
                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            <div className="bg-white/90 border border-rose-200/80 rounded-xl p-2.5">
              <label className="block text-[11px] font-bold text-rose-950 mb-1.5">
                เพดานใช้สะสมสูงสุด (ครั้ง)
              </label>
              <div className="flex items-center justify-between">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setMaxTotalUsageCount((v) =>
                      Math.max(draftSettings.yellowTotalUsageCount + 1, v - 1)
                    )
                  }
                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <input
                  type="number"
                  min={draftSettings.yellowTotalUsageCount + 1}
                  max={100}
                  value={maxTotalUsageCount}
                  onChange={(e) => setMaxTotalUsageCount(Number(e.target.value))}
                  className="w-14 text-center py-1 text-sm font-mono font-black text-rose-950 bg-rose-50/60 border border-rose-300 rounded-lg"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMaxTotalUsageCount((v) => v + 1)}
                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            setCooldownDays(INITIAL_SETTINGS.cooldownDays);
            setGreenReadyDays(INITIAL_SETTINGS.greenReadyDays);
            setMaxUsagePer90Days(INITIAL_SETTINGS.maxUsagePer90Days);
            setYellowTotalUsageCount(INITIAL_SETTINGS.yellowTotalUsageCount);
            setMaxTotalUsageCount(INITIAL_SETTINGS.maxTotalUsageCount);
            setMinAvgDaysBetweenUses(INITIAL_SETTINGS.minAvgDaysBetweenUses);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>คืนค่าเริ่มต้นมาตรฐาน</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <AnimatePresence>
            {savedNotice && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกเกณฑ์สีเรียบร้อย!</span>
              </motion.span>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={commitDraftSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-indigo-800 bg-indigo-100 hover:bg-indigo-200/80 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกเกณฑ์สี</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveAndNext}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>บันทึก & ไปเพิ่มหมวดหมู่ (แท็บ 2)</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
