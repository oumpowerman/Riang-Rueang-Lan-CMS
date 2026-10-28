import React from 'react';
import { CascadeCategorySelector } from './CascadeCategorySelector';

interface TagSelectorInputProps {
  selectedTagIds: string[];
  onChange: (newTagIds: string[]) => void;
  label?: string;
  helperText?: string;
  allowMultipleSubcategories?: boolean;
}

export const TagSelectorInput: React.FC<TagSelectorInputProps> = ({
  selectedTagIds,
  onChange,
  label = 'หมวดหมู่ & ดารา/หัวข้อย่อย 2 ชั้น',
  helperText = 'เลือกหมวดหลักก่อน แล้วเลือกบุคคลหรือหมวดย่อยที่ปรากฏในคลิป',
  allowMultipleSubcategories = true,
}) => {
  return (
    <CascadeCategorySelector
      selectedTagIds={selectedTagIds}
      onChange={onChange}
      label={label}
      helperText={helperText}
      allowMultipleSubcategories={allowMultipleSubcategories}
    />
  );
};
