'use client';

import React, { useEffect, useState } from 'react';
import RecipeCard from '@/components/recipes/RecipeCard';
import { recipeService } from '@/services/recipe-service';
import { RecipeSummary } from '@/types/recipe';

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recipeService.getAllRecipes();
      setRecipes(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải danh sách món ăn.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Header with sentence case title, description, and search on same row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] tracking-tight">
            Kho công thức món ăn
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-[52ch]">
            Tổng hợp các món ngon hàng ngày đã được cấu hình trong các hòm roulette.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Difficulty color legend note */}
      <div className="text-xs text-[var(--muted)]">
        Viền màu là độ khó: xanh dễ, tím vừa, đỏ khó
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12">
          <p className="text-sm text-[var(--muted)]">Đang tải danh sách món ăn...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-4 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--line)] space-y-3 max-w-md">
          <p className="text-sm text-[var(--r4)]">{error}</p>
          <button
            type="button"
            onClick={fetchRecipes}
            className="btn-secondary text-xs"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredRecipes.length === 0 && (
        <div className="py-12 text-sm text-[var(--muted)]">
          Không tìm thấy món ăn nào phù hợp với từ khóa &ldquo;{search}&rdquo;.
        </div>
      )}

      {/* Recipe Cards Grid */}
      {!loading && !error && filteredRecipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
