// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Badge, Chip } from './Chip';
import { EmptyState } from './Card';

afterEach(cleanup);

describe('componentes base', () => {
  it('Button es un botón que responde al clic y no envía formularios por accidente', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Inscribirme</Button>);

    const button = screen.getByRole('button', { name: 'Inscribirme' });
    fireEvent.click(button);

    expect(button.getAttribute('type')).toBe('button');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Button con href se renderiza como enlace', () => {
    render(<Button href="/mapa">Abrir mapa</Button>);

    expect(screen.getByRole('link', { name: 'Abrir mapa' }).getAttribute('href')).toBe('/mapa');
  });

  it('Button deshabilitado no dispara el clic', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Aforo lleno
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Aforo lleno' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('Chip anuncia si está elegido', () => {
    render(
      <>
        <Chip selected>Todos</Chip>
        <Chip>Deportivo</Chip>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Todos' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Deportivo' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('Chip con href navega y marca la opción actual', () => {
    render(
      <Chip href="/?categoria=DEPORTIVO" selected>
        Deportivo
      </Chip>,
    );

    const link = screen.getByRole('link', { name: 'Deportivo' });
    expect(link.getAttribute('href')).toBe('/?categoria=DEPORTIVO');
    expect(link.getAttribute('aria-current')).toBe('true');
  });

  it('Badge muestra su contenido', () => {
    render(<Badge tone="live">En vivo</Badge>);

    expect(screen.getByText('En vivo')).toBeTruthy();
  });

  it('EmptyState explica el estado y ofrece una acción', () => {
    render(
      <EmptyState
        role="alert"
        title="No pudimos cargar las actividades"
        description="Revisa tu conexión."
        action={<Button>Reintentar</Button>}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain('No pudimos cargar las actividades');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
