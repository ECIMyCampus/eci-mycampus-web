import React from 'react';
import { CampusMap } from '../../components/map/CampusMap';

export const metadata = { title: 'Mapa del campus | ECI-MyCampus' };

export default function MapaPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Mapa del campus</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Toca un punto para ver el lugar y lo que está pasando allí ahora mismo.
          <span className="md:hidden"> En el celular, mueve el mapa con dos dedos.</span>
        </p>
      </header>

      <CampusMap showList />
    </div>
  );
}
