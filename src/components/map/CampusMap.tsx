'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';
import { Building2, Check, Copy, Maximize2, Move, Radio, Trophy, TriangleAlert } from 'lucide-react';
import { CAMPUS_CENTER } from '../../lib/map/demo-data';
import {
  CampusMapData,
  CampusPoint,
  PointFilter,
  filterPoints,
  loadCampusMapData,
  sortByActivity,
} from '../../lib/map/map-service';
import { resolveMapboxToken } from '../../lib/map/token';
import { cn } from '../../lib/utils';
import { PointCard } from './PointCard';

type MapView = 'normal' | 'satellite' | '3d';

const VIEWS: { value: MapView; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'satellite', label: 'Satélite' },
  { value: '3d', label: 'Vista 3D' },
];

/** Textos de los controles de Mapbox en español. */
const MAP_LOCALE = {
  'NavigationControl.ZoomIn': 'Acercar',
  'NavigationControl.ZoomOut': 'Alejar',
  'NavigationControl.ResetBearing': 'Orientar al norte',
  'AttributionControl.ToggleAttribution': 'Mostrar créditos del mapa',
  'ScrollZoomBlocker.CtrlMessage': 'Usa Ctrl + la rueda del mouse para acercar el mapa',
  'ScrollZoomBlocker.CmdMessage': 'Usa ⌘ + la rueda del mouse para acercar el mapa',
  'TouchPanBlocker.Message': 'Usa dos dedos para mover el mapa',
};

interface CampusMapProps {
  /** 'full' para la página /mapa; 'preview' para la sección del inicio. */
  variant?: 'full' | 'preview';
  /** Muestra la lista de lugares sincronizada con el mapa. */
  showList?: boolean;
}

/** Un solo estilo para todas las vistas: "Normal" es el mapa oscuro; "Satélite" y "3D" muestran encima la capa satelital. */
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';
const SATELLITE_SOURCE = 'mapbox-satellite';
const SATELLITE_LAYER = 'satellite';
const TERRAIN_SOURCE = 'mapbox-dem';
/** Cada cuánto se vuelven a consultar los eventos del radar. */
const REFRESH_MS = 30_000;

const ICONS: Record<CampusPoint['kind'], string> = {
  EDIFICIO:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
  DEPORTIVO:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
};

const FILTERS: { value: PointFilter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'EDIFICIO', label: 'Edificios' },
  { value: 'DEPORTIVO', label: 'Deportes' },
  { value: 'EN_VIVO', label: 'En vivo' },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function applyView(map: MapboxMap, view: MapView, animate: boolean) {
  if (map.getLayer(SATELLITE_LAYER)) {
    map.setLayoutProperty(SATELLITE_LAYER, 'visibility', view === 'normal' ? 'none' : 'visible');
  }
  map.setTerrain(view === '3d' && map.getSource(TERRAIN_SOURCE) ? { source: TERRAIN_SOURCE, exaggeration: 1.3 } : null);
  const camera = view === '3d' ? { pitch: 60, bearing: -20 } : { pitch: 0, bearing: 0 };
  if (animate && !prefersReducedMotion()) map.easeTo({ ...camera, duration: 800 });
  else map.jumpTo(camera);
}

/** El estilo oscuro de Mapbox trae muy poco contraste: aclara calles, edificios y nombres. */
function tuneDarkStyle(map: MapboxMap) {
  for (const layer of map.getStyle()?.layers ?? []) {
    const sourceLayer = (layer as { 'source-layer'?: string })['source-layer'];
    try {
      if (layer.type === 'background') {
        map.setPaintProperty(layer.id, 'background-color', '#0f172a');
      } else if (layer.type === 'line' && sourceLayer === 'road') {
        map.setPaintProperty(layer.id, 'line-color', '#5b6b86');
      } else if (layer.type === 'fill' && sourceLayer === 'building') {
        map.setPaintProperty(layer.id, 'fill-color', '#3b4a63');
        map.setPaintProperty(layer.id, 'fill-opacity', 1);
        map.setPaintProperty(layer.id, 'fill-outline-color', '#94a3b8');
      } else if (layer.type === 'symbol') {
        map.setPaintProperty(layer.id, 'text-color', '#cbd5e1');
      }
    } catch {
      // Una capa que no admite el ajuste se deja como viene.
    }
  }
}

/** Tabla de coordenadas lista para pegar en demo-data.ts. */
function formatCoordinates(points: CampusPoint[]): string {
  const rows = points.map((p) => `  '${p.code}': [${p.coordinates[0]}, ${p.coordinates[1]}],`);
  return ['export const POINT_COORDINATES: Record<string, [number, number]> = {', ...rows, '};'].join('\n');
}

