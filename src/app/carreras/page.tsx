import { ProgramWall } from '../../components/programs/ProgramWall';

export const metadata = { title: 'Carreras | ECI-MyCampus' };

export default function Page() {
  return (
    // El muro se abre hacia los lados mientras se voltea: se recorta en el borde de la pantalla, no en el del contenido.
    <div className="overflow-x-clip">
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
        Conoce nuestras carreras
      </h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
        Trece programas de pregrado, cada uno con su color. Toca un cuadro para conocer el programa.
      </p>
      <div className="mt-8">
        <ProgramWall />
      </div>
    </div>
    </div>
  );
}
