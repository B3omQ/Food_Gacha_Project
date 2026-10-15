'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { RecipeSummary } from '@/types/recipe';

interface OpeningResultProps {
  recipe: RecipeSummary;
  onReset: () => void;
}

export default function OpeningResult({ recipe, onReset }: OpeningResultProps) {
  useEffect(() => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f97316', '#38bdf8', '#4ade80'],
      });
    } catch {
      // Confetti error fallback
    }
  }, []);

  return (
    <div className="relative my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 max-w-2xl mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Golden halo light in background */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <span>✨</span> Món Ăn Đã Mở Được!
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
          {recipe.name}
        </h2>
      </div>

      {/* Card Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        {/* Dish Image */}
        <div className="relative h-56 rounded-2xl overflow-hidden border border-neutral-800 shadow-xl group">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-6xl">
              🥘
            </div>
          )}
        </div>

        {/* Stats & Description */}
        <div className="flex flex-col justify-between h-full space-y-4">
          <p className="text-sm text-neutral-300 line-clamp-3 leading-relaxed">
            {recipe.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-500 block mb-0.5">Thời gian</span>
              <span className="font-bold text-white text-sm">
                ⏱ {recipe.cookingTimeMinutes} phút
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-500 block mb-0.5">Chi phí ước tính</span>
              <span className="font-bold text-amber-400 text-sm font-mono">
                {recipe.estimatedCost ? `${recipe.estimatedCost.toLocaleString('vi-VN')}đ` : 'Bình dân'}
              </span>
            </div>

            <div className="col-span-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
              <span className="text-neutral-500">Độ khó</span>
              <span className="font-bold text-blue-400">
                {recipe.difficulty}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/recipes/${recipe.id}`}
              className="flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/25 transition-all"
            >
              Xem Cách Nấu 📖
            </Link>
            <button
              type="button"
              onClick={onReset}
              className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all"
            >
              Mở Tiếp 🎲
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
