import { Manchas } from '../components/brand/Manchas';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Card';

export const metadata = { title: 'Página no encontrada | ECI-MyCampus' };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="sr-only">Página no encontrada</h1>
      <EmptyState
        icon={<Manchas pose="sin-resultados" className="h-32" />}
        title="No encontramos esta página"
        description="El enlace puede estar incompleto o la página ya no existe."
        action={
          <Button href="/" size="sm">
            Ir al radar
          </Button>
        }
      />
    </div>
  );
}
