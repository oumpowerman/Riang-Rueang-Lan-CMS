import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-2 shrink-0 z-50">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>ขณะนี้คุณอยู่ในโหมดออฟไลน์ ข้อมูลที่แก้ไขจะซิงค์อัตโนมัติเมื่อกลับมาออนไลน์</span>
    </div>
  );
};
