'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { OpenCaseResult } from '@/types/case';

interface MultiOpeningResultModalProps {
  isOpen: boolean;
  results: OpenCaseResult[];
  caseNames?: string[];
  onClose: () => void;
  onReopen: () => void;
  isRequesting?: boolean;
}

export default function MultiOpeningResultModal({
  isOpen,
  results,
  caseNames,
  onClose,
  onReopen,
  isRequesting,
}: MultiOpeningResultModalProps) {
  useEffect(() => {
    if (isOpen && results.length > 0) {
      try {
        // Double confetti burst for 3x multi-opening!
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5, x: 0.3 },
          colors: ['#e4ae39', '#4b69ff', '#8847ff', '#eb4b4b'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5, x: 0.7 },
            colors: ['#ffd700', '#22c55e', '#3b82f6', '#ec4899'],
          });
        }, 250);
      } catch {
        // fallback
      }
    }
  }, [isOpen, results]);

  if (!isOpen || results.length === 0) return null;

  const getRarityConfig = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return {
          label: 'Dễ nấu',
          border: 'border-green-500',
          bgBadge: 'bg-green-500/15 text-green-400 border-green-500/30',
          glow: 'rgba(34, 197, 94, 0.25)',
        };
      case 'hard':
        return {
          label: 'Độ khó cao',
          border: 'border-red-500',
          bgBadge: 'bg-red-500/15 text-red-400 border-red-500/30',
          glow: 'rgba(239, 68, 68, 0.25)',
        };
      default:
        return {
          label: 'Vừa phải',
          border: 'border-yellow-500',
          bgBadge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
          glow: 'rgba(234, 179, 8, 0.25)',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[var(--panel)] border border-[var(--gold)]/40 rounded-[var(--radius)] p-5 sm:p-7 my-6 shadow-2xl space-y-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--gold)] tracking-wide">
                KẾT QUẢ MỞ 3 HÒM
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Bạn đã mở thành công 3 hòm cùng lúc! Dưới đây là 3 món ăn bạn đã nhận được:
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--line)] flex items-center justify-center text-xs text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.map((res, index) => {
            const recipe = res.recipe;
            const rarity = getRarityConfig(recipe.difficulty);

            return (
              <div
                key={res.openingId || index}
                style={{ boxShadow: `0 8px 24px ${rarity.glow}` }}
                className={`bg-[var(--bg)] border-2 ${rarity.border} rounded-[var(--radius)] p-4 flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-1`}
              >
                {/* Top Badge: Lane index & Case Name & Rarity */}
                <div className="flex items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-[var(--panel)] text-[var(--gold)] border border-[var(--line)] shrink-0">
                      #{index + 1}
                    </span>
                    {caseNames?.[index] && (
                      <span className="text-[11px] text-[var(--muted)] font-medium truncate max-w-[140px]" title={caseNames[index]}>
                        {caseNames[index]}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium shrink-0 ${rarity.bgBadge}`}>
                    {rarity.label}
                  </span>
                </div>

                {/* Dish Image */}
                <div className="aspect-[16/10] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden relative group">
                  {recipe.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                      đĩa món ăn
                    </div>
                  )}
                  {res.isCookableNow && (
                    <div className="absolute top-2 right-2 bg-green-500/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow">
                      ✓ Nấu được ngay
                    </div>
                  )}
                </div>

                {/* Dish Info */}
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text)] leading-snug line-clamp-1">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] line-clamp-2">
                    {recipe.description || 'Món ăn ngon miệng, phù hợp bữa cơm gia đình.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1">
                    <span>⏱️ {recipe.cookingTimeMinutes} phút</span>
                    <span>
                      💰 {recipe.estimatedCost ? `${Math.round(recipe.estimatedCost / 1000)}k` : 'Bình dân'}
                    </span>
                  </div>
                </div>

                {/* Fridge Status Check */}
                <div className="p-2.5 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--line)] text-xs space-y-1">
                  {res.isCookableNow ? (
                    <div className="text-green-400 flex items-center gap-1 font-medium">
                      <span>✓</span>
                      <span>Đủ nguyên liệu trong tủ lạnh!</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-yellow-400 font-medium flex items-center gap-1">
                        <span>🛒</span>
                        <span>Cần mua thêm {res.missingIngredients.length} nguyên liệu:</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
                        {res.missingIngredients.map((i) => i.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Link to recipe */}
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="btn-secondary w-full text-center text-xs py-1.5 font-medium block hover:border-[var(--gold)]"
                >
                  Xem hướng dẫn nấu →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--line)]">
          <div className="text-xs text-[var(--muted)] text-center sm:text-left">
            💡 <span className="text-[var(--text)]">Mẹo:</span> Bạn có thể thêm các món này vào tủ lạnh hoặc vào trang Công thức để xem chi tiết.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 sm:flex-none text-xs py-2 px-4 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isRequesting}
              onClick={onReopen}
              className="btn-gold flex-1 sm:flex-none text-xs font-semibold py-2 px-5 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>🎲</span>
              <span>{isRequesting ? 'Đang mở...' : 'Mở tiếp 3 hòm'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
