'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Roulette from '@/components/case-opening/Roulette';
import OpeningResult from '@/components/case-opening/OpeningResult';
import { caseService } from '@/services/case-service';
import { fridgeStorage } from '@/lib/fridge-storage';
import { CaseSummary, CaseDetail, OpenCaseRequest, OpenCaseResult } from '@/types/case';
import { RecipeSummary } from '@/types/recipe';
import { FridgeItem } from '@/types/fridge';

export default function HomePage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [currentCase, setCurrentCase] = useState<CaseDetail | null>(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fridge integration
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [onlyCookableMode, setOnlyCookableMode] = useState(false);

  // Spinning / Opening states
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerRecipe, setWinnerRecipe] = useState<RecipeSummary | null>(null);
  const [openResult, setOpenResult] = useState<OpenCaseResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Load cases list on mount
  useEffect(() => {
    async function loadCases() {
      try {
        setLoadingCases(true);
        setError(null);
        const data = await caseService.getActiveCases();
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0].id);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách hòm. Hãy kiểm tra server ASP.NET Core.'
        );
      } finally {
        setLoadingCases(false);
      }
    }
    loadCases();

    setFridgeItems(fridgeStorage.getItems());
    const onFridgeChange = () => setFridgeItems(fridgeStorage.getItems());
    window.addEventListener('fridge-updated', onFridgeChange);
    return () => window.removeEventListener('fridge-updated', onFridgeChange);
  }, []);

  // Load selected case detail
  useEffect(() => {
    if (!selectedCaseId) return;

    async function loadDetail() {
      try {
        setLoadingDetail(true);
        setSpinError(null);
        const detail = await caseService.getCaseById(selectedCaseId!);
        setCurrentCase(detail);
        setShowResult(false);
        setWinnerRecipe(null);
        setOpenResult(null);
      } catch (err: unknown) {
        setSpinError(
          err instanceof Error ? err.message : 'Không thể tải thông tin hòm được chọn.'
        );
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [selectedCaseId]);

  // Check which dishes are cookable from fridge
  const fridgeNames = new Set(fridgeItems.map((i) => i.name.trim().toLowerCase()));
  const isRecipeCookable = (ingredients?: Array<{ name: string }>) => {
    if (!ingredients || ingredients.length === 0) return true;
    return ingredients.every((ing) => fridgeNames.has(ing.name.trim().toLowerCase()));
  };

  const cookableDishes = currentCase
    ? currentCase.recipes.filter((r) => isRecipeCookable(r.ingredients))
    : [];

  const roulettePool =
    onlyCookableMode && cookableDishes.length > 0
      ? cookableDishes
      : currentCase?.recipes || [];

  const handleOpenCase = async () => {
    if (isRequesting || isSpinning || !currentCase || !selectedCaseId) return;

    if (onlyCookableMode && cookableDishes.length === 0) {
      setSpinError('Tủ lạnh chưa đủ nguyên liệu để nấu món nào trong hòm này.');
      return;
    }

    try {
      setSpinError(null);
      setIsRequesting(true);
      setShowResult(false);

      const request: OpenCaseRequest = {
        availableIngredientIds: fridgeItems.filter((i) => i.id).map((i) => i.id!),
        availableIngredientNames: fridgeItems.map((i) => i.name),
        onlyCookableWithAvailableIngredients: onlyCookableMode,
      };

      const result = await caseService.openCase(selectedCaseId, request);
      setWinnerRecipe(result.recipe);
      setOpenResult(result);
      setIsRequesting(false);
      setIsSpinning(true);
    } catch (err: unknown) {
      setIsRequesting(false);
      setIsSpinning(false);
      setSpinError(
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi mở hòm.'
      );
    }
  };

  const handleSpinEnd = () => {
    setIsSpinning(false);
    setShowResult(true);
  };

  const handleReset = () => {
    setShowResult(false);
    setWinnerRecipe(null);
    setOpenResult(null);
  };

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

  if (loadingCases) {
    return (
      <div className="py-20 text-left">
        <p className="text-sm text-[var(--muted)]">Đang tải danh sách hòm...</p>
      </div>
    );
  }

  if (error || cases.length === 0) {
    return (
      <div className="py-12 text-left space-y-4">
        <h2 className="text-xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
          {error || 'Chưa có hòm nào hoạt động'}
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Hãy chắc chắn server ASP.NET Core đang chạy và cơ sở dữ liệu đã được tạo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left pb-16">
      {/* 1. Case Tab Selector */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-3">
        {cases.map((c) => {
          const isSelected = c.id === selectedCaseId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCaseId(c.id)}
              className={`px-3 py-1.5 text-sm rounded-[var(--radius)] transition-colors cursor-pointer border ${
                isSelected
                  ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--muted)] font-medium'
                  : 'bg-transparent text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]'
              }`}
            >
              {c.name} ({c.recipeCount})
            </button>
          );
        })}
      </div>

      {/* 2. Selected Case Title & Short Description */}
      {currentCase && (
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] leading-tight tracking-tight">
            {currentCase.name}
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] max-w-[52ch]">
            {currentCase.description}
          </p>
        </div>
      )}

      {/* 3. Roulette Viewport */}
      {loadingDetail ? (
        <div className="h-[176px] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] flex items-center justify-center">
          <p className="text-sm text-[var(--muted)]">Đang tải danh sách món...</p>
        </div>
      ) : (
        currentCase && (
          <Roulette
            items={roulettePool}
            winnerRecipe={winnerRecipe}
            isSpinning={isSpinning}
            onSpinEnd={handleSpinEnd}
          />
        )
      )}

      {/* 4. Action Row */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="button"
          onClick={showResult ? handleReset : handleOpenCase}
          disabled={isRequesting || isSpinning || loadingDetail}
          className="btn-gold disabled:opacity-50 cursor-pointer"
        >
          {isSpinning
            ? 'Đang mở...'
            : isRequesting
            ? 'Đang chuẩn bị...'
            : showResult
            ? 'Mở hòm khác'
            : 'Mở hòm'}
        </button>

        {/* Cookable toggle */}
        <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyCookableMode}
            onChange={(e) => setOnlyCookableMode(e.target.checked)}
            className="w-4 h-4 rounded-[var(--radius)] bg-[var(--panel)] border-[var(--line)]"
          />
          <span>Chỉ quay món nấu được từ tủ lạnh ({cookableDishes.length}/{currentCase?.recipes.length || 0})</span>
        </label>

        {/* Inline result summary text */}
        {showResult && openResult && (
          <div className="text-sm text-[var(--text)]">
            Hôm nay ăn <strong className="text-[var(--text)]">{openResult.recipe.name}</strong>, nấu khoảng {openResult.recipe.cookingTimeMinutes} phút
            {openResult.recipe.estimatedCost ? `, tốn ${Math.round(openResult.recipe.estimatedCost / 1000)}k.` : '.'}
          </div>
        )}

        {spinError && (
          <div className="text-sm text-[var(--r4)]">
            {spinError}
          </div>
        )}
      </div>

      {/* Detailed Result Card */}
      {showResult && openResult && (
        <OpeningResult result={openResult} onReset={handleReset} />
      )}

      {/* 5. Dishes in Case / Cookable right now grid */}
      {currentCase && currentCase.recipes.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-[var(--line)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
              Món ăn trong hòm
            </h2>
            <span className="text-xs text-[var(--muted)]">
              Viền màu là độ khó: xanh dễ, tím vừa, đỏ khó
            </span>
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            }}
          >
            {currentCase.recipes.map((recipe) => {
              const rarityColor = getRarityColor(recipe.difficulty);
              const cookable = isRecipeCookable(recipe.ingredients);

              return (
                <Link
                  key={recipe.recipeId}
                  href={`/recipes/${recipe.recipeId}`}
                  style={{
                    borderBottomColor: rarityColor,
                    borderBottomWidth: '4px',
                  }}
                  className="bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--muted)] rounded-[var(--radius)] p-2.5 flex flex-col justify-between transition-colors"
                >
                  <div className="aspect-[4/3] w-full bg-[var(--bg)] rounded-[2px] overflow-hidden mb-2">
                    {recipe.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs">
                        đĩa
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)] truncate leading-tight">
                      {recipe.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1 truncate">
                      {recipe.cookingTimeMinutes} phút
                      {recipe.estimatedCost
                        ? `, ${Math.round(recipe.estimatedCost / 1000)}k`
                        : ''}
                    </p>
                    {cookable && (
                      <span className="text-[11px] text-[var(--text)] mt-1 block">
                        ✓ Nấu được ngay
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
