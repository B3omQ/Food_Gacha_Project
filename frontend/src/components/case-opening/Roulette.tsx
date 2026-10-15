'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CaseRecipeItem } from '@/types/case';
import { RecipeSummary } from '@/types/recipe';

interface RouletteProps {
  items: CaseRecipeItem[];
  winnerRecipe: RecipeSummary | null;
  isSpinning: boolean;
  onSpinEnd: () => void;
}

const ITEM_WIDTH = 180; // width of each card in pixels
const ITEM_GAP = 12; // gap between cards
const CARD_FULL_WIDTH = ITEM_WIDTH + ITEM_GAP;
const TOTAL_ROULETTE_ITEMS = 65;
const WINNER_INDEX = 52; // target index for winning card

export default function Roulette({
  items,
  winnerRecipe,
  isSpinning,
  onSpinEnd,
}: RouletteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [rouletteList, setRouletteList] = useState<CaseRecipeItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize procedural audio tick
  const playTick = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted or not supported
    }
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C chord chime
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.65);
      });
    } catch {
      // ignore
    }
  };

  // Build the items sequence when items change or when winner is supplied
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

  // Handle spinning animation
  useEffect(() => {
    if (!isSpinning || !stripRef.current || !containerRef.current || !winnerRecipe) {
      return;
    }

    const containerWidth = containerRef.current.clientWidth;
    const centerOffset = containerWidth / 2;

    // Small random offset within the winning card (-30px to +30px)
    const randomCardOffset = (Math.random() - 0.5) * 60;
    const targetTranslateX =
      WINNER_INDEX * CARD_FULL_WIDTH + ITEM_WIDTH / 2 - centerOffset + randomCardOffset;

    const strip = stripRef.current;

    // Reset position first
    strip.style.transition = 'none';
    strip.style.transform = 'translateX(0px)';

    // Sound tick interval loop simulation
    let tickCount = 0;
    const maxTicks = 45;
    const startTime = performance.now();
    const duration = 6500; // 6.5s spin

    let animationFrameId: number;

    const tickLoop = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Using easeOutCubic to calculate ticks
      const expectedTicks = Math.floor((1 - Math.pow(1 - progress, 3)) * maxTicks);
      if (expectedTicks > tickCount) {
        playTick();
        tickCount = expectedTicks;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tickLoop);
      }
    };

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      strip.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.25, 1)`;
      strip.style.transform = `translateX(-${targetTranslateX}px)`;
      animationFrameId = requestAnimationFrame(tickLoop);
    });

    const timer = setTimeout(() => {
      playChime();
      onSpinEnd();
    }, duration + 200);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpinning, winnerRecipe, onSpinEnd]);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'hard':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto my-6">
      {/* Sound toggle */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 flex items-center gap-1.5 transition-colors"
        >
          <span>{soundEnabled ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt'}</span>
        </button>
      </div>

      {/* Main Roulette Box */}
      <div
        ref={containerRef}
        className="relative h-64 w-full bg-neutral-950/90 rounded-2xl border-2 border-neutral-800 shadow-2xl overflow-hidden backdrop-blur-xl"
      >
        {/* Edge Vignette & Blur Overlays */}
        <div className="absolute top-0 left-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-24 sm:w-36 bg-gradient-to-l from-neutral-950 via-neutral-950/80 to-transparent z-20 pointer-events-none" />

        {/* Center Indicator (CS2 Pointer) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center h-full justify-between py-1">
          {/* Top Marker */}
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[12px] border-t-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          {/* Glowing Line */}
          <div className="w-0.5 h-[calc(100%-24px)] bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400 shadow-[0_0_10px_#fbbf24]" />
          {/* Bottom Marker */}
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[12px] border-b-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        </div>

        {/* Moving Strip */}
        <div
          ref={stripRef}
          className="flex items-center h-full gap-3 px-4 will-change-transform"
          style={{ width: `${TOTAL_ROULETTE_ITEMS * CARD_FULL_WIDTH}px` }}
        >
          {rouletteList.map((item, index) => {
            const isTarget = index === WINNER_INDEX && !isSpinning && winnerRecipe;
            return (
              <div
                key={`${item.recipeId}-${index}`}
                style={{ width: `${ITEM_WIDTH}px` }}
                className={`flex-shrink-0 h-52 rounded-xl border p-3 flex flex-col justify-between transition-all duration-300 ${
                  isTarget
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-105'
                    : 'border-neutral-800 bg-neutral-900/60'
                }`}
              >
                {/* Item Thumbnail */}
                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🍲
                    </div>
                  )}

                  {/* Difficulty Tag */}
                  <div
                    className={`absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${getDifficultyBadge(
                      item.difficulty
                    )}`}
                  >
                    {item.difficulty}
                  </div>
                </div>

                {/* Item Info */}
                <div className="mt-1">
                  <h4 className="text-xs font-bold text-white truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>⏱ {item.cookingTimeMinutes}m</span>
                    {item.estimatedCost && (
                      <span className="text-amber-300/90 font-mono">
                        {item.estimatedCost.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom colored bar indicating rarity style */}
                <div
                  className={`w-full h-1 rounded-full ${
                    item.difficulty === 'Hard'
                      ? 'bg-rose-500'
                      : item.difficulty === 'Easy'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
