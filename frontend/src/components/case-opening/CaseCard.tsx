import Link from 'next/link';
import { CaseSummary } from '@/types/case';

interface CaseCardProps {
  foodCase: CaseSummary;
}

export default function CaseCard({ foodCase }: CaseCardProps) {
  return (
    <div className="group relative rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 border border-neutral-800 hover:border-amber-500/50 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
      {/* Background ambient glow on hover */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

      <div>
        {/* Case Artwork */}
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 mb-4 group-hover:border-amber-500/30 transition-colors">
          {foodCase.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foodCase.imageUrl}
              alt={foodCase.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950">
              <span className="text-5xl">📦</span>
            </div>
          )}

          {/* Floating Tag */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-neutral-900/80 text-amber-300 border border-amber-500/30 shadow-md flex items-center gap-1.5">
            <span>🎲</span>
            <span>{foodCase.recipeCount} Món ăn</span>
          </div>

          {/* Case badge */}
          <div className="absolute bottom-2 left-3 text-[10px] uppercase font-bold tracking-wider text-neutral-400 backdrop-blur-sm bg-black/50 px-2 py-0.5 rounded border border-white/5">
            Container Case
          </div>
        </div>

        {/* Info */}
        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
          {foodCase.name}
        </h3>
        <p className="mt-2 text-sm text-neutral-400 line-clamp-2 leading-relaxed">
          {foodCase.description}
        </p>
      </div>

      {/* Button */}
      <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
        <span className="text-xs text-neutral-500 font-mono">
          CASE #{foodCase.id.toString().padStart(2, '0')}
        </span>
        <Link
          href={`/cases/${foodCase.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-95"
        >
          <span>Mở Hòm</span>
          <span className="text-base">➔</span>
        </Link>
      </div>
    </div>
  );
}
