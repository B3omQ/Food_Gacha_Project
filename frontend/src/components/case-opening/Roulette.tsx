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

const ITEM_WIDTH = 132;
const ITEM_GAP = 8;
const CARD_FULL_WIDTH = ITEM_WIDTH + ITEM_GAP;
const TOTAL_ROULETTE_ITEMS = 65;
const WINNER_INDEX = 50;
const DURATION_MS = 5500; // 5.5s spin duration

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
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
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

    // Small natural jitter offset within winning card (-28px to +28px)
    const randomCardOffset = (Math.random() - 0.5) * 56;
    const targetTranslateX =
      WINNER_INDEX * CARD_FULL_WIDTH + ITEM_WIDTH / 2 - centerOffset + randomCardOffset;

    const strip = stripRef.current;

    // 1. Immediately reset strip to 0 without transition
    strip.style.transition = 'none';
    strip.style.transform = 'translateX(0px)';

    // 2. Force browser reflow to ensure translateX(0px) is applied before animating
    void strip.offsetWidth;

    // Sound tick interval loop simulation
    let tickCount = 0;
    const maxTicks = 45;
    const startTime = performance.now();
    let animationFrameId: number;

    const tickLoop = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      // Decelerating ticks
      const expectedTicks = Math.floor((1 - Math.pow(1 - progress, 3)) * maxTicks);
      if (expectedTicks > tickCount) {
        playTick();
        tickCount = expectedTicks;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tickLoop);
      }
    };

    // 3. Start smooth CS-style animation using cubic-bezier curve
    requestAnimationFrame(() => {
      strip.style.transition = `transform ${DURATION_MS}ms cubic-bezier(.12, .72, .08, 1)`;
      strip.style.transform = `translateX(-${targetTranslateX}px)`;
      animationFrameId = requestAnimationFrame(tickLoop);
    });

    // 4. Conclude spin when animation finishes
    const timer = setTimeout(() => {
      playChime();
      onSpinEnd();
    }, DURATION_MS + 150);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpinning, winnerRecipe, onSpinEnd]);

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

  return (
    <div className="w-full my-4">
      {/* Sound toggle button */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          {soundEnabled ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt'}
        </button>
      </div>

      {/* Roulette Viewport */}
      <div
        ref={containerRef}
        className="relative h-[176px] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden"
      >
        {/* Vignette gradients to conceal frame edges */}
        <div className="absolute top-0 left-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-[var(--panel)] via-[var(--panel)]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-24 sm:w-36 bg-gradient-to-l from-[var(--panel)] via-[var(--panel)]/80 to-transparent z-20 pointer-events-none" />

        {/* Center Target Indicator: 2px line in --text */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[var(--text)] z-30 pointer-events-none" />

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
                  height: '148px',
                  borderBottomColor: rarity,
                  borderBottomWidth: '4px',
                  borderColor: isWinnerCard ? rarity : undefined,
                  borderWidth: isWinnerCard ? '2px' : undefined,
                }}
                className={`flex-shrink-0 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--radius)] p-2 flex flex-col justify-between transition-all duration-300 ${
                  isWinnerCard ? 'animate-winner-pulse' : ''
                }`}
              >
                {/* Dish image / plate */}
                <div className="relative w-full h-[82px] rounded-[2px] overflow-hidden bg-[var(--panel)]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--muted)] text-xs">
                        đĩa
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mt-1">
                  <h4
                    className="text-[13px] font-medium text-[var(--text)] truncate leading-tight"
                    title={item.name}
                  >
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                    {item.cookingTimeMinutes} phút
                    {item.estimatedCost
                      ? `, ${Math.round(item.estimatedCost / 1000)}k`
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
