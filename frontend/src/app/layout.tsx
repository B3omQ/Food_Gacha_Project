import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

const barlowCondensed = Barlow_Condensed({
  weight: ['600', '700'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Food Case Opener',
  description: 'Chọn món ăn ngẫu nhiên theo phong cách mở hòm CS2.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${barlowCondensed.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased text-[var(--text)] bg-[var(--bg)]">
        <Suspense fallback={<div className="h-[56px] border-b border-[var(--line)] bg-[var(--bg)]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted)]">
          <p>© 2026 Food Case Opener</p>
        </footer>
      </body>
    </html>
  );
}
