'use client';

import React, { useEffect, useState } from 'react';
import { CachedRoll, lastRollStorage } from '@/lib/last-roll-storage';

interface LastRollBannerProps {
  onViewRoll: (roll: CachedRoll) => void;
}

export default function LastRollBanner({ onViewRoll }: LastRollBannerProps) {
  const [cachedRoll, setCachedRoll] = useState<CachedRoll | null>(null);

  useEffect(() => {
    setCachedRoll(lastRollStorage.getLastRoll());

    const handleUpdate = () => {
      setCachedRoll(lastRollStorage.getLastRoll());
    };

    window.addEventListener('last-roll-updated', handleUpdate);
    return () => window.removeEventListener('last-roll-updated', handleUpdate);
  }, []);

  if (!cachedRoll || cachedRoll.results.length === 0) return null;

  const formatTime = (ts: number) => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return new Date(ts).toLocaleDateString('vi-VN');
  };

  return (
    <div className="w-full p-3 sm:p-3.5 bg-[var(--panel)] border border-[var(--gold)]/30 rounded-[var(--radius)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <span className="text-xl shrink-0 mt-0.5 sm:mt-0">🕒</span>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[var(--gold)] tracking-wide uppercase">
              Bản lưu lượt mở trước ({cachedRoll.mode === 'multi' ? '3x' : '1x'})
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              • {formatTime(cachedRoll.timestamp)}
            </span>
          </div>
          <p className="text-xs text-[var(--text)] truncate">
            Đã nhận:{' '}
            <strong className="text-[var(--text)] font-semibold">
              {cachedRoll.results.map((r) => r.recipe.name).join(', ')}
            </strong>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--line)]">
        <button
          type="button"
          onClick={() => onViewRoll(cachedRoll)}
          className="btn-gold flex-1 sm:flex-none justify-center text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <span>👁️</span>
          <span>Xem lại kết quả</span>
        </button>

        <button
          type="button"
          onClick={() => lastRollStorage.clearLastRoll()}
          title="Xóa bản lưu này"
          className="text-xs text-[var(--muted)] hover:text-[var(--r4)] px-2.5 py-1.5 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
