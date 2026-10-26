'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MapPin, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Radar', href: '/', icon: Compass, color: 'text-eci-red-light' },
    { label: 'Mapa ECI', href: '/mapa', icon: MapPin, color: 'text-sky-400' },
    { label: 'Agenda', href: '/mis-eventos', icon: Calendar, color: 'text-amber-400' },
    { label: 'Perfil', href: '/perfil', icon: User, color: 'text-emerald-400' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-slate-800 bg-slate-900/95 backdrop-blur-lg md:hidden pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-touch min-w-touch transition-all',
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && item.color)} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-eci-red" />
                )}
              </div>
              <span className={cn('text-[11px] mt-1 font-medium', isActive ? 'text-white' : 'text-slate-400')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
