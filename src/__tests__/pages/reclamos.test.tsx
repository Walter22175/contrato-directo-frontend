/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ReclamosPage from '@/app/dashboard/reclamos/page';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Reclamo } from '@/types';

describe('ReclamosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Reclamos')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getAllByText('Todos').length).toBeGreaterThanOrEqual(1);
  });

  it('renders new claim button', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Nuevo Reclamo')).toBeInTheDocument();
  });

  it('renders estado filter buttons', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });
});

describe('ReclamosPage — OE9 detalle, resolución y apelación', () => {
  const resolucion = {
    id_resolucion: 10,
    id_mediacion: 'uuid-m',
    tipo_resolucion: 'reembolso_parcial',
    fundamentos: 'Se ordena reembolso parcial según la evidencia',
    plazo_cumplimiento_dias: 5,
    fecha_emision: '2026-09-10T10:00:00Z',
    estado: 'emitida',
    apelaciones: [],
  };

  const base: Reclamo = {
    id_reclamo: 'uuid-1',
    id_transaccion: 'uuid-tx',
    id_reclamante: 'test-user-id',
    id_reclamado: 'uuid-p',
    tipo_reclamo: 'incumplimiento_servicio',
    descripcion: 'El proveedor no realizó el servicio',
    fecha_incidente: '2026-09-01',
    estado: 'resuelto',
    fecha_apertura: '2026-09-02T10:00:00Z',
    fecha_limite_apelacion: '2099-01-01T00:00:00Z',
    prorroga_solicitada: false,
    mediacion_voluntaria_ofrecida: false,
    documentos: [],
    mediacion: {
      id_mediacion: 'uuid-m',
      id_reclamo: 'uuid-1',
      estado: 'resuelta',
      fecha_asignacion: '2026-09-03T10:00:00Z',
      audiencia_virtual: true,
      prorroga_solicitada: false,
      mediacion_voluntaria_ofrecida: false,
      resolucion,
    },
  };

  const ok = (data: unknown) =>
    Promise.resolve({ data: { statusCode: 200, timestamp: '', data } });

  const mockGet = (detalle: Reclamo) => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/reclamos') return ok({ data: [detalle], meta: { total: 1 } });
      if (url === `/reclamos/${detalle.id_reclamo}`) return ok(detalle);
      return ok({ data: [] });
    });
  };

  const abrirDetalle = async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('El proveedor no realizó el servicio'));
    });
  };

  it('muestra la resolución y permite apelar dentro del plazo', async () => {
    mockGet(base);
    await abrirDetalle();

    expect(screen.getByText('Resolución')).toBeInTheDocument();
    expect(screen.getByText('Reembolso parcial')).toBeInTheDocument();
    expect(screen.getByText('Emitida')).toBeInTheDocument();
    expect(screen.getByText('Apelar Resolución')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Apelar Resolución'));
    });
    const motivo = screen.getByPlaceholderText(/hubo un error en la interpretación/);
    await act(async () => {
      fireEvent.change(motivo, { target: { value: 'No se consideró evidencia relevante' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Enviar Apelación'));
    });

    expect(api.post).toHaveBeenCalledWith('/apelaciones', {
      id_resolucion: 10,
      id_apelante: 'test-user-id',
      motivo: 'No se consideró evidencia relevante',
    });
  });

  it('no ofrece apelar cuando el plazo de 5 días hábiles está vencido', async () => {
    mockGet({ ...base, fecha_limite_apelacion: '2020-01-01T00:00:00Z' });
    await abrirDetalle();

    expect(screen.getByText('Resolución')).toBeInTheDocument();
    expect(screen.queryByText('Apelar Resolución')).not.toBeInTheDocument();
  });

  it('no ofrece apelar a usuarios que no son partes del reclamo', async () => {
    mockGet({ ...base, id_reclamante: 'otro-1', id_reclamado: 'otro-2' });
    await abrirDetalle();

    expect(screen.getByText('Resolución')).toBeInTheDocument();
    expect(screen.queryByText('Apelar Resolución')).not.toBeInTheDocument();
  });

  it('muestra "Iniciar Mediación Formal" al super_admin cuando no hay mediación', async () => {
    const originalImpl = (useAuthStore as unknown as jest.Mock).getMockImplementation();
    (useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
      user: {
        id_usuario: 'admin-id',
        usuario_roles: [{ activo: true, rol: { nombre: 'super_admin' } }],
      },
      isAuthenticated: true,
      isLoading: false,
    }));

    try {
      const enRevision: Reclamo = {
        ...base,
        estado: 'en_revision',
        fecha_limite_apelacion: undefined,
        mediacion: undefined,
      };
      mockGet(enRevision);

      await act(async () => {
        render(<ReclamosPage />);
      });
      await act(async () => {
        fireEvent.click(screen.getByText('El proveedor no realizó el servicio'));
      });

      expect(screen.getByText('Iniciar Mediación Formal')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByText('Iniciar Mediación Formal'));
      });
      const input = screen.getByPlaceholderText('UUID del mediador');
      await act(async () => {
        fireEvent.change(input, { target: { value: 'uuid-mediador' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Iniciar Mediación'));
      });

      expect(api.post).toHaveBeenCalledWith('/reclamos/uuid-1/mediacion', {
        id_mediador: 'uuid-mediador',
      });
    } finally {
      (useAuthStore as unknown as jest.Mock).mockImplementation(originalImpl);
    }
  });
});
