'use client';

import React, { useEffect, useState } from 'react';
import CaseCard from '@/components/case-opening/CaseCard';
import { caseService } from '@/services/case-service';
import { CaseSummary } from '@/types/case';

export default function HomePage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caseService.getActiveCases();
      setCases(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Không thể kết nối đến Backend. Hãy kiểm tra server ASP.NET Core đang chạy.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <section className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-gradient-to-b from-neutral-900/90 via-neutral-900/40 to-neutral-950 p-8 sm:p-12 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span>🎲</span> Giải pháp cho câu hỏi &ldquo;Hôm nay ăn gì?&rdquo;
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            MỞ HÒM <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">ẨM THỰC</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Chọn hòm theo phong cách bạn thích, quay roulette kiểu CS2 và nhận ngay công thức nấu ăn ngẫu nhiên chuẩn vị!
          </p>
        </div>
      </section>

      {/* Cases Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>📦</span> Danh Sách Hòm Đang Hoạt Động
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Mỗi hòm chứa tập hợp các món ăn với xác suất xuất hiện khác nhau
            </p>
          </div>
          <button
            onClick={fetchCases}
            className="text-xs px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
          >
            Làm mới ↻
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-neutral-900/50 border border-neutral-800 animate-pulse p-5 flex flex-col justify-between"
              >
                <div className="w-full h-44 bg-neutral-800/60 rounded-xl" />
                <div className="space-y-2 mt-4">
                  <div className="h-5 bg-neutral-800/60 rounded w-2/3" />
                  <div className="h-4 bg-neutral-800/40 rounded w-full" />
                </div>
                <div className="h-10 bg-neutral-800/40 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/50 text-center space-y-4 max-w-lg mx-auto">
            <span className="text-4xl">⚠️</span>
            <h3 className="text-lg font-bold text-rose-300">Không thể tải danh sách hòm</h3>
            <p className="text-xs text-neutral-400">{error}</p>
            <p className="text-xs text-neutral-500">
              Hãy chắc chắn Backend ASP.NET Core đang chạy trên cổng 5000 và đã kết nối Database.
            </p>
            <button
              onClick={fetchCases}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition-all"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && cases.length === 0 && (
          <div className="p-12 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center space-y-3">
            <span className="text-4xl">📭</span>
            <h3 className="text-lg font-bold text-white">Chưa có hòm nào hoạt động</h3>
            <p className="text-sm text-neutral-400">
              Hãy chạy database seeding trong backend để nạp dữ liệu hòm mẫu.
            </p>
          </div>
        )}

        {/* Case Cards Grid */}
        {!loading && !error && cases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((fc) => (
              <CaseCard key={fc.id} foodCase={fc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
