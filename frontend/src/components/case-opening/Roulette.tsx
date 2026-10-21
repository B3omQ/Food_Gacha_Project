'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CaseRecipeItem } from '@/types/case';
import { RecipeSummary } from '@/types/recipe';

interface RouletteProps {
  items: CaseRecipeItem[];
  itemsPerLane?: CaseRecipeItem[][];
  laneLabels?: string[];
  winnerRecipe?: RecipeSummary | null;
  winnerRecipes?: RecipeSummary[];
  isSpinning: boolean;
  onSpinEnd: () => void;
  openCount?: 1 | 3;
}

const ITEM_WIDTH = 124;
const ITEM_GAP = 8;
const CARD_FULL_WIDTH = ITEM_WIDTH + ITEM_GAP;
const TOTAL_ROULETTE_ITEMS = 65;
const WINNER_INDEX = 50;

export default function Roulette({
  items,
  itemsPerLane,
  laneLabels,
  winnerRecipe,
  winnerRecipes,
  isSpinning,
  onSpinEnd,
  openCount = 1,
}: RouletteProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Chuẩn hóa danh sách người chiến thắng: 1 món (1x) hoặc 3 món (3x)
  const resolvedWinners: (RecipeSummary | null)[] =
    openCount === 3
      ? [
          winnerRecipes?.[0] || null,
          winnerRecipes?.[1] || null,
          winnerRecipes?.[2] || null,
        ]
      : [winnerRecipe || winnerRecipes?.[0] || null];

  // Procedural audio tick sound
  const playTick = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted
    }
  };

  // Procedural victory chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.55);
      });
    } catch {
      // ignore
    }
  };

  // Tick sound loop during spinning
  useEffect(() => {
    if (!isSpinning) return;

    let tickCount = 0;
    const maxTicks = openCount === 3 ? 55 : 45;
    const totalDuration = openCount === 3 ? 5800 : 5200;
    const startTime = performance.now();
    let animationFrameId: number;

    const tickLoop = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const expectedTicks = Math.floor((1 - Math.pow(1 - progress, 3)) * maxTicks);
      if (expectedTicks > tickCount) {
        playTick();
        tickCount = expectedTicks;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tickLoop);
      }
    };

    animationFrameId = requestAnimationFrame(tickLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpinning, openCount]);

  return (
    <div className="w-full my-4 space-y-3">
      {/* Sound toggle button */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          {openCount === 3 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--panel)] border border-[var(--gold)]/40 text-[var(--gold)]">
              ⚡ Chế độ 3 làn quay đồng thời
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          {soundEnabled ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt'}
        </button>
      </div>

      {/* Danh sách các làn quay (1 hoặc 3 làn) */}
      <div className={`space-y-3 ${openCount === 3 ? 'p-2 rounded-[var(--radius)] bg-[var(--bg)]/80 border border-[var(--line)]' : ''}`}>
        {resolvedWinners.map((winner, index) => {
          // Staggered durations for each lane: Lane 1 (4800ms), Lane 2 (5200ms), Lane 3 (5600ms)
          const laneDuration =
            openCount === 3 ? 4800 + index * 400 : 5200;
          const laneDelay = openCount === 3 ? index * 120 : 0;
          const isLastLane = index === resolvedWinners.length - 1;
          const lanePool = itemsPerLane?.[index] && itemsPerLane[index].length > 0 ? itemsPerLane[index] : items;
          const label = laneLabels?.[index] || `LÀN #${index + 1}`;

          return (
            <SingleRouletteLane
              key={index}
              laneIndex={index}
              laneLabel={label}
              openCount={openCount}
              items={lanePool}
              winnerRecipe={winner}
              isSpinning={isSpinning}
              durationMs={laneDuration}
              delayMs={laneDelay}
              onLaneEnd={() => {
                if (isLastLane) {
                  playChime();
                  onSpinEnd();
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ================= COMPONENT: TỪNG LÀN QUAY =================
interface SingleRouletteLaneProps {
  laneIndex: number;
  laneLabel: string;
  openCount: 1 | 3;
  items: CaseRecipeItem[];
  winnerRecipe: RecipeSummary | null;
  isSpinning: boolean;
  durationMs: number;
  delayMs: number;
  onLaneEnd: () => void;
}

function SingleRouletteLane({
  laneIndex,
  laneLabel,
  openCount,
  items,
  winnerRecipe,
  isSpinning,
  durationMs,
  delayMs,
  onLaneEnd,
}: SingleRouletteLaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [rouletteList, setRouletteList] = useState<CaseRecipeItem[]>([]);

  // Build the roulette strip items whenever items or winnerRecipe change
  useEffect(() => {
    if (items.length === 0) return;

    const list: CaseRecipeItem[] = [];
    for (let i = 0; i < TOTAL_ROULETTE_ITEMS; i++) {
      if (i === WINNER_INDEX && winnerRecipe) {
        list.push({
          recipeId: winnerRecipe.id,
          name: winnerRecipe.name,
          imageUrl: winnerRecipe.imageUrl,
          cookingTimeMinutes: winnerRecipe.cookingTimeMinutes,
          estimatedCost: winnerRecipe.estimatedCost,
          difficulty: winnerRecipe.difficulty,
          weight: 1,
        });
      } else {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        list.push(randomItem);
      }
    }
    setRouletteList(list);
  }, [items, winnerRecipe]);

  // Execute spinning animation
  useEffect(() => {
    if (!isSpinning || !stripRef.current || !containerRef.current || !winnerRecipe) {
      return;
    }

    const containerWidth = containerRef.current.clientWidth;
    const centerOffset = containerWidth / 2;

    // Small natural jitter offset within winning card (-24px to +24px)
    const randomCardOffset = (Math.random() - 0.5) * 48;
    const targetTranslateX =
      WINNER_INDEX * CARD_FULL_WIDTH + ITEM_WIDTH / 2 - centerOffset + randomCardOffset;

    const strip = stripRef.current;

    // 1. Immediately reset strip to 0 without transition
    strip.style.transition = 'none';
    strip.style.transform = 'translateX(0px)';

    // 2. Force browser reflow
    void strip.offsetWidth;

    // 3. Start smooth CS-style animation using cubic-bezier curve
    const animTimer = setTimeout(() => {
      if (!stripRef.current) return;
      stripRef.current.style.transition = `transform ${durationMs}ms cubic-bezier(.12, .72, .08, 1)`;
      stripRef.current.style.transform = `translateX(-${targetTranslateX}px)`;
    }, delayMs);

    // 4. Conclude spin when animation finishes
    const endTimer = setTimeout(() => {
      onLaneEnd();
    }, durationMs + delayMs + 100);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(endTimer);
    };
  }, [isSpinning, winnerRecipe, durationMs, delayMs, onLaneEnd]);

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

  const laneHeightClass = openCount === 3 ? 'h-[142px]' : 'h-[168px]';
  const cardHeightClass = openCount === 3 ? 'h-[126px]' : 'h-[148px]';
  const imgHeightClass = openCount === 3 ? 'h-[72px]' : 'h-[86px]';

  return (
    <div className="relative w-full">
      {/* Lane Label if in 3x mode */}
      {openCount === 3 && (
        <div className="absolute top-2 left-3 z-30 pointer-events-none max-w-[80%]">
          <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-black/75 text-[var(--gold)] border border-[var(--gold)]/40 backdrop-blur-sm shadow truncate block">
            {laneLabel}
          </span>
        </div>
      )}

      {/* Roulette Viewport */}
      <div
        ref={containerRef}
        className={`relative ${laneHeightClass} w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden shadow-inner`}
      >
        {/* Vignette gradients to conceal frame edges */}
        <div className="absolute top-0 left-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-[var(--panel)] via-[var(--panel)]/70 to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-[var(--panel)] via-[var(--panel)]/70 to-transparent z-20 pointer-events-none" />

        {/* Center Target Needle: CS-style indicator with top and bottom arrows */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[var(--gold)] z-30 pointer-events-none">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-[var(--gold)]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[var(--gold)]" />
        </div>

        {/* Moving Card Strip */}
        <div
          ref={stripRef}
          className="flex items-center h-full px-4 will-change-transform"
          style={{
            gap: `${ITEM_GAP}px`,
            width: `${TOTAL_ROULETTE_ITEMS * CARD_FULL_WIDTH}px`,
          }}
        >
          {rouletteList.map((item, index) => {
            const isWinnerCard = index === WINNER_INDEX && !isSpinning && winnerRecipe;
            const rarity = getRarityColor(item.difficulty);

            return (
              <div
                key={`${item.recipeId}-${index}`}
                style={{
                  width: `${ITEM_WIDTH}px`,
                  borderBottomColor: rarity,
                  borderBottomWidth: '3px',
                  borderColor: isWinnerCard ? rarity : undefined,
                  borderWidth: isWinnerCard ? '2px' : undefined,
                }}
                className={`flex-shrink-0 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--radius)] p-2 flex flex-col justify-between transition-all duration-300 ${cardHeightClass} ${
                  isWinnerCard ? 'animate-winner-pulse ring-2 ring-[var(--gold)]/50' : ''
                }`}
              >
                {/* Dish image */}
                <div className={`relative w-full ${imgHeightClass} rounded-[2px] overflow-hidden bg-[var(--panel)]`}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--muted)] text-[10px]">
                        đĩa
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mt-0.5">
                  <h4
                    className="text-[12px] font-semibold text-[var(--text)] truncate leading-tight"
                    title={item.name}
                  >
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5 truncate">
                    {item.cookingTimeMinutes}p
                    {item.estimatedCost
                      ? ` • ${Math.round(item.estimatedCost / 1000)}k`
                      : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
