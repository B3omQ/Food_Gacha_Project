'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { OpenCaseResult } from '@/types/case';

interface OpeningResultProps {
  result: OpenCaseResult;
  onReset: () => void;
}

export default function OpeningResult({ result, onReset }: OpeningResultProps) {
  const { recipe, missingIngredients, availableIngredients, isCookableNow } = result;

  useEffect(() => {
    // Fire celebratory confetti when revealed!
    try {
      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#e4ae39', '#4b69ff', '#8847ff', '#eb4b4b'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  const getRarityColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'var(--r1)';
      case 'hard':
        return 'var(--r4)';
      default:
        return 'var(--r2)';
    }
  };

  const rarityColor = getRarityColor(recipe.difficulty);

  return (
    <div
      style={{ borderBottomColor: rarityColor, borderBottomWidth: '4px' }}
      className="w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-5 sm:p-6 my-6 text-left animate-case-reveal"
    >
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Dish Image */}
        <div className="w-full md:w-64 h-48 flex-shrink-0 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-sm">
              <div className="w-16 h-16 rounded-full border border-[var(--line)] flex items-center justify-center">
                đĩa
              </div>
            </div>
          )}
        </div>

        {/* Content & Metadata */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <span className="text-xs text-[var(--muted)]">Kết quả mở hòm</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] tracking-tight">
              {recipe.name}
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-[52ch]">
              {recipe.description}
            </p>
          </div>

          <div className="text-sm text-[var(--text)] pt-1">
            <span>{recipe.cookingTimeMinutes} phút</span>
            {recipe.estimatedCost && (
              <span>, khoảng {Math.round(recipe.estimatedCost / 1000)}k</span>
            )}
          </div>

          {/* Action links */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4">
            <Link
              href={`/recipes/${recipe.id}`}
              className="btn-gold inline-flex items-center justify-center text-sm font-semibold w-full sm:w-auto"
            >
              Xem công thức
            </Link>
            <button
              type="button"
              onClick={onReset}
              className="btn-secondary text-sm font-medium cursor-pointer w-full sm:w-auto text-center"
            >
              Đóng kết quả
            </button>
          </div>
        </div>
      </div>

      {/* Fridge comparison */}
      <div className="mt-6 pt-5 border-t border-[var(--line)]">
        {isCookableNow ? (
          <p className="text-sm text-[var(--text)] font-medium">
            ✓ Đủ nguyên liệu trong tủ lạnh để nấu ngay.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text)] font-medium">
              Nguyên liệu cho món này:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Missing ingredients */}
              <div className="border border-[var(--line)] bg-[var(--bg)] p-3 rounded-[var(--radius)]">
                <span className="text-xs text-[var(--muted)] font-medium block mb-2">
                  Cần mua thêm ({missingIngredients.length})
                </span>
                <ul className="space-y-1 text-sm text-[var(--text)]">
                  {missingIngredients.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center py-0.5">
                      <span>• {item.name}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Available ingredients */}
              <div className="border border-[var(--line)] bg-[var(--bg)] p-3 rounded-[var(--radius)]">
                <span className="text-xs text-[var(--muted)] font-medium block mb-2">
                  Đã có trong tủ ({availableIngredients.length})
                </span>
                {availableIngredients.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] italic">
                    Chưa có nguyên liệu nào trong tủ lạnh.
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm text-[var(--text)]">
                    {availableIngredients.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center py-0.5">
                        <span className="font-medium">✓ {item.name}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {item.quantity} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
