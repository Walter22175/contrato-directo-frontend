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

describe('MediacionPage — emitir resolución', () => {
  const base: Mediacion = {
    id_mediacion: 'uuid-m',
    id_reclamo: 'uuid-r',
    id_mediador: 'uuid-med',
    estado: 'en_analisis',
    fecha_asignacion: '2026-09-03T10:00:00Z',
    audiencia_virtual: true,
    prorroga_solicitada: false,
    mediacion_voluntaria_ofrecida: false,
    reclamo: { id_reclamo: 'uuid-r' } as Mediacion['reclamo'],
  };

  const ok = (data: unknown) =>
    Promise.resolve({ data: { statusCode: 200, timestamp: '', data } });

  const mockGet = (mediacion: Mediacion) => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/mediacion') return ok({ data: [mediacion], meta: { total: 1 } });
      if (url === `/mediacion/${mediacion.id_mediacion}`) return ok(mediacion);
      return ok({ data: [] });
    });
  };

  const abrirDetalle = async () => {
    await act(async () => {
      render(<MediacionPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Mediación #uuid-m'));
    });
  };

  it('permite emitir la resolución con tipo, fundamentos y plazo de cumplimiento', async () => {
    mockGet(base);
    await abrirDetalle();

    expect(screen.getByText('Emitir Resolución')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Emitir Resolución'));
    });

    const select = screen.getByDisplayValue('Seleccionar...');
    await act(async () => {
      fireEvent.change(select, { target: { value: 'reembolso_parcial' } });
    });
    const fundamentos = screen.getByPlaceholderText('Fundamentación de la resolución...');
    await act(async () => {
      fireEvent.change(fundamentos, { target: { value: 'Se ordena reembolso parcial' } });
    });

    const submit = screen
      .getAllByRole('button', { name: 'Emitir Resolución' })
      .find((b) => b.getAttribute('type') === 'submit');
    expect(submit).toBeDefined();
    await act(async () => {
      fireEvent.click(submit!);
    });

    expect(api.patch).toHaveBeenCalledWith('/reclamos/mediacion/uuid-m/resolver', {
      tipo_resolucion: 'reembolso_parcial',
      fundamentos: 'Se ordena reembolso parcial',
      plazo_cumplimiento_dias: 5,
    });
    expect(screen.getByText('Resolución emitida correctamente')).toBeInTheDocument();
  });

  it('no ofrece emitir resolución cuando la mediación está recién asignada', async () => {
    mockGet({ ...base, estado: 'asignada' });
    await abrirDetalle();

    expect(screen.queryByText('Emitir Resolución')).not.toBeInTheDocument();
  });
});
