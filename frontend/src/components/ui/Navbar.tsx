'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fridgeStorage } from '@/lib/fridge-storage';

export default function Navbar() {
  const pathname = usePathname();
  const [fridgeCount, setFridgeCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      setFridgeCount(fridgeStorage.getItems().length);
    };

    updateCount();
    window.addEventListener('fridge-updated', updateCount);
    return () => window.removeEventListener('fridge-updated', updateCount);
  }, []);

  const navLinks = [
    { href: '/', label: 'Hòm món ăn' },
    { href: '/?mode=multi', label: '⚡ Mở 3 hòm' },
    { href: '/recipes', label: 'Công thức' },
    { href: '/admin', label: 'Quản lý' },
  ];

  return (
    <header className="h-[56px] border-b border-[var(--line)] bg-[var(--bg)] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading font-bold text-base sm:text-[22px] tracking-wide text-[var(--text)] hover:text-white transition-colors shrink-0"
        >
          Food Case Opener
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-5 text-xs sm:text-[15px] overflow-x-auto no-scrollbar">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/' || pathname.startsWith('/cases')
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-2 sm:py-3.5 px-1.5 sm:px-0 whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'text-[var(--text)] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--gold)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Fridge Link */}
          <Link
            href="/fridge"
            className={`relative py-2 sm:py-3.5 px-1.5 sm:px-0 whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 ${
              pathname === '/fridge'
                ? 'text-[var(--text)] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--gold)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>Tủ lạnh</span>
            {fridgeCount > 0 && (
              <span className="font-bold text-[var(--gold)] ml-0.5">
                {fridgeCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
