'use client';

import React, { useEffect, useState } from 'react';
import { pickGreeting } from '../../lib/brand/manchas';

/**
 * Globo de Manchas con un saludo elegido al azar. Se elige al montar, en el navegador, para que servidor y cliente
 * no discrepen; el saludo solo cambia al recargar la página.
 */
export function ManchasBubble({ className }: { className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(pickGreeting());
  }, []);

  if (!text) return null;
  return <p className={className}>{text}</p>;
}
