/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import MediacionPage from '@/app/dashboard/mediacion/page';
import api from '@/lib/api';
import type { Mediacion } from '@/types';

describe('MediacionPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<MediacionPage />);
    });
    expect(screen.getByText('Mediación')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<MediacionPage />);
    });
    expect(screen.getByText('En Proceso')).toBeInTheDocument();
    expect(screen.getByText('Resueltas')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
  });
});

describe('MediacionPage — estado de la resolución', () => {
  const mediacion: Mediacion = {
    id_mediacion: 'uuid-m',
    id_reclamo: 'uuid-r',
    id_mediador: 'uuid-med',
    estado: 'resuelta',
    fecha_asignacion: '2026-09-03T10:00:00Z',
    audiencia_virtual: true,
    prorroga_solicitada: false,
    mediacion_voluntaria_ofrecida: false,
    reclamo: { id_reclamo: 'uuid-r' } as Mediacion['reclamo'],
    resolucion: {
      id_resolucion: 10,
      id_mediacion: 'uuid-m',
      tipo_resolucion: 'desestimacion',
      fundamentos: 'Evidencia insuficiente',
      plazo_cumplimiento_dias: 5,
      fecha_emision: '2026-09-10T10:00:00Z',
      estado: 'firme',
    },
  };

  const ok = (data: unknown) =>
    Promise.resolve({ data: { statusCode: 200, timestamp: '', data } });

  it('muestra la resolución como firme tras resolver la apelación', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/mediacion') return ok({ data: [mediacion], meta: { total: 1 } });
      if (url === '/mediacion/uuid-m') return ok(mediacion);
      return ok({ data: [] });
    });

    await act(async () => {
      render(<MediacionPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Resueltas'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Mediación #uuid-m'));
    });

    expect(screen.getByText('Resolución')).toBeInTheDocument();
    expect(screen.getByText('Firme e inapelable')).toBeInTheDocument();
    expect(screen.getByText('Desestimación del reclamo')).toBeInTheDocument();
  });
});
