'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { recipeService } from '@/services/recipe-service';
import { RecipeDetail } from '@/types/recipe';

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const resolvedParams = use(params);
  const recipeId = Number(resolvedParams.recipeId);

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recipeService.getRecipeById(recipeId);
        setRecipe(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể nạp thông tin công thức.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-neutral-400">Đang tải công thức nấu ăn...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center space-y-4">
        <span className="text-4xl">🍲</span>
        <h2 className="text-xl font-bold text-white">Không tìm thấy công thức</h2>
        <p className="text-sm text-neutral-400">{error || 'Món ăn không tồn tại.'}</p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-neutral-800 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        href="/"
        className="text-xs text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
      >
        ← Quay lại trang chủ
      </Link>

      {/* Header and Image */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/50 shadow-2xl">
        <div className="relative h-72 sm:h-96 w-full bg-neutral-950">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-neutral-900">
              🍲
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

          {/* Floating badges */}
          <div className="absolute bottom-6 left-6 right-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
              Công Thức Món Ăn
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
              {recipe.name}
            </h1>
            <p className="text-sm text-neutral-300 mt-2 max-w-2xl leading-relaxed">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-neutral-800 border-t border-neutral-800 bg-neutral-950/90 text-center py-4">
          <div>
            <span className="text-xs text-neutral-500 block">Thời gian nấu</span>
            <span className="text-base sm:text-lg font-bold text-white">
              ⏱ {recipe.cookingTimeMinutes} phút
            </span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block">Chi phí ước tính</span>
            <span className="text-base sm:text-lg font-bold text-amber-400 font-mono">
              {recipe.estimatedCost ? `${recipe.estimatedCost.toLocaleString('vi-VN')}đ` : 'Bình dân'}
            </span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block">Độ khó</span>
            <span className="text-base sm:text-lg font-bold text-blue-400">
              {recipe.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Ingredients & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ingredients (1 column) */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span>🥕</span> Nguyên Liệu
            </h2>

            {recipe.ingredients.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">Chưa có danh sách nguyên liệu cụ thể.</p>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {recipe.ingredients.map((item) => (
                  <li
                    key={item.ingredientId}
                    className="flex items-center justify-between py-1.5 border-b border-neutral-800/60 last:border-0"
                  >
                    <span className="text-neutral-300">{item.name}</span>
                    <span className="font-semibold text-amber-400 font-mono text-xs">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Instructions (2 columns) */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span>👨‍🍳</span> Hướng Dẫn Cách Nấu
            </h2>

            <div className="space-y-4 text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {recipe.instructions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
