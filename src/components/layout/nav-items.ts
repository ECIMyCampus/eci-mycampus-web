import { Calendar, Compass, MapPin, User, type LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  /** Etiqueta corta para la barra inferior del celular. */
  shortLabel: string;
  href: string;
  icon: LucideIcon;
}

/** Navegación principal: una sola lista para la barra superior y la inferior. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Radar en vivo', shortLabel: 'Radar', href: '/', icon: Compass },
  { label: 'Mapa del campus', shortLabel: 'Mapa', href: '/mapa', icon: MapPin },
  { label: 'Mi agenda', shortLabel: 'Agenda', href: '/mis-eventos', icon: Calendar },
  { label: 'Perfil', shortLabel: 'Perfil', href: '/perfil', icon: User },
];

/** La raíz solo está activa en "/"; las demás también en sus subrutas. */
export const isActivePath = (pathname: string | null, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname === href || Boolean(pathname?.startsWith(`${href}/`));
