import React from 'react';
import {
  AlertTriangle,
  Trash2,
  Layers,
  Tag,
  Film,
  ShieldAlert,
} from 'lucide-react';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { BaseModal } from '../../ui/BaseModal';
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
  const totalMainCatsCount = tags.filter(
    (t) => t.tier === 1 || (!t.parentId && !t.tier)
  ).length;
  const totalSubCatsCount = tags.filter(
    (t) => t.tier === 2 || Boolean(t.parentId)
  ).length;

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
          (t.groupId === targetGroup.id ||
            t.groupType === targetGroup.id.replace('GRP-', ''))
      )
    : [];

  // Target tag for delete
  const targetTag = showDeleteTagConfirm
    ? tags.find((t) => t.id === showDeleteTagConfirm)
    : null;
  const isTargetTagStaging = showDeleteTagConfirm
    ? isStagingTagId(showDeleteTagConfirm)
    : false;
  const isMainCategory = Boolean(
    targetTag && (targetTag.tier === 1 || !targetTag.parentId)
  );

  const childSubcategories =
    targetTag && isMainCategory
      ? tags.filter((t) => t.tier === 2 && t.parentId === targetTag.id)
      : [];

  const affectedFootages = targetTag
    ? computedFootage.filter((f) => {
        if (f.tags.includes(targetTag.id)) return true;
        if (
          isMainCategory &&
          childSubcategories.some((sub) => f.tags.includes(sub.id))
        ) {
          return true;
        }
        return false;
      })
    : [];

  const parentMainCat =
    targetTag && targetTag.parentId
      ? tags.find((t) => t.id === targetTag.parentId)
      : null;

  return (
    <>
      {/* 1. Wipe All Safeguard Modal via BaseModal (Portal + Framer Motion) */}
      <BaseModal
        isOpen={showWipeConfirm}
        onClose={() => setShowWipeConfirm(false)}
        maxWidthClass="max-w-md"
        icon={<AlertTriangle className="w-5 h-5 text-[#8A3C31]" />}
        title="ยืนยันการล้างข้อมูลหมวดหมู่ทั้งหมด?"
        subtitle="ระบบความปลอดภัยป้องกันการลบผิดพลาด"
        bodyClassName="p-5 bg-[#FAF8F5] space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowWipeConfirm(false)}
              className="px-3.5 py-2 text-xs font-semibold text-[#524538] bg-[#FAF7F2] hover:bg-[#F2EBE0] border border-[#E2D5C4] rounded-xl cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onConfirmWipe}
              className="px-4 py-2 text-xs font-bold text-white bg-[#8A3C31] hover:bg-[#702E24] rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                ยืนยันลบทั้งหมด (
                {totalGroupsCount + totalMainCatsCount + totalSubCatsCount}{' '}
                รายการ)
              </span>
            </button>
          </div>
        }
      >
        <div className="text-xs text-[#4D4133] leading-relaxed bg-[#FDF2F0] p-3.5 rounded-xl border border-[#F0CEC8] space-y-2.5">
          <p>
            การกระทำนี้จะ{' '}
            <strong className="text-[#8A3C31] font-bold">
              ลบกลุ่มหมวดหมู่ (Tier 0), หมวดหมู่หลัก (Tier 1), และหมวดหมู่ย่อย
              (Tier 2) ทั้งหมด
            </strong>{' '}
            ออกจากฐานข้อมูล เพื่อให้คุณเริ่มต้นใส่โครงสร้างข้อมูลของตนเองได้แบบ
            100% สะอาดหมดจด
          </p>
          <div className="pt-2 border-t border-[#F0CEC8] grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-[#F0CEC8]">
              <span className="text-[10px] text-[#7D6E61] block">
                กลุ่ม (Tier 0)
              </span>
              <span className="text-sm font-extrabold text-[#8A3C31] font-mono">
                {totalGroupsCount} กลุ่ม
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#F0CEC8]">
              <span className="text-[10px] text-[#7D6E61] block">
                หมวดหลัก (Tier 1)
              </span>
              <span className="text-sm font-extrabold text-[#8A3C31] font-mono">
                {totalMainCatsCount} หมวด
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#F0CEC8]">
              <span className="text-[10px] text-[#7D6E61] block">
                หมวดย่อย (Tier 2)
              </span>
              <span className="text-sm font-extrabold text-[#8A3C31] font-mono">
                {totalSubCatsCount} หมวด
              </span>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* 2. Delete Group Confirm Modal via BaseModal (Portal + Framer Motion) */}
      <BaseModal
        isOpen={Boolean(showDeleteGroupConfirm)}
        onClose={() => setShowDeleteGroupConfirm(null)}
        maxWidthClass="max-w-md"
        icon={<Trash2 className="w-5 h-5 text-[#8A3C31]" />}
        title={
          isTargetGroupStaging
            ? 'ไม่อนุญาตให้ลบกลุ่มระบบ'
            : 'ยืนยันการลบกลุ่มหมวดหมู่?'
        }
        subtitle="ระดับ Tier 0 (Category Cluster)"
        bodyClassName="p-5 bg-[#FAF8F5] space-y-3.5"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteGroupConfirm(null)}
              className="px-3.5 py-2 text-xs font-semibold text-[#524538] bg-[#FAF7F2] hover:bg-[#F2EBE0] border border-[#E2D5C4] rounded-xl cursor-pointer transition-colors"
            >
              {isTargetGroupStaging ? 'รับทราบ' : 'ยกเลิก'}
            </button>
            {!isTargetGroupStaging && showDeleteGroupConfirm && (
              <button
                type="button"
                onClick={() => onConfirmDeleteGroup(showDeleteGroupConfirm)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#8A3C31] hover:bg-[#702E24] rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบกลุ่มนี้</span>
              </button>
            )}
          </div>
        }
      >
        {isTargetGroupStaging ? (
          <div className="bg-[#FEF8ED] p-3.5 rounded-xl border border-[#EDD7AF] text-xs text-[#734B17] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-[#8A5A22]" />
              <span>พื้นที่พักรอจัดหมวดหมู่ (Staging Group)</span>
            </div>
            <p className="text-[11px] text-[#6E583C]">
              กลุ่มนี้เป็นโครงสร้างระบบสำหรับพักคลิปฟุตเทจที่เพิ่งนำเข้าและยังไม่ระบุหมวดหมู่
              จึงไม่สามารถลบออกจากระบบได้
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {targetGroup && (
              <div className="bg-white p-3 rounded-xl border border-[#E8DFD3] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F5EEE3] border border-[#E6DBC9] text-[#755938] flex items-center justify-center shrink-0">
                  <CategoryGroupIcon
                    icon={targetGroup.icon}
                    className="w-4 h-4"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#3D332A] truncate">
                    {targetGroup.name}
                  </div>
                  {targetGroup.description && (
                    <div className="text-[11px] text-[#7D6E61] truncate">
                      {targetGroup.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-[#FEF8ED] p-3.5 rounded-xl border border-[#EDD7AF] text-xs text-[#4D4133] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#734B17]">
                <Layers className="w-3.5 h-3.5 text-[#8A5A22]" />
                <span>สรุปผลกระทบที่จะเกิดขึ้น:</span>
              </div>
              <p className="text-[11px] text-[#6E583C]">
                หมวดหมู่หลักในกลุ่มนี้จะไม่ถูกลบ แต่จะถูก{' '}
                <strong className="text-[#4D3A24] font-semibold">
                  ปลดออกจากกลุ่ม
                </strong>{' '}
                (กลายเป็นหมวดอิสระรอจัดกลุ่มใหม่)
              </p>
              {linkedMainCats.length > 0 && (
                <div className="pt-1.5 border-t border-[#EDD7AF] text-[11px]">
                  <span className="font-semibold text-[#734B17]">
                    หมวดหลักที่สังกัดอยู่ ({linkedMainCats.length} หมวด):{' '}
                  </span>
                  <span className="text-[#6E583C]">
                    {linkedMainCats
                      .map((c) => `#${c.name}`)
                      .slice(0, 4)
                      .join(', ')}
                    {linkedMainCats.length > 4
                      ? ` และอีก ${linkedMainCats.length - 4} หมวด`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </BaseModal>

      {/* 3. Delete Tag Confirm Modal via BaseModal (Portal + Framer Motion) */}
      <BaseModal
        isOpen={Boolean(showDeleteTagConfirm)}
        onClose={() => setShowDeleteTagConfirm(null)}
        maxWidthClass="max-w-md"
        icon={<Trash2 className="w-5 h-5 text-[#8A3C31]" />}
        title={
          isTargetTagStaging
            ? 'ไม่อนุญาตให้ลบหมวดหมู่ระบบ'
            : isMainCategory
            ? 'ยืนยันการลบหมวดหมู่หลัก?'
            : 'ยืนยันการลบหมวดหมู่ย่อย?'
        }
        subtitle={
          isMainCategory
            ? 'Tier 1 (Main Category)'
            : 'Tier 2 (Subcategory / Entity)'
        }
        bodyClassName="p-5 bg-[#FAF8F5] space-y-3.5"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteTagConfirm(null)}
              className="px-3.5 py-2 text-xs font-semibold text-[#524538] bg-[#FAF7F2] hover:bg-[#F2EBE0] border border-[#E2D5C4] rounded-xl cursor-pointer transition-colors"
            >
              {isTargetTagStaging ? 'รับทราบ' : 'ยกเลิก'}
            </button>
            {!isTargetTagStaging && showDeleteTagConfirm && (
              <button
                type="button"
                onClick={() => onConfirmDeleteTag(showDeleteTagConfirm)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#8A3C31] hover:bg-[#702E24] rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบรายการนี้</span>
              </button>
            )}
          </div>
        }
      >
        {isTargetTagStaging ? (
          <div className="bg-[#FEF8ED] p-3.5 rounded-xl border border-[#EDD7AF] text-xs text-[#734B17] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-[#8A5A22]" />
              <span>พื้นที่พักรอจัดหมวดหมู่ (Staging Tag)</span>
            </div>
            <p className="text-[11px] text-[#6E583C]">
              หมวดหมู่นี้เป็นค่าเริ่มต้นของระบบสำหรับรองรับคลิปนำเข้าใหม่
              ไม่สามารถลบได้
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {targetTag && (
              <div className="bg-white p-3 rounded-xl border border-[#E8DFD3] space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      isMainCategory
                        ? 'bg-[#EDF4FA] text-[#1B4369] border-[#B2D5ED]'
                        : 'bg-[#FEF8ED] text-[#734B17] border-[#EDD7AF]'
                    }`}
                  >
                    {isMainCategory
                      ? 'หมวดหมู่หลัก Tier 1'
                      : 'หมวดหมู่ย่อย Tier 2'}
                  </span>
                  <span className="text-xs font-extrabold text-[#3D332A]">
                    #{targetTag.name}
                  </span>
                </div>
                {parentMainCat && (
                  <div className="text-[11px] text-[#7D6E61]">
                    สังกัดอยู่ใต้หมวดหลัก:{' '}
                    <span className="font-semibold text-[#3D332A]">
                      #{parentMainCat.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#FDF2F0] p-3.5 rounded-xl border border-[#F0CEC8] text-xs text-[#4D4133] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#8A3C31]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#8A3C31]" />
                <span>สรุปผลกระทบที่จะเกิดขึ้น:</span>
              </div>

              {isMainCategory ? (
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#F0CEC8]">
                    <span className="flex items-center gap-1 text-[#6E5F52]">
                      <Tag className="w-3 h-3 text-[#8A3C31]" />
                      <span>หมวดหมู่ย่อยด้านในที่จะถูกลบด้วย:</span>
                    </span>
                    <span className="font-bold font-mono text-[#8A3C31]">
                      {childSubcategories.length} หมวด
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#F0CEC8]">
                    <span className="flex items-center gap-1 text-[#6E5F52]">
                      <Film className="w-3 h-3 text-[#8A3C31]" />
                      <span>คลิปฟุตเทจที่จะถูกปลดป้ายหมวดนี้:</span>
                    </span>
                    <span className="font-bold font-mono text-[#8A3C31]">
                      {affectedFootages.length} คลิป
                    </span>
                  </div>

                  {childSubcategories.length > 0 && (
                    <p className="text-[10px] text-[#7D6E61] pt-1">
                      หมวดย่อยที่จะถูกลบ:{' '}
                      {childSubcategories
                        .map((s) => s.name)
                        .slice(0, 4)
                        .join(', ')}
                      {childSubcategories.length > 4
                        ? ` และอีก ${childSubcategories.length - 4} รายการ`
                        : ''}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#F0CEC8]">
                    <span className="flex items-center gap-1 text-[#6E5F52]">
                      <Film className="w-3 h-3 text-[#8A3C31]" />
                      <span>คลิปฟุตเทจที่ติดป้ายนี้อยู่:</span>
                    </span>
                    <span className="font-bold font-mono text-[#8A3C31]">
                      {affectedFootages.length} คลิป
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7D6E61] pt-1">
                    คลิปฟุตเทจจะไม่สูญหาย
                    แต่ป้ายหมวดย่อยนี้จะถูกปลดออกจากคลิปดังกล่าว
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </BaseModal>
    </>
  );
};
