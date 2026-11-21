import React from 'react';
import Image from 'next/image';

/**
 * Manchas asoma por detrás del botón de Microsoft, apoyado en su borde. Al pasar el cursor o enfocar
 * el botón se asoma más; al pulsarlo se agacha. Es solo decoración: no recibe clics ni lo lee el lector
 * de pantalla. Con «reducir movimiento» no se anima.
 */
export function ManchasPeek({ children }: { children: React.ReactNode }) {
  return (
    <div className="group/ms relative pt-[104px]">
      <Image
        src="/brand/manchas/cabeza.webp"
        alt=""
        aria-hidden="true"
        width={412}
        height={512}
        priority
        className="pointer-events-none absolute right-8 top-0 h-[136px] w-auto select-none transition-transform duration-300 ease-out motion-reduce:transition-none group-hover/ms:-translate-y-3 group-focus-within/ms:-translate-y-3 group-active/ms:translate-y-3"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
