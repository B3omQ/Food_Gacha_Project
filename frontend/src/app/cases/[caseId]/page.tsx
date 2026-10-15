'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Roulette from '@/components/case-opening/Roulette';
import OpeningResult from '@/components/case-opening/OpeningResult';
import { caseService } from '@/services/case-service';
import { CaseDetail } from '@/types/case';
import { RecipeSummary } from '@/types/recipe';

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

  // Opening states
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerRecipe, setWinnerRecipe] = useState<RecipeSummary | null>(null);
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
  }, [caseId]);

  const handleOpenCase = async () => {
    if (isRequesting || isSpinning || !caseDetail) return;

    try {
      setOpenError(null);
      setIsRequesting(true);
      setShowResult(false);

      // 1. Call Backend API to get the authoritative result
      const result = await caseService.openCase(caseId);

      // 2. Supply the winner recipe to the roulette wheel
      setWinnerRecipe(result.recipe);

      // 3. Trigger the CS2 roulette spin animation
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
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-neutral-400">Đang chuẩn bị hòm...</p>
      </div>
    );
  }

  if (error || !caseDetail) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center space-y-4">
        <span className="text-4xl">❌</span>
        <h2 className="text-xl font-bold text-white">Lỗi nạp hòm</h2>
        <p className="text-sm text-neutral-400">{error || 'Hòm không tồn tại.'}</p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-neutral-800 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          ← Quay lại danh sách hòm
        </Link>
      </div>
    );
  }

  const totalWeight = caseDetail.recipes.reduce((acc, r) => acc + r.weight, 0);

  return (
    <div className="space-y-8">
      {/* Top Navigation & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <Link
            href="/"
            className="text-xs text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1 mb-2"
          >
            ← Tất cả hòm
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            {caseDetail.name}
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            {caseDetail.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <span className="text-neutral-500 block">Số lượng món</span>
            <span className="font-bold text-white text-sm">
              {caseDetail.recipes.length} món
            </span>
          </div>
        </div>
      </div>

      {/* Opening Error Banner */}
      {openError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-sm text-rose-300 text-center">
          ⚠️ {openError}
        </div>
      )}

      {/* Roulette Machine */}
      <section className="bg-neutral-900/30 border border-neutral-800/80 rounded-3xl p-6 text-center">
        <Roulette
          items={caseDetail.recipes}
          winnerRecipe={winnerRecipe}
          isSpinning={isSpinning}
          onSpinEnd={handleSpinEnd}
        />

        {/* Action Button */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleOpenCase}
            disabled={isRequesting || isSpinning}
            className={`px-8 py-4 rounded-2xl text-lg font-black tracking-wide uppercase transition-all shadow-xl active:scale-95 ${
              isRequesting || isSpinning
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-neutral-950 shadow-amber-500/20 hover:shadow-amber-500/40 scale-100 hover:scale-105'
            }`}
          >
            {isRequesting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                Đang mở hòm...
              </span>
            ) : isSpinning ? (
              <span className="flex items-center gap-2">
                <span>🎰</span> Đang quay Roulette...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>⚡</span> Mở Hòm Ngay
              </span>
            )}
          </button>
          <p className="mt-2 text-xs text-neutral-500">
            Kết quả được quyết định ngẫu nhiên theo trọng số từ Backend
          </p>
        </div>

        {/* Winning Result Display */}
        {showResult && winnerRecipe && (
          <OpeningResult recipe={winnerRecipe} onReset={handleReset} />
        )}
      </section>

      {/* Case Contents / Probability Table */}
      <section className="space-y-4 pt-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📋</span> Danh Sách Món Có Thể Nhận
          </h2>
          <p className="text-xs text-neutral-400">
            Trọng số quyết định tỷ lệ rơi của từng món ăn trong hòm này
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {caseDetail.recipes.map((cr) => {
            const percentage = totalWeight > 0 ? ((cr.weight / totalWeight) * 100).toFixed(1) : '0';
            return (
              <div
                key={cr.recipeId}
                className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-3.5 flex flex-col justify-between hover:border-neutral-700 transition-colors"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex-shrink-0">
                    {cr.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cr.imageUrl}
                        alt={cr.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🍲
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white truncate" title={cr.name}>
                      {cr.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                      <span>⏱ {cr.cookingTimeMinutes}m</span>
                      <span>•</span>
                      <span>{cr.difficulty}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Tỷ lệ rơi:</span>
                  <span className="font-bold font-mono text-amber-400">
                    {percentage}% (W: {cr.weight})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
