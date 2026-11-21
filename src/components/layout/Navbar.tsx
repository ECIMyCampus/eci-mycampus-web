'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { getInitials } from '../../lib/auth/labels';
import { withReturnTo } from '../../lib/auth/redirect';
import { useSession } from '../../lib/session/session';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { NAV_ITEMS, isActivePath } from './nav-items';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { status, user } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-control" aria-label="ECI MyCampus, inicio">
          <span className="flex h-8 w-8 items-center justify-center rounded-control bg-accent text-xs font-bold text-white">
            ECI
          </span>
          <span className="text-sm font-semibold text-ink">MyCampus</span>
        </Link>

        {/* Navegación de escritorio. En celular la reemplaza la barra inferior. */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV_ITEMS.filter((item) => item.href !== '/perfil').map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-control px-3 py-1.5 text-sm font-medium transition-colors duration-fast ease-out',
                  active ? 'bg-surface-raised text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mientras se consulta la sesión se reserva el espacio, para que la barra no salte. */}
        {status === 'loading' ? (
          <span aria-hidden="true" className="h-9 w-28 rounded-control bg-surface-raised" />
        ) : user ? (
          <Button href="/perfil" variant="secondary" size="sm" aria-label={`Mi perfil, ${user.fullName}`}>
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white"
            >
              {getInitials(user.fullName)}
            </span>
            <span className="hidden max-w-[10rem] truncate sm:inline">{user.fullName.split(/\s+/)[0]}</span>
          </Button>
        ) : (
          <Button href={withReturnTo('/login', pathname)} variant="secondary" size="sm">
            <User className="h-4 w-4" aria-hidden="true" />
            Iniciar sesión
          </Button>
        )}
      </div>
    </header>
  );
};
