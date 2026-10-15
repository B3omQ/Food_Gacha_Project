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

  if (loading) {
    return (
      <div className="py-20 text-left">
        <p className="text-sm text-[var(--muted)]">Đang tải công thức nấu ăn...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="py-16 text-left space-y-4">
        <h2 className="text-xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
          {error || 'Công thức không tồn tại.'}
        </h2>
        <Link
          href="/recipes"
          className="text-sm text-[var(--text)] underline hover:text-[var(--gold)]"
        >
          Quay lại danh sách công thức
        </Link>
      </div>
    );
  }

  const rarityColor = getRarityColor(recipe.difficulty);

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Top back link */}
      <div>
        <Link
          href="/recipes"
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          ← Quay lại danh sách công thức
        </Link>
      </div>

      {/* Main Recipe Header Card */}
      <div
        style={{ borderBottomColor: rarityColor, borderBottomWidth: '4px' }}
        className="bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-6 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="w-full md:w-80 aspect-[4/3] bg-[var(--bg)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden flex-shrink-0">
            {recipe.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-sm">
                đĩa
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] leading-tight tracking-tight">
              {recipe.name}
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-[52ch]">
              {recipe.description}
            </p>

            <div className="pt-2 text-sm text-[var(--text)]">
              <span>{recipe.cookingTimeMinutes} phút</span>
              {recipe.estimatedCost && (
                <span>, khoảng {Math.round(recipe.estimatedCost / 1000)}k</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingredients */}
        <div className="md:col-span-1 bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-5 space-y-4">
          <h2 className="text-xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
            Nguyên liệu
          </h2>

          {recipe.ingredients.length === 0 ? (
            <p className="text-xs text-[var(--muted)] italic">
              Chưa có danh sách nguyên liệu cụ thể.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recipe.ingredients.map((item) => (
                <li
                  key={item.ingredientId}
                  className="flex items-center justify-between py-1 border-b border-[var(--line)] last:border-0"
                >
                  <span className="text-[var(--text)]">{item.name}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instructions */}
        <div className="md:col-span-2 bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-6 space-y-4">
          <h2 className="text-xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
            Hướng dẫn cách nấu
          </h2>

          <div className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-line">
            {recipe.instructions}
          </div>
        </div>
      </div>
    </div>
  );
}
