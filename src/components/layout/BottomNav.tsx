'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useSession } from '../../lib/session/session';
import { cn } from '../../lib/utils';
import { NAV_ITEMS, NavItem, isActivePath } from './nav-items';

/** Sin sesión, el último botón invita a entrar en vez de llevar a un perfil que no existe. */
const SIGN_IN_ITEM: NavItem = { label: 'Entrar', shortLabel: 'Entrar', href: '/login', icon: LogIn };

/** Barra de navegación del celular. Respeta la zona segura inferior del dispositivo. */
export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { status } = useSession();

  if (pathname === '/bienvenida') return null;

  const items = NAV_ITEMS.map((item) => (item.href === '/perfil' && status === 'anonymous' ? SIGN_IN_ITEM : item));

  return (
    <nav
      aria-label="Principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/85 backdrop-blur-lg md:hidden"
    >
      <div className="flex h-14 items-stretch">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href) || (item === SIGN_IN_ITEM && pathname === '/registro');
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
