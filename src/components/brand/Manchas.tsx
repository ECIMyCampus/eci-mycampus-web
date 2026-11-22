import React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';
import { ManchasPose, manchasOutlineClass, manchasSize, manchasSrc } from '../../lib/brand/manchas';

interface ManchasProps {
  pose: ManchasPose;
  /** La altura sale de la clase (por ejemplo `h-28`); el ancho se calcula solo. */
  className?: string;
}

/** Manchas en una pose, como ilustración decorativa: el texto que la acompaña dice lo que importa. */
export function Manchas({ pose, className }: ManchasProps) {
  const { width, height } = manchasSize(pose);
  return (
    <Image
      src={manchasSrc(pose)}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      className={cn('pointer-events-none h-28 w-auto select-none', manchasOutlineClass, className)}
    />
  );
}
