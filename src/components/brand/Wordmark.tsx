import React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

interface WordmarkProps {
  /** El tamaño sale del texto que lo rodea: se ajusta con una clase como `text-[28px]`. */
  className?: string;
  /** Dibuja detrás la curva del logo de la Escuela, a 90 % del ancho y 25 % de visibilidad. */
  background?: boolean;
}

/**
 * Logotipo oficial «ECI MyCampus»: Sora 800 para «ECI» y Sora 400 para «MyCampus», apilado y centrado,
 * en rojo puro, sin pin, con espaciado de -3. Ver `design/identidad` para la configuración completa.
 */
export function Wordmark({ className, background = false }: WordmarkProps) {
  return (
    <span className={cn('relative inline-grid place-items-center font-display tracking-[-0.03em]', className)}>
      {background && (
        <Image
          src="/brand/curva-eci.webp"
          alt=""
          aria-hidden="true"
          width={193}
          height={182}
          className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[90%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-25"
        />
      )}
      {/* El interlineado va en línea: tailwind-merge descarta `leading-*` cuando el tamaño llega con `text-[..]`. */}
      <span className="relative flex flex-col items-center text-center" style={{ lineHeight: 1 }}>
        <span className="font-extrabold text-ink">ECI</span>
        <span className="font-normal text-logo-red">MyCampus</span>
      </span>
    </span>
  );
}
