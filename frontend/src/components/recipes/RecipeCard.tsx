import Link from 'next/link';
import { RecipeSummary } from '@/types/recipe';

interface RecipeCardProps {
  recipe: RecipeSummary;
}

export function getDifficultyColor(difficulty?: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'var(--r1)';
    case 'hard':
      return 'var(--r4)';
    default:
      return 'var(--r2)';
  }
}

export function formatRecipeSubtext(minutes: number, cost?: number | null): string {
  const parts: string[] = [`${minutes} phút`];
  if (cost != null && cost > 0) {
    const costText = cost >= 1000 ? `${Math.round(cost / 1000)}k` : `${cost}đ`;
    parts.push(`khoảng ${costText}`);
  }
  return parts.join(', ');
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const borderColor = getDifficultyColor(recipe.difficulty);
  const subtext = formatRecipeSubtext(recipe.cookingTimeMinutes, recipe.estimatedCost);

  return (
    <div
      className="bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--muted)] transition-colors rounded-[var(--radius)] flex flex-col justify-between overflow-hidden"
      style={{ borderBottom: `4px solid ${borderColor}` }}
    >
      <div className="p-3">
        {/* Image 4:3 */}
        <div className="relative w-full aspect-[4/3] rounded-[2px] overflow-hidden bg-[var(--bg)] mb-3">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
              <div className="w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-xs">
                Món ăn
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[15px] text-[var(--text)] line-clamp-1 leading-snug">
          {recipe.name}
        </h3>

        {/* Subtitle */}
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          {subtext}
        </p>
      </div>

      {/* Link to recipe */}
      <div className="px-3 pb-3 pt-1">
        <Link
          href={`/recipes/${recipe.id}`}
          className="text-[13px] text-[var(--text)] hover:underline inline-block"
        >
          Xem công thức
        </Link>
      </div>
    </div>
  );
}
