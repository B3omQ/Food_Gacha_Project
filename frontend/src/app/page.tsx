'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Roulette from '@/components/case-opening/Roulette';
import OpeningResult from '@/components/case-opening/OpeningResult';
import MultiOpeningResultModal from '@/components/case-opening/MultiOpeningResultModal';
import { caseService } from '@/services/case-service';
import { fridgeStorage } from '@/lib/fridge-storage';
import { CaseSummary, CaseDetail, OpenCaseRequest, OpenCaseResult, CaseRecipeItem } from '@/types/case';
import { RecipeSummary } from '@/types/recipe';
import { FridgeItem } from '@/types/fridge';
import LastRollBanner from '@/components/case-opening/LastRollBanner';
import { CachedRoll, lastRollStorage } from '@/lib/last-roll-storage';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="py-20 text-sm text-[var(--muted)]">Đang tải giao diện...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();

  // Mode: 'single' (mở 1 hòm) hoặc 'multi' (mở 3 hòm khác nhau)
  const [openMode, setOpenMode] = useState<'single' | 'multi'>('single');

  // Cases list
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cached case details by ID
  const [casesMap, setCasesMap] = useState<Record<number, CaseDetail>>({});

  // Single mode state
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [loadingSingleDetail, setLoadingSingleDetail] = useState(false);

  // Multi mode state: Chọn 3 hòm (có thể là 3 hòm khác nhau)
  const [multiCaseIds, setMultiCaseIds] = useState<[number, number, number]>([0, 0, 0]);
  const [loadingMultiDetail, setLoadingMultiDetail] = useState(false);

  // Fridge integration
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [onlyCookableMode, setOnlyCookableMode] = useState(false);

  // Spinning / Opening states
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerRecipe, setWinnerRecipe] = useState<RecipeSummary | null>(null);
  const [winnerRecipes, setWinnerRecipes] = useState<RecipeSummary[]>([]);
  const [openResult, setOpenResult] = useState<OpenCaseResult | null>(null);
  const [multiResults, setMultiResults] = useState<OpenCaseResult[]>([]);
  const [showSingleResult, setShowSingleResult] = useState(false);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Check URL query param ?mode=multi
  useEffect(() => {
    if (searchParams.get('mode') === 'multi') {
      setOpenMode('multi');
    }
  }, [searchParams]);

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

          // Khởi tạo 3 hòm mặc định cho multi-mode:
          // Nếu có >= 3 hòm thì chọn 3 hòm khác nhau, ngược lại chọn hòm có sẵn
          const id1 = data[0].id;
          const id2 = data.length > 1 ? data[1].id : data[0].id;
          const id3 = data.length > 2 ? data[2].id : (data.length > 1 ? data[1].id : data[0].id);
          setMultiCaseIds([id1, id2, id3]);
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

  // Helper tải chi tiết hòm và lưu vào cache casesMap
  const ensureCaseLoaded = async (id: number): Promise<CaseDetail | null> => {
    if (casesMap[id]) return casesMap[id];
    try {
      const detail = await caseService.getCaseById(id);
      setCasesMap((prev) => ({ ...prev, [id]: detail }));
      return detail;
    } catch {
      return null;
    }
  };

  // Load single mode selected case detail
  useEffect(() => {
    if (!selectedCaseId) return;
    setLoadingSingleDetail(true);
    setSpinError(null);
    ensureCaseLoaded(selectedCaseId).finally(() => setLoadingSingleDetail(false));
  }, [selectedCaseId]);

  // Load 3 selected cases details when entering multi mode or changing slots
  useEffect(() => {
    if (openMode !== 'multi' || multiCaseIds.some((id) => id === 0)) return;
    setLoadingMultiDetail(true);
    setSpinError(null);
    Promise.all(multiCaseIds.map((id) => ensureCaseLoaded(id))).finally(() =>
      setLoadingMultiDetail(false)
    );
  }, [openMode, multiCaseIds]);

  // Check fridge cookable
  const fridgeNames = new Set(fridgeItems.map((i) => i.name.trim().toLowerCase()));
  const isRecipeCookable = (ingredients?: Array<{ name: string }>) => {
    if (!ingredients || ingredients.length === 0) return true;
    return ingredients.every((ing) => fridgeNames.has(ing.name.trim().toLowerCase()));
  };

  const getFilteredDishes = (recipes?: CaseRecipeItem[]) => {
    if (!recipes) return [];
    if (!onlyCookableMode) return recipes;
    const cookable = recipes.filter((r) => isRecipeCookable(r.ingredients));
    return cookable.length > 0 ? cookable : recipes;
  };

  // Current single case
  const currentSingleCase = selectedCaseId ? casesMap[selectedCaseId] : null;
  const singleRoulettePool = getFilteredDishes(currentSingleCase?.recipes);

  // Multi-mode: 3 selected cases details
  const case1 = casesMap[multiCaseIds[0]];
  const case2 = casesMap[multiCaseIds[1]];
  const case3 = casesMap[multiCaseIds[2]];

  const itemsPerLane: CaseRecipeItem[][] = [
    getFilteredDishes(case1?.recipes),
    getFilteredDishes(case2?.recipes),
    getFilteredDishes(case3?.recipes),
  ];

  const laneLabels: string[] = [
    `LÀN #1: ${case1?.name || 'Hòm 1'}`,
    `LÀN #2: ${case2?.name || 'Hòm 2'}`,
    `LÀN #3: ${case3?.name || 'Hòm 3'}`,
  ];

  const multiCaseNames: string[] = [
    case1?.name || 'Hòm 1',
    case2?.name || 'Hòm 2',
    case3?.name || 'Hòm 3',
  ];

  // Randomize 3 distinct cases
  const handleRandomize3Cases = () => {
    if (cases.length === 0) return;
    const shuffled = [...cases].sort(() => 0.5 - Math.random());
    const id1 = shuffled[0].id;
    const id2 = shuffled[1]?.id || shuffled[0].id;
    const id3 = shuffled[2]?.id || shuffled[0].id;
    setMultiCaseIds([id1, id2, id3]);
    handleReset();
  };

  // Handler: Mở hòm
  const handleOpen = async () => {
    if (isRequesting || isSpinning) return;

    try {
      setSpinError(null);
      setIsRequesting(true);
      setShowSingleResult(false);
      setShowMultiModal(false);

      const request: OpenCaseRequest = {
        availableIngredientIds: fridgeItems.filter((i) => i.id).map((i) => i.id!),
        availableIngredientNames: fridgeItems.map((i) => i.name),
        onlyCookableWithAvailableIngredients: onlyCookableMode,
      };

      if (openMode === 'single') {
        if (!selectedCaseId) return;
        const result = await caseService.openCase(selectedCaseId, request);
        setWinnerRecipe(result.recipe);
        setWinnerRecipes([result.recipe]);
        setOpenResult(result);
        setMultiResults([result]);
      } else {
        // Mở 3 hòm đã chọn cùng lúc (đồng thời gọi 3 API tương ứng với từng hòm)
        const [res1, res2, res3] = await Promise.all([
          caseService.openCase(multiCaseIds[0], request),
          caseService.openCase(multiCaseIds[1], request),
          caseService.openCase(multiCaseIds[2], request),
        ]);

        const results = [res1, res2, res3];
        setMultiResults(results);
        setWinnerRecipes([res1.recipe, res2.recipe, res3.recipe]);
        setWinnerRecipe(res1.recipe);
      }

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
    if (openMode === 'multi') {
      setShowMultiModal(true);
      if (multiResults.length > 0) {
        lastRollStorage.saveLastRoll({
          mode: 'multi',
          timestamp: Date.now(),
          caseNames: multiCaseNames,
          results: multiResults,
        });
      }
    } else {
      setShowSingleResult(true);
      if (openResult) {
        lastRollStorage.saveLastRoll({
          mode: 'single',
          timestamp: Date.now(),
          caseNames: [currentSingleCase?.name || 'Hòm'],
          results: [openResult],
        });
      }
    }
  };

  const handleViewCachedRoll = (roll: CachedRoll) => {
    if (roll.mode === 'multi') {
      setMultiResults(roll.results);
      setShowMultiModal(true);
    } else {
      setOpenResult(roll.results[0]);
      setShowSingleResult(true);
    }
  };

  const handleReset = () => {
    setShowSingleResult(false);
    setShowMultiModal(false);
    setWinnerRecipe(null);
    setWinnerRecipes([]);
    setOpenResult(null);
    setMultiResults([]);
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
    <div className="space-y-6 text-left pb-16">
      {/* ================= 1. TOP MODE SWITCHER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)]">
        <div>
          <span className="text-xs text-[var(--muted)] block">Chế độ chơi</span>
          <h2 className="text-base font-bold text-[var(--text)]">
            {openMode === 'multi' ? '⚡ Mở Combo 3 Hòm Khác Nhau' : '📦 Mở 1 Hòm Đơn'}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--radius)] w-full sm:w-auto shrink-0">
          <button
            type="button"
            disabled={isSpinning || isRequesting}
            onClick={() => {
              setOpenMode('single');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
              openMode === 'single'
                ? 'bg-[var(--panel)] text-[var(--text)] border border-[var(--muted)] shadow'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>📦</span>
            <span>Mở 1 hòm</span>
          </button>
          <button
            type="button"
            disabled={isSpinning || isRequesting}
            onClick={() => {
              setOpenMode('multi');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
              openMode === 'multi'
                ? 'bg-[var(--gold)] text-black font-bold shadow'
                : 'text-[var(--gold)] hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>Mở 3 hòm</span>
          </button>
        </div>
      </div>

      {/* Banner Bản lưu lượt mở trước (chỉ lưu 1 lần gần nhất) */}
      <LastRollBanner onViewRoll={handleViewCachedRoll} />

      {/* ================= 2. CHẾ ĐỘ 1 HÒM (SINGLE) ================= */}
      {openMode === 'single' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tabs chọn hòm */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[var(--line)] pb-3">
            {cases.map((c) => {
              const isSelected = c.id === selectedCaseId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-[var(--radius)] transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
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

          {/* Tiêu đề hòm được chọn */}
          {currentSingleCase && (
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] leading-tight tracking-tight">
                {currentSingleCase.name}
              </h1>
              <p className="text-sm text-[var(--muted)] max-w-[52ch]">
                {currentSingleCase.description}
              </p>
            </div>
          )}

          {/* Roulette 1 làn */}
          {loadingSingleDetail ? (
            <div className="h-[168px] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] flex items-center justify-center">
              <p className="text-sm text-[var(--muted)]">Đang tải danh sách món...</p>
            </div>
          ) : (
            currentSingleCase && (
              <Roulette
                items={singleRoulettePool}
                winnerRecipe={winnerRecipe}
                isSpinning={isSpinning}
                openCount={1}
                onSpinEnd={handleSpinEnd}
              />
            )
          )}
        </div>
      )}

      {/* ================= 3. CHẾ ĐỘ 3 HÒM KHÁC NHAU (MULTI) ================= */}
      {openMode === 'multi' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--gold)] tracking-tight">
                Chọn 3 Hòm Để Mở Cùng Lúc
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                Bạn có thể chọn 3 hòm khác nhau hoặc giống nhau tùy thích. Mỗi làn sẽ quay đồ ăn từ hòm tương ứng!
              </p>
            </div>

            <button
              type="button"
              disabled={isSpinning || isRequesting}
              onClick={handleRandomize3Cases}
              className="btn-secondary text-xs shrink-0 py-1.5 px-3 flex items-center gap-1.5 cursor-pointer hover:border-[var(--gold)]"
            >
              <span>🎲</span>
              <span>Chọn ngẫu nhiên 3 hòm khác nhau</span>
            </button>
          </div>

          {/* Bộ chọn 3 Slot Hòm */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((slotIndex) => {
              const currentId = multiCaseIds[slotIndex];
              const detail = casesMap[currentId];

              return (
                <div
                  key={slotIndex}
                  className="p-3.5 bg-[var(--panel)] border-2 border-[var(--line)] hover:border-[var(--gold)]/60 rounded-[var(--radius)] space-y-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--gold)] text-black">
                      LÀN #{slotIndex + 1}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      {detail ? `${detail.recipes.length} món ăn` : 'Đang tải...'}
                    </span>
                  </div>

                  {/* Dropdown chọn hòm cho slot này */}
                  <div>
                    <label className="text-[11px] text-[var(--muted)] block mb-1">
                      Chọn hòm cho làn #{slotIndex + 1}:
                    </label>
                    <select
                      value={currentId}
                      disabled={isSpinning || isRequesting}
                      onChange={(e) => {
                        const newId = parseInt(e.target.value);
                        setMultiCaseIds((prev) => {
                          const next: [number, number, number] = [...prev];
                          next[slotIndex] = newId;
                          return next;
                        });
                        handleReset();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--text)] font-medium focus:outline-none focus:border-[var(--gold)]"
                    >
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.recipeCount} món)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Thông tin vắn tắt hòm */}
                  {detail && (
                    <div className="text-xs text-[var(--muted)] line-clamp-1">
                      {detail.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3 Làn Roulette đồng thời */}
          {loadingMultiDetail ? (
            <div className="h-[240px] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] flex items-center justify-center">
              <p className="text-sm text-[var(--muted)]">Đang nạp dữ liệu 3 hòm...</p>
            </div>
          ) : (
            <Roulette
              items={itemsPerLane[0] || []}
              itemsPerLane={itemsPerLane}
              laneLabels={laneLabels}
              winnerRecipes={winnerRecipes}
              isSpinning={isSpinning}
              openCount={3}
              onSpinEnd={handleSpinEnd}
            />
          )}
        </div>
      )}

      {/* ================= 4. ACTION ROW DÙNG CHUNG ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleOpen}
          disabled={isRequesting || isSpinning || loadingSingleDetail || loadingMultiDetail}
          className="btn-gold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 py-2.5 px-6 font-semibold w-full sm:w-auto"
        >
          <span>🎲</span>
          <span>
            {isSpinning
              ? 'Đang quay thưởng...'
              : isRequesting
              ? 'Đang chuẩn bị...'
              : openMode === 'multi'
              ? 'Mở 3 hòm đã chọn'
              : 'Mở hòm'}
          </span>
        </button>

        {/* Cookable toggle */}
        <label className="flex items-center gap-2 text-xs sm:text-sm text-[var(--muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyCookableMode}
            onChange={(e) => setOnlyCookableMode(e.target.checked)}
            className="w-4 h-4 rounded-[var(--radius)] bg-[var(--panel)] border-[var(--line)] shrink-0"
          />
          <span>Chỉ quay món nấu được từ tủ lạnh ({fridgeItems.length} đồ có sẵn)</span>
        </label>

        {spinError && (
          <div className="w-full text-xs sm:text-sm text-[var(--r4)] bg-red-950/30 border border-red-500/30 p-2.5 rounded-[var(--radius)]">
            {spinError}
          </div>
        )}
      </div>

      {/* Detailed Result Card cho Single mode */}
      {showSingleResult && openResult && openMode === 'single' && (
        <OpeningResult result={openResult} onReset={handleReset} />
      )}

      {/* Popup Modal Kết Quả cho Multi mode (Mở 3 hòm) */}
      <MultiOpeningResultModal
        isOpen={showMultiModal}
        results={multiResults}
        caseNames={multiCaseNames}
        onClose={() => setShowMultiModal(false)}
        onReopen={() => {
          setShowMultiModal(false);
          handleOpen();
        }}
        isRequesting={isRequesting}
      />

      {/* ================= 5. DISHES IN CASE (CHO SINGLE MODE) ================= */}
      {openMode === 'single' && currentSingleCase && currentSingleCase.recipes.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-[var(--line)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
              Món ăn trong hòm
            </h2>
            <span className="text-xs text-[var(--muted)]">
              Viền màu là độ khó: xanh dễ, vàng vừa, đỏ khó
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {currentSingleCase.recipes.map((recipe) => {
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
                  className="bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--muted)] rounded-[var(--radius)] p-2 sm:p-2.5 flex flex-col justify-between transition-colors"
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
                    <h3 className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate leading-tight">
                      {recipe.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[var(--muted)] mt-1 truncate">
                      {recipe.cookingTimeMinutes} phút
                      {recipe.estimatedCost
                        ? `, ${Math.round(recipe.estimatedCost / 1000)}k`
                        : ''}
                    </p>
                    {cookable && (
                      <span className="text-[10px] sm:text-[11px] text-[var(--gold)] mt-1 block font-medium truncate">
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
