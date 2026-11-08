import React from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { SupabaseContentPayload } from '../../types/supabaseSync.types';

interface SupabasePayloadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: SupabaseContentPayload | null;
  title: string;
}

export const SupabasePayloadPreviewModal: React.FC<
  SupabasePayloadPreviewModalProps
> = ({ isOpen, onClose, payload, title }) => {
  const [copied, setCopied] = React.useState(false);

  if (!payload) return null;

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      icon={<Code2 className="w-5 h-5 text-[#2E7D32]" />}
      title="พรีวิว JSON Payload ตาราง public.contents"
      subtitle={title}
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">คัดลอกเรียบร้อย!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอก JSON</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#3B6845] text-white hover:bg-[#2D5236] transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      }
    >
      <div className="p-4 bg-[#1E1E1E] text-slate-100 font-mono text-xs overflow-x-auto max-h-[60vh] scrollbar-thin rounded-lg m-3">
        <pre>{jsonString}</pre>
      </div>
    </BaseModal>
  );
};
