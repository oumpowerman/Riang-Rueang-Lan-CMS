import React from 'react';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import { formatThaiDate } from '../../../../utils/fileNameGenerator';
import type { MixRecipeId } from '../../../../utils/collisionDetector';
import type { CategoryTag } from '../../../../types/tag.types';
import type { Episode } from '../../../../types/episode.types';
import type { CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';

interface SeriesShelfViewProps {
  categoriesInGroup: CategoryRankingItem[];
  selectedGroupId: string;
  resolveTagGroupId: (tag: CategoryTag | undefined) => string;
  latestEpisodeByCategoryMap: Record<string, Episode>;
  onViewCategoryEpisodes: (catId: string) => void;
  launchEpisodeBuilderForCategory: (catId: string, recipeId?: MixRecipeId) => void;
}

export const SeriesShelfView: React.FC<SeriesShelfViewProps> = ({
  categoriesInGroup,
  selectedGroupId,
  resolveTagGroupId,
  latestEpisodeByCategoryMap,
  onViewCategoryEpisodes,
  launchEpisodeBuilderForCategory,
}) => {
  const { categoryGroupMap } = useCMS();

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-xs text-[#6E665E]">
          กำลังแสดง{' '}
          <span className="font-mono font-bold text-[#2D2926]">
            {categoriesInGroup.length}
          </span>{' '}
          ซีรีส์
          {selectedGroupId !== 'ALL' && categoryGroupMap[selectedGroupId] && (
            <span>
              {' '}
              ในกลุ่ม{' '}
              <strong className="text-[#785324]">
                {categoryGroupMap[selectedGroupId].name}
              </strong>
            </span>
          )}
        </div>

        <div className="text-xs font-mono text-[#787066]">
          รวม {categoriesInGroup.reduce((sum, c) => sum + c.episodeCount, 0).toLocaleString()} ตอนที่ผลิตแล้ว
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categoriesInGroup.map((item) => {
          const grp = categoryGroupMap[resolveTagGroupId(item.mainTag)];
          const latestEp = latestEpisodeByCategoryMap[item.mainTag.id] || null;
          const nextEpNumber = item.episodeCount + 1;
          const estProducible = Math.floor(item.usableFootageInCat / 5);

          return (
            <div
              key={item.mainTag.id}
              className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-4 hover:border-[#D6BD94] hover:shadow-2xs transition-all flex flex-col justify-between gap-3.5"
            >
              <div className="space-y-2">
                {/* Top Row: Group Tag + Producible Badge */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-lg bg-[#FAF2E1] text-[#6E4919] border border-[#E6D4B3] text-[11px] font-semibold">
                    {grp?.name || 'หมวดหมู่ทั่วไป'}
                  </span>
                  <span className="font-mono text-[11px] text-[#787066]">
                    พร้อมผลิต ~{estProducible} EP
                  </span>
                </div>

                {/* Series Title */}
                <div>
                  <h2 className="text-base font-bold text-[#2D2926] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8A5A22] shrink-0" />
                    <span>5 อันดับ #{item.mainTag.name}</span>
                  </h2>
                  <p className="text-xs text-[#716960] mt-0.5 line-clamp-1">
                    {item.mainTag.description ||
                      `ซีรีส์จัดอันดับช็อตเด็ดหมวด ${item.mainTag.name}`}
                  </p>
                </div>

                {/* Stats Strip */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FAF6F0] rounded-xl border border-[#EDE5D8] text-xs">
                  <div>
                    <div className="text-[11px] text-[#787066]">ผลิตแล้ว</div>
                    <div className="font-mono font-bold text-[#2D2926] text-sm">
                      {item.episodeCount}{' '}
                      <span className="text-[10px] font-normal text-[#787066]">
                        ตอน
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#787066]">ฟุตเทจว่าง</div>
                    <div className="font-mono font-bold text-[#2D633B] text-sm">
                      {item.usableFootageInCat}{' '}
                      <span className="text-[10px] font-normal text-[#787066]">
                        ฟุต (ใหม่ {item.untouchedFootageInCat})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Latest EP Info */}
                {latestEp ? (
                  <div className="text-[11px] text-[#6E665E] flex items-center justify-between pt-1">
                    <span className="truncate">
                      ล่าสุด:{' '}
                      <strong className="text-[#2D2926]">
                        EP.{latestEp.categoryEpisodeNo || item.episodeCount}
                      </strong>{' '}
                      ({formatThaiDate(latestEp.publishDate)})
                    </span>
                    <span className="font-mono text-[#785324] font-bold shrink-0 ml-1">
                      {latestEp.id}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#9C9286] italic pt-1">
                    ยังไม่มีตอนที่เผยแพร่
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2.5 border-t border-[#EDE5D8] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewCategoryEpisodes(item.mainTag.id)}
                  className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-[#4D4740] bg-[#F5EFE6] hover:bg-[#EAE0D2] border border-[#E2D8C9] rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>ดู {item.episodeCount} ตอน</span>
                  <ArrowRight className="w-3 h-3 text-[#6E665E]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    launchEpisodeBuilderForCategory(
                      item.mainTag.id,
                      item.untouchedFootageInCat >= 5
                        ? 'FORMULA_ALL_NEW'
                        : 'FORMULA_2_NEW_3_FRESH'
                    );
                  }}
                  className="py-1.5 px-3 text-xs font-bold text-[#224A2D] bg-[#E6F2E6] hover:bg-[#D5E8D5] border border-[#A5C9A3] rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้าง EP.{nextEpNumber}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
