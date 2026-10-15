import Link from 'next/link';
import { CaseSummary } from '@/types/case';

interface CaseCardProps {
  foodCase: CaseSummary;
}

export default function CaseCard({ foodCase }: CaseCardProps) {
  return (
    <div className="bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--muted)] rounded-[var(--radius)] p-4 flex flex-col justify-between transition-colors">
      <div>
        <div className="relative w-full aspect-[4/3] rounded-[var(--radius)] overflow-hidden bg-[var(--bg)] border border-[var(--line)] mb-3">
          {foodCase.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foodCase.imageUrl}
              alt={foodCase.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
              hòm
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
          {foodCase.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
          {foodCase.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {foodCase.recipeCount} món ăn
        </span>
        <Link
          href={`/cases/${foodCase.id}`}
          className="btn-gold text-xs font-semibold py-1 px-3"
        >
          Mở hòm
        </Link>
      </div>
    </div>
  );
}
