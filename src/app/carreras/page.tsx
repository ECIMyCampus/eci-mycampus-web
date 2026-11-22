import { CampusGlitch } from '../../components/brand/CampusGlitch';
import { LivingBackground } from '../../components/brand/LivingBackground';
import { ProgramsExplorer } from '../../components/programs/ProgramsExplorer';

export const metadata = { title: 'Carreras | ECI-MyCampus' };

export default function Page() {
  return (
    // Las filas y el muro se abren hacia los lados al moverse: se recortan en el borde de la pantalla, no en el del contenido.
    <div className="overflow-x-clip">
      <LivingBackground />
      <CampusGlitch />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          Conoce nuestras carreras
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
          Trece programas de pregrado, cada uno con su color. Míralos pasar o ábrelos todos juntos.
        </p>
      </div>
      {/* Las filas llegan de borde a borde de la pantalla; el muro se centra por su cuenta. */}
      <div className="mt-6 pb-16">
        <ProgramsExplorer />
      </div>
    </div>
  );
}
