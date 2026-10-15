import Link from 'next/link';
import { RecipeSummary } from '@/types/recipe';

interface RecipeCardProps {
  recipe: RecipeSummary;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'hard':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="group rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/40 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Image */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 mb-3.5">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🍳
            </div>
          )}

          <div
            className={`absolute top-2.5 right-2.5 text-[11px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getDifficultyBadge(
              recipe.difficulty
            )}`}
          >
            {recipe.difficulty}
          </div>
        </div>

        {/* Title & Desc */}
        <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-1">
          {recipe.name}
        </h3>
        <p className="mt-1.5 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>
      </div>

      {/* Meta & Button */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>⏱ {recipe.cookingTimeMinutes}m</span>
          {recipe.estimatedCost && (
            <span className="font-mono text-amber-300/90 font-medium">
              ~{recipe.estimatedCost.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>

        <Link
          href={`/recipes/${recipe.id}`}
          className="text-xs font-semibold text-neutral-300 hover:text-amber-400 transition-colors flex items-center gap-1 group-hover:translate-x-0.5"
        >
          <span>Chi tiết</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
