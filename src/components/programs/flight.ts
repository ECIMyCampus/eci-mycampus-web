/** Vuelo de cuadros entre dos vistas: copias flotantes que viajan de su lugar de origen al de destino, ajustando el tamaño. */

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

export interface FlightSource {
  /** Elemento del que se hace la copia (un cuadro del recorrido o la cara frontal de un cuadro del muro). */
  source: HTMLElement;
  from: DOMRect;
}

export interface Flight {
  /** Hace volar cada copia hacia su destino (mismo orden que las fuentes). Se resuelve al aterrizar. */
  run: (targets: (DOMRect | undefined)[], options?: { duration?: number; stagger?: number }) => Promise<void>;
  /** Quita las copias. */
  remove: () => void;
}

const sameRect = (el: HTMLElement, rect: DOMRect) => {
  Object.assign(el.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    transform: 'none',
    flex: 'none',
    pointerEvents: 'none',
    visibility: 'visible',
    borderRadius: '0.8rem',
  });
};

/**
 * Crea las copias justo encima de los cuadros de origen, sin que se note, para que puedan sobrevivir al cambio de vista.
 * Las copias no son interactivas ni las ve un lector de pantalla.
 */
export function prepareFlight(sources: FlightSource[]): Flight {
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none';
  document.body.appendChild(layer);

  const ghosts = sources.map(({ source, from }) => {
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.removeAttribute('data-row-tile');
    ghost.removeAttribute('data-front');
    ghost.querySelectorAll('[data-front],[data-row-tile]').forEach((node) => {
      node.removeAttribute('data-front');
      node.removeAttribute('data-row-tile');
    });
    ghost.setAttribute('inert', '');
    sameRect(ghost, from);
    layer.appendChild(ghost);
    return ghost;
  });

  return {
    run: async (targets, { duration = 850, stagger = 24 } = {}) => {
      const finished: Promise<unknown>[] = [];
      ghosts.forEach((ghost, i) => {
        const to = targets[i];
        const from = sources[i].from;
        if (!to || typeof ghost.animate !== 'function') return;
        const animation = ghost.animate(
          [
            { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` },
            { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` },
          ],
          { duration, delay: i * stagger, easing: EASE, fill: 'forwards' },
        );
        finished.push(animation.finished);
      });
      await Promise.all(finished);
    },
    remove: () => layer.remove(),
  };
}

/** Espera a que la vista nueva esté dibujada; si la pantalla no pinta (pestaña oculta) no se queda esperando. */
export const afterPaint = (): Promise<void> =>
  new Promise((resolve) => {
    const timeout = window.setTimeout(resolve, 120);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.clearTimeout(timeout);
        resolve();
      }),
    );
  });
