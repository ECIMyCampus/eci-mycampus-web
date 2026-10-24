export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-900/40 bg-red-950/30 px-4 py-1.5 text-xs text-red-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Radar Campus ECI en Vivo
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-neutral-50">
          ECI-<span className="text-red-600">MyCampus</span>
        </h1>
        
        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
          Plataforma comunitaria de la Escuela Colombiana de Ingeniería Julio Garavito.
          Descubre charlas, torneos deportivos, eventos en vivo y explora el mapa interactivo del campus.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href="/mapa"
            className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-950/50 hover:bg-red-600 transition"
          >
            Explorar Mapa
          </a>
          <a
            href="/eventos"
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 transition"
          >
            Ver Eventos
          </a>
        </div>
      </div>
    </main>
  );
}