/** El pin es un botón con nombre accesible; el nombre aparece como mini tarjeta al pasar el mouse. */
function createPinElement(point: CampusPoint): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `campus-pin ${point.kind === 'EDIFICIO' ? 'campus-pin--building' : 'campus-pin--sports'}`;
  const live = point.liveCount > 0 ? ', con actividad en vivo' : '';
  el.setAttribute('aria-label', `${point.name}${live}`);
  el.innerHTML = ICONS[point.kind];

  if (point.liveCount > 0) {
    const dot = document.createElement('span');
    dot.className = 'campus-pin__live';
    el.appendChild(dot);
  } else if (point.events.length > 0) {
    const count = document.createElement('span');
    count.className = 'campus-pin__count';
    count.textContent = String(point.events.length);
    el.appendChild(count);
  }

  const label = document.createElement('span');
  label.className = 'campus-pin__label';
  label.textContent = point.name;
  el.appendChild(label);
  return el;
}

export const CampusMap: React.FC<CampusMapProps> = ({ variant = 'full', showList = false }) => {
  const token = useMemo(() => resolveMapboxToken(), []);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<typeof import('mapbox-gl').default | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; element: HTMLElement }>>(new Map());
  const fittedRef = useRef(false);

  const [data, setData] = useState<CampusMapData | null>(null);
  const [filter, setFilter] = useState<PointFilter>('TODOS');
  const [view, setView] = useState<MapView>('normal');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [tokenRejected, setTokenRejected] = useState(false);

  const viewRef = useRef(view);
  viewRef.current = view;

  // Modo calibración (solo en desarrollo, con ?calibrar en la URL): los pines se arrastran
  // sobre la vista satelital y el mapa entrega las coordenadas para copiarlas.
  const [calibrating, setCalibrating] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, [number, number]>>({});
  const [copied, setCopied] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (new URLSearchParams(window.location.search).has('calibrar')) {
      setCalibrating(true);
      setView('satellite');
    }
  }, []);

  const points = useMemo(
    () => (data?.points ?? []).map((p) => (overrides[p.code] ? { ...p, coordinates: overrides[p.code] } : p)),
    [data, overrides],
  );
  const visiblePoints = useMemo(() => filterPoints(points, filter), [points, filter]);
  const listPoints = useMemo(() => sortByActivity(visiblePoints), [visiblePoints]);
  const selectedPoint = useMemo(() => points.find((p) => p.id === selectedId) ?? null, [points, selectedId]);
  const liveTotal = useMemo(() => points.reduce((sum, p) => sum + p.liveCount, 0), [points]);

  const pointsRef = useRef(points);
  pointsRef.current = points;

  // Datos en tiempo real: se recargan cada 30 s mientras la pestaña esté visible.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (document.hidden) return;
      loadCampusMapData().then((next) => {
        if (!cancelled) setData(next);
      });
    };
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  // Crea el mapa. Mapbox solo funciona en el navegador, por eso se importa aquí.
  useEffect(() => {
    if (!token || !containerRef.current) return;
    let cancelled = false;
    let map: MapboxMap | undefined;
    const markers = markersRef.current;

    import('mapbox-gl').then((mod) => {
      if (cancelled || !containerRef.current) return;
      const mapboxgl = mod.default;
      mapboxRef.current = mapboxgl;
      map = new mapboxgl.Map({
        accessToken: token,
        container: containerRef.current,
        style: MAP_STYLE,
        center: CAMPUS_CENTER,
        zoom: 16.3,
        attributionControl: false,
        locale: MAP_LOCALE,
        // En pantallas táctiles un dedo desplaza la página y dos mueven el mapa.
        cooperativeGestures: window.matchMedia('(pointer: coarse)').matches,
      });
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      // Créditos de Mapbox/OSM plegados tras el botón "i".
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      const created = map;
      created.on('style.load', () => {
        try {
          if (!created.getSource(SATELLITE_SOURCE)) {
            created.addSource(SATELLITE_SOURCE, {
              type: 'raster',
              url: 'mapbox://mapbox.satellite',
              tileSize: 256,
            });
          }
          if (!created.getLayer(SATELLITE_LAYER)) {
            const firstSymbolId = created
              .getStyle?.()
              ?.layers?.find((layer) => layer.type === 'symbol')?.id;
            created.addLayer(
              {
                id: SATELLITE_LAYER,
                type: 'raster',
                source: SATELLITE_SOURCE,
                layout: { visibility: viewRef.current === '3d' ? 'visible' : 'none' },
              },
              firstSymbolId,
            );
          }
          tuneDarkStyle(created);
          // La niebla del estilo oscuro vuelve casi transparentes los pines al inclinar el mapa.
          created.setFog(null);
          if (!created.getSource(TERRAIN_SOURCE)) {
            created.addSource(TERRAIN_SOURCE, {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14,
            });
          }
          applyView(created, viewRef.current, false);
        } catch {
          // Si alguna capa opcional falla, el mapa base y los pines siguen mostrándose.
        }
        mapRef.current = created;
        // Solo en desarrollo: deja el mapa a mano en la consola para inspeccionarlo.
        if (process.env.NODE_ENV !== 'production') {
          (window as unknown as { __campusMap?: MapboxMap }).__campusMap = created;
        }
        setMapReady(true);
      });
      created.once('idle', () => setTilesLoaded(true));
      created.on('error', (event) => {
        const status = (event.error as { status?: number } | undefined)?.status;
        if (status === 401 || status === 403) setTokenRejected(true);
      });
    });

    return () => {
      cancelled = true;
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      map?.remove();
      mapRef.current = null;
      fittedRef.current = false;
      setMapReady(false);
      setTilesLoaded(false);
    };
  }, [token]);

  const fitAll = useCallback(
    (animate: boolean) => {
      const map = mapRef.current;
      if (!map || visiblePoints.length === 0) return;
      const lngs = visiblePoints.map((p) => p.coordinates[0]);
      const lats = visiblePoints.map((p) => p.coordinates[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: map.getContainer().clientWidth < 480 ? 36 : 70, maxZoom: 17.5, duration: animate && !prefersReducedMotion() ? 800 : 0 },
      );
    },
    [visiblePoints],
  );

  // Pines: se vuelven a dibujar cuando cambian los datos o el filtro.
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!mapReady || !map || !mapboxgl) return;
    const markers = markersRef.current;
    markers.forEach(({ marker }) => marker.remove());
    markers.clear();

    for (const point of visiblePoints) {
      const element = createPinElement(point);
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!calibrating) setSelectedId(point.id);
      });
      element.addEventListener('mouseenter', () => setHoveredId(point.id));
      element.addEventListener('mouseleave', () => setHoveredId(null));
      // occludedOpacity: sin esto, en la Vista 3D el relieve deja los pines casi transparentes.
      const marker = new mapboxgl.Marker({ element, anchor: 'center', occludedOpacity: 1, draggable: calibrating })
        .setLngLat(point.coordinates)
        .addTo(map);
      if (calibrating) {
        marker.on('dragend', () => {
          const { lng, lat } = marker.getLngLat();
          setOverrides((prev) => ({ ...prev, [point.code]: [Number(lng.toFixed(5)), Number(lat.toFixed(5))] }));
        });
      }
      markers.set(point.id, { marker, element });
    }

    if (!fittedRef.current && visiblePoints.length > 0) {
      fittedRef.current = true;
      fitAll(false);
    }
  }, [mapReady, visiblePoints, fitAll, calibrating]);

  // Resalta en el mapa el punto elegido o señalado desde la lista.
  useEffect(() => {
    markersRef.current.forEach(({ element }, id) => {
      element.classList.toggle('is-selected', id === selectedId);
      element.classList.toggle('is-hovered', id === hoveredId);
    });
  }, [selectedId, hoveredId, visiblePoints, mapReady]);

  // Centra el mapa en el punto elegido.
  useEffect(() => {
    const map = mapRef.current;
    const point = pointsRef.current.find((p) => p.id === selectedId);
    if (!mapReady || !map || !point) return;
    const target = { center: point.coordinates, zoom: Math.max(map.getZoom(), 17) };
    if (prefersReducedMotion()) map.jumpTo(target);
    else map.flyTo({ ...target, duration: 900 });
  }, [selectedId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (mapReady && map) applyView(map, view, true);
  }, [view, mapReady]);

  // Cierra la tarjeta con Esc.
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  // Si el filtro oculta el punto elegido, se cierra su tarjeta.
  useEffect(() => {
    if (selectedId && data && !visiblePoints.some((p) => p.id === selectedId)) setSelectedId(null);
  }, [visiblePoints, selectedId, data]);

  const height = variant === 'preview' ? 'h-[360px] md:h-[420px]' : 'h-[550px] md:h-[650px]';

  if (!token || tokenRejected) {
    return (
      <div
        role="alert"
        className={cn('flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-center', height)}
      >
        <TriangleAlert className="h-8 w-8 text-amber-400" />
        <h3 className="text-base font-bold text-white">
          {tokenRejected ? 'Mapbox rechazó el token del mapa' : 'Falta el token de Mapbox para mostrar el mapa'}
        </h3>
        <p className="max-w-md text-xs leading-relaxed text-slate-300">
          {tokenRejected
            ? 'Revisa que el token público sea válido y que sus restricciones de URL incluyan este dominio.'
            : 'Crea un token público (empieza por pk.) en tu cuenta de Mapbox y agrégalo en el archivo .env.local como NEXT_PUBLIC_MAPBOX_TOKEN. Luego reinicia el servidor.'}
        </p>
      </div>
    );
  }

  const copyCoordinates = () => {
    navigator.clipboard?.writeText(formatCoordinates(points)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={cn(showList && 'grid gap-4 lg:grid-cols-[1fr_260px]')}>
      <div className="min-w-0 space-y-3">
      <div className={cn('relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0B132B]', height)}>
        <div ref={containerRef} className="h-full w-full" aria-label="Mapa interactivo del campus de la Escuela" />

        {(!tilesLoaded || !data) && (
          <div role="status" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200">
              {!data ? 'Cargando datos del campus…' : 'Cargando mapa…'}
            </span>
          </div>
        )}

        {/* Estado en tiempo real y vista */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-4.5rem)] flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur-md">
            <span className={cn('h-1.5 w-1.5 rounded-full', liveTotal > 0 ? 'campus-live-dot bg-emerald-400' : 'bg-slate-500')} />
            {liveTotal > 0 ? `${liveTotal} en vivo` : 'Sin actividad en vivo'}
            {data?.source === 'demo' && <span className="font-normal text-amber-300">· datos de ejemplo</span>}
          </span>
          <div className="pointer-events-auto inline-flex rounded-full border border-slate-700 bg-slate-900/90 p-0.5 text-[11px] font-semibold backdrop-blur-md" role="group" aria-label="Vista del mapa">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                onClick={() => setView(option.value)}
                aria-pressed={view === option.value}
                className={cn('rounded-full px-3 py-1 transition-colors', view === option.value ? 'bg-eci-red text-white' : 'text-slate-300 hover:text-white')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leyenda y filtro */}
        <div className="absolute bottom-10 left-3 z-20 max-w-[calc(100%-4rem)] rounded-xl border border-slate-700 bg-slate-900/90 p-2 backdrop-blur-md">
          <div className="mb-1.5 flex items-center gap-3 px-1 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-eci-red-light" /> Edificio</span>
            <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-400" /> Deportes</span>
            <span className="inline-flex items-center gap-1"><Radio className="h-3.5 w-3.5 text-emerald-400" /> En vivo</span>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar puntos del mapa">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                  filter === option.value ? 'bg-eci-red text-white' : 'bg-slate-800 text-slate-300 hover:text-white',
                )}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => fitAll(true)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
            >
              <Maximize2 className="h-3 w-3" /> Ver todo
            </button>
          </div>
        </div>

        {selectedPoint && <PointCard point={selectedPoint} onClose={() => setSelectedId(null)} />}
      </div>

      {calibrating && (
        <section className="rounded-2xl border border-amber-500/40 bg-slate-900 p-4" aria-label="Calibración de coordenadas">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <Move className="h-4 w-4" /> Modo calibración
            </h3>
            <button
              onClick={copyCoordinates}
              className="inline-flex items-center gap-1.5 rounded-lg bg-eci-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-eci-red-light"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar coordenadas'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Arrastra cada pin hasta su edificio. Cuando termines, copia la tabla y pégala en
            <code className="mx-1 rounded bg-slate-800 px-1">src/lib/map/demo-data.ts</code>
            en lugar de POINT_COORDINATES. Movidos: {Object.keys(overrides).length} de {points.length}.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-200">{formatCoordinates(points)}</pre>
        </section>
      )}
      </div>

      {showList && (
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[650px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0" aria-label="Lugares del campus">
          {!data && (
            <li role="status" className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              Cargando lugares del campus…
            </li>
          )}
          {listPoints.map((point) => {
            const showThumb = Boolean(point.imageUrl) && !failedThumbnails[point.id];
            return (
              <li key={point.id} className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(point.id)}
                  onMouseEnter={() => setHoveredId(point.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(point.id)}
                  onBlur={() => setHoveredId(null)}
                  className={cn(
                    'flex w-56 items-center gap-3 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 lg:w-full',
                    point.id === selectedId ? 'border-eci-red-light bg-slate-900' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700',
                  )}
                >
                  {showThumb && point.imageUrl ? (
                    <img
                      src={point.imageUrl}
                      alt=""
                      loading="lazy"
                      onError={() => setFailedThumbnails((prev) => ({ ...prev, [point.id]: true }))}
                      className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', point.kind === 'EDIFICIO' ? 'bg-eci-red/20 text-eci-red-light' : 'bg-amber-500/15 text-amber-400')}>
                      {point.kind === 'EDIFICIO' ? <Building2 className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-100">{point.name}</span>
                    <span className={cn('block text-[11px]', point.liveCount > 0 ? 'text-emerald-400' : 'text-slate-300')}>
                      {point.liveCount > 0
                        ? `${point.liveCount} en vivo`
                        : point.events.length > 0
                          ? `${point.events.length} ${point.events.length === 1 ? 'próxima' : 'próximas'}`
                          : 'Sin actividades'}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {data && listPoints.length === 0 && (
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              No hay lugares para este filtro.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
