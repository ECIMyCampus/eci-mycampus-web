'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { NAV_ITEMS, isActivePath } from './nav-items';

/** Barra de navegación del celular. Respeta la zona segura inferior del dispositivo. */
export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/85 backdrop-blur-lg md:hidden"
    >
      <div className="flex h-14 items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'pressable flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium',
                'transition-colors duration-fast ease-out',
                active ? 'text-ink' : 'text-ink-subtle',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-accent-ink')} aria-hidden="true" />
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
