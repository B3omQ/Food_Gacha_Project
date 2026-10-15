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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>📖</span> Kho Công Thức Món Ăn
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Tổng hợp các món ngon hàng ngày đã được cấu hình trong các hòm roulette
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-neutral-900/50 border border-neutral-800 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="w-full h-40 bg-neutral-800/60 rounded-xl" />
              <div className="space-y-2 mt-3">
                <div className="h-5 bg-neutral-800/60 rounded w-2/3" />
                <div className="h-3 bg-neutral-800/40 rounded w-full" />
              </div>
              <div className="h-8 bg-neutral-800/40 rounded-xl mt-3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/50 text-center space-y-3 max-w-md mx-auto">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm text-rose-300">{error}</p>
          <button
            onClick={fetchRecipes}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredRecipes.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <span className="text-4xl block mb-2">🔍</span>
          Không tìm thấy món ăn nào phù hợp với từ khóa &ldquo;{search}&rdquo;.
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filteredRecipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
