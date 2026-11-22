import React from 'react';
import Link from 'next/link';

/** Pie discreto, solo en pantallas anchas (en el celular la barra inferior ocupa ese lugar): lleva a privacidad y cookies. */
export function SiteFooter() {
  return (
    <footer className="hidden border-t border-line px-6 py-5 text-xs text-ink-subtle md:block">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span>ECI MyCampus · Escuela Colombiana de Ingeniería Julio Garavito</span>
        <Link href="/privacidad" className="rounded px-1 text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Privacidad y cookies
        </Link>
      </div>
    </footer>
  );
}
