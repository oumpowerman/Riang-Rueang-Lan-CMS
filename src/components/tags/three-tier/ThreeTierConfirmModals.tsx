import React from 'react';
import { AlertTriangle, Trash2, Layers, Tag, Film, ShieldAlert } from 'lucide-react';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';

interface ThreeTierConfirmModalsProps {
  showWipeConfirm: boolean;
  setShowWipeConfirm: (val: boolean) => void;
  onConfirmWipe: () => void;
  showDeleteGroupConfirm: string | null;
  setShowDeleteGroupConfirm: (val: string | null) => void;
  onConfirmDeleteGroup: (id: string) => void;
  showDeleteTagConfirm: string | null;
  setShowDeleteTagConfirm: (val: string | null) => void;
  onConfirmDeleteTag: (id: string) => void;
  categoryGroups?: CategoryGroup[];
  tags?: CategoryTag[];
  computedFootage?: ComputedFootage[];
}

export const ThreeTierConfirmModals: React.FC<ThreeTierConfirmModalsProps> = ({
  showWipeConfirm,
  setShowWipeConfirm,
  onConfirmWipe,
  showDeleteGroupConfirm,
  setShowDeleteGroupConfirm,
  onConfirmDeleteGroup,
  showDeleteTagConfirm,
  setShowDeleteTagConfirm,
  onConfirmDeleteTag,
  categoryGroups = [],
  tags = [],
  computedFootage = [],
}) => {
  // Wipe metrics
  const totalGroupsCount = categoryGroups.length;
  const totalMainCatsCount = tags.filter((t) => t.tier === 1 || (!t.parentId && !t.tier)).length;
  const totalSubCatsCount = tags.filter((t) => t.tier === 2 || Boolean(t.parentId)).length;

  // Target group for delete
  const targetGroup = showDeleteGroupConfirm
    ? categoryGroups.find((g) => g.id === showDeleteGroupConfirm)
    : null;
  const isTargetGroupStaging = showDeleteGroupConfirm
    ? isStagingGroupId(showDeleteGroupConfirm)
    : false;
  const linkedMainCats = targetGroup
    ? tags.filter(
        (t) =>
          t.tier !== 2 &&
          (t.groupId === targetGroup.id || t.groupType === targetGroup.id.replace('GRP-', ''))
      )
    : [];

  // Target tag for delete
  const targetTag = showDeleteTagConfirm ? tags.find((t) => t.id === showDeleteTagConfirm) : null;
  const isTargetTagStaging = showDeleteTagConfirm ? isStagingTagId(showDeleteTagConfirm) : false;
  const isMainCategory = Boolean(targetTag && (targetTag.tier === 1 || !targetTag.parentId));

  const childSubcategories =
    targetTag && isMainCategory ? tags.filter((t) => t.tier === 2 && t.parentId === targetTag.id) : [];

  const affectedFootages = targetTag
    ? computedFootage.filter((f) => {
        if (f.tags.includes(targetTag.id)) return true;
        if (isMainCategory && childSubcategories.some((sub) => f.tags.includes(sub.id))) {
          return true;
        }
        return false;
      })
    : [];

  const parentMainCat =
    targetTag && targetTag.parentId ? tags.find((t) => t.id === targetTag.parentId) : null;

  return (
    <>
      {/* 1. Wipe All Safeguard Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  ยืนยันการล้างข้อมูลหมวดหมู่ทั้งหมด?
                </h3>
                <p className="text-[11px] text-slate-500">ระบบความปลอดภัยป้องกันการลบผิดพลาด</p>
              </div>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed bg-rose-50/80 p-3.5 rounded-xl border border-rose-100 space-y-2">
              <p>
                การกระทำนี้จะ{' '}
                <strong className="text-rose-900 font-bold">
                  ลบกลุ่มหมวดหมู่ (Tier 0), หมวดหมู่หลัก (Tier 1), และหมวดหมู่ย่อย (Tier 2) ทั้งหมด
                </strong>{' '}
                ออกจากฐานข้อมูล เพื่อให้คุณเริ่มต้นใส่โครงสร้างข้อมูลของตนเองได้แบบ 100% สะอาดหมดจด
              </p>
              <div className="pt-2 border-t border-rose-200/80 grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/80 p-1.5 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-slate-500 block">กลุ่ม (Tier 0)</span>
                  <span className="text-sm font-extrabold text-rose-700 font-mono">
                    {totalGroupsCount} กลุ่ม
                  </span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-slate-500 block">หมวดหลัก (Tier 1)</span>
                  <span className="text-sm font-extrabold text-rose-700 font-mono">
                    {totalMainCatsCount} หมวด
                  </span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-slate-500 block">หมวดย่อย (Tier 2)</span>
                  <span className="text-sm font-extrabold text-rose-700 font-mono">
                    {totalSubCatsCount} หมวด
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onConfirmWipe}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบทั้งหมด ({totalGroupsCount + totalMainCatsCount + totalSubCatsCount} รายการ)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Group Confirm Modal */}
      {showDeleteGroupConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-3.5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isTargetGroupStaging ? 'ไม่อนุญาตให้ลบกลุ่มระบบ' : 'ยืนยันการลบกลุ่มหมวดหมู่?'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  ระดับ Tier 0 (Category Cluster)
                </p>
              </div>
            </div>

            {isTargetGroupStaging ? (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>พื้นที่พักรอจัดหมวดหมู่ (Staging Group)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  กลุ่มนี้เป็นโครงสร้างระบบสำหรับพักคลิปฟุตเทจที่เพิ่งนำเข้าและยังไม่ระบุหมวดหมู่ จึงไม่สามารถลบออกจากระบบได้
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {targetGroup && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <CategoryGroupIcon icon={targetGroup.icon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {targetGroup.name}
                      </div>
                      {targetGroup.description && (
                        <div className="text-[11px] text-slate-500 truncate">
                          {targetGroup.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>สรุปผลกระทบที่จะเกิดขึ้น:</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    หมวดหมู่หลักในกลุ่มนี้จะไม่ถูกลบ แต่จะถูก{' '}
                    <strong className="text-amber-950 font-semibold">ปลดออกจากกลุ่ม</strong>{' '}
                    (กลายเป็นหมวดอิสระรอจัดกลุ่มใหม่)
                  </p>
                  {linkedMainCats.length > 0 && (
                    <div className="pt-1.5 border-t border-amber-200/60 text-[11px]">
                      <span className="font-semibold text-amber-900">
                        หมวดหลักที่สังกัดอยู่ ({linkedMainCats.length} หมวด):{' '}
                      </span>
                      <span className="text-slate-600">
                        {linkedMainCats.map((c) => `#${c.name}`).slice(0, 4).join(', ')}
                        {linkedMainCats.length > 4 ? ` และอีก ${linkedMainCats.length - 4} หมวด` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteGroupConfirm(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {isTargetGroupStaging ? 'รับทราบ' : 'ยกเลิก'}
              </button>
              {!isTargetGroupStaging && (
                <button
                  type="button"
                  onClick={() => onConfirmDeleteGroup(showDeleteGroupConfirm)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยืนยันลบกลุ่มนี้</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Tag Confirm Modal */}
      {showDeleteTagConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-3.5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isTargetTagStaging
                    ? 'ไม่อนุญาตให้ลบหมวดหมู่ระบบ'
                    : isMainCategory
                    ? 'ยืนยันการลบหมวดหมู่หลัก?'
                    : 'ยืนยันการลบหมวดหมู่ย่อย?'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isMainCategory ? 'Tier 1 (Main Category)' : 'Tier 2 (Subcategory / Entity)'}
                </p>
              </div>
            </div>

            {isTargetTagStaging ? (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>พื้นที่พักรอจัดหมวดหมู่ (Staging Tag)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  หมวดหมู่นี้เป็นค่าเริ่มต้นของระบบสำหรับรองรับคลิปนำเข้าใหม่ ไม่สามารถลบได้
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {targetTag && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isMainCategory
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {isMainCategory ? 'หมวดหมู่หลัก Tier 1' : 'หมวดหมู่ย่อย Tier 2'}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        #{targetTag.name}
                      </span>
                    </div>
                    {parentMainCat && (
                      <div className="text-[11px] text-slate-500">
                        สังกัดอยู่ใต้หมวดหลัก: <span className="font-semibold text-slate-700">#{parentMainCat.name}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200/80 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>สรุปผลกระทบที่จะเกิดขึ้น:</span>
                  </div>

                  {isMainCategory ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-100">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Tag className="w-3 h-3 text-rose-500" />
                          <span>หมวดหมู่ย่อยด้านในที่จะถูกลบด้วย:</span>
                        </span>
                        <span className="font-bold font-mono text-rose-700">
                          {childSubcategories.length} หมวด
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-100">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Film className="w-3 h-3 text-rose-500" />
                          <span>คลิปฟุตเทจที่จะถูกปลดป้ายหมวดนี้:</span>
                        </span>
                        <span className="font-bold font-mono text-rose-700">
                          {affectedFootages.length} คลิป
                        </span>
                      </div>

                      {childSubcategories.length > 0 && (
                        <p className="text-[10px] text-slate-500 pt-1">
                          หมวดย่อยที่จะถูกลบ: {childSubcategories.map((s) => s.name).slice(0, 4).join(', ')}
                          {childSubcategories.length > 4 ? ` และอีก ${childSubcategories.length - 4} รายการ` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-100">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Film className="w-3 h-3 text-rose-500" />
                          <span>คลิปฟุตเทจที่ติดป้ายนี้อยู่:</span>
                        </span>
                        <span className="font-bold font-mono text-rose-700">
                          {affectedFootages.length} คลิป
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">
                        คลิปฟุตเทจจะไม่สูญหาย แต่ป้ายหมวดย่อยนี้จะถูกปลดออกจากคลิปดังกล่าว
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteTagConfirm(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {isTargetTagStaging ? 'รับทราบ' : 'ยกเลิก'}
              </button>
              {!isTargetTagStaging && (
                <button
                  type="button"
                  onClick={() => onConfirmDeleteTag(showDeleteTagConfirm)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยืนยันลบรายการนี้</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
