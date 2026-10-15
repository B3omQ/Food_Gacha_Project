'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Roulette from '@/components/case-opening/Roulette';
import OpeningResult from '@/components/case-opening/OpeningResult';
import { caseService } from '@/services/case-service';
import { fridgeStorage } from '@/lib/fridge-storage';
import { CaseDetail, OpenCaseRequest, OpenCaseResult } from '@/types/case';
import { RecipeSummary } from '@/types/recipe';
import { FridgeItem } from '@/types/fridge';

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const resolvedParams = use(params);
  const caseId = Number(resolvedParams.caseId);

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fridge state
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [onlyCookableMode, setOnlyCookableMode] = useState(false);

  // Opening states
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerRecipe, setWinnerRecipe] = useState<RecipeSummary | null>(null);
  const [openResult, setOpenResult] = useState<OpenCaseResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caseService.getCaseById(caseId);
      setCaseDetail(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải thông tin hòm.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
    setFridgeItems(fridgeStorage.getItems());

    const updateFridge = () => setFridgeItems(fridgeStorage.getItems());
    window.addEventListener('fridge-updated', updateFridge);
    return () => window.removeEventListener('fridge-updated', updateFridge);
  }, [caseId]);

  const fridgeNames = new Set(fridgeItems.map((i) => i.name.trim().toLowerCase()));
  const isRecipeCookable = (ingredients?: Array<{ name: string }>) => {
    if (!ingredients || ingredients.length === 0) return true;
    return ingredients.every((ing) => fridgeNames.has(ing.name.trim().toLowerCase()));
  };

  const cookableDishes = caseDetail
    ? caseDetail.recipes.filter((r) => isRecipeCookable(r.ingredients))
    : [];

  const roulettePool =
    onlyCookableMode && cookableDishes.length > 0 ? cookableDishes : caseDetail?.recipes || [];

  const handleOpenCase = async () => {
    if (isRequesting || isSpinning || !caseDetail) return;

    if (onlyCookableMode && cookableDishes.length === 0) {
      setOpenError('Tủ lạnh chưa đủ nguyên liệu để nấu món nào trong hòm này.');
      return;
    }

    try {
      setOpenError(null);
      setIsRequesting(true);
      setShowResult(false);

      const request: OpenCaseRequest = {
        availableIngredientIds: fridgeItems.filter((i) => i.id).map((i) => i.id!),
        availableIngredientNames: fridgeItems.map((i) => i.name),
        onlyCookableWithAvailableIngredients: onlyCookableMode,
      };

      const result = await caseService.openCase(caseId, request);
      setWinnerRecipe(result.recipe);
      setOpenResult(result);
      setIsRequesting(false);
      setIsSpinning(true);
    } catch (err: unknown) {
      setIsRequesting(false);
      setIsSpinning(false);
      setOpenError(
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

  if (loading) {
    return (
      <div className="py-20 text-left">
        <p className="text-sm text-[var(--muted)]">Đang tải thông tin hòm...</p>
      </div>
    );
  }

  if (error || !caseDetail) {
    return (
      <div className="py-16 text-left space-y-4">
        <h2 className="text-xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
          {error || 'Hòm không tồn tại.'}
        </h2>
        <Link
          href="/"
          className="text-sm text-[var(--text)] underline hover:text-[var(--gold)]"
        >
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Top back link and title */}
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <Link
          href="/"
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          ← Quay lại danh sách hòm
        </Link>
        <h1 className="text-4xl sm:text-5xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] leading-tight tracking-tight">
          {caseDetail.name}
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-[52ch]">
          {caseDetail.description}
        </p>
      </div>

      {/* Roulette */}
      <Roulette
        items={roulettePool}
        winnerRecipe={winnerRecipe}
        isSpinning={isSpinning}
        onSpinEnd={handleSpinEnd}
      />

      {/* Action Row */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="button"
          onClick={showResult ? handleReset : handleOpenCase}
          disabled={isRequesting || isSpinning}
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

        <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyCookableMode}
            onChange={(e) => setOnlyCookableMode(e.target.checked)}
            className="w-4 h-4 rounded-[var(--radius)] bg-[var(--panel)] border-[var(--line)]"
          />
          <span>Chỉ quay món nấu được từ tủ lạnh ({cookableDishes.length}/{caseDetail.recipes.length})</span>
        </label>

        {showResult && openResult && (
          <div className="text-sm text-[var(--text)]">
            Hôm nay ăn <strong className="text-[var(--text)]">{openResult.recipe.name}</strong>, nấu khoảng {openResult.recipe.cookingTimeMinutes} phút
            {openResult.recipe.estimatedCost ? `, tốn ${Math.round(openResult.recipe.estimatedCost / 1000)}k.` : '.'}
          </div>
        )}

        {openError && (
          <div className="text-sm text-[var(--r4)]">
            {openError}
          </div>
        )}
      </div>

      {/* Result Card */}
      {showResult && openResult && (
        <OpeningResult result={openResult} onReset={handleReset} />
      )}

      {/* Dishes in case */}
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
          {caseDetail.recipes.map((recipe) => {
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
    </div>
  );
}
