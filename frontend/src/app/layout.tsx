import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'Food Case Opener — Hôm Nay Ăn Gì? Mở Hòm Roulette CS2',
  description: 'Trải nghiệm mở hòm roulette phong cách CS2 để chọn món ăn ngẫu nhiên cho bữa cơm gia đình bạn.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-neutral-950">
        <Suspense fallback={<div className="h-16 border-b border-neutral-800/80 bg-neutral-950/80" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-900 bg-neutral-950/80 py-6 text-center text-xs text-neutral-500">
          <p>© 2026 Food Case Opener — Chọn món ăn ngẫu nhiên với cơ chế Roulette CS2.</p>
        </footer>
      </body>
    </html>
  );
}
