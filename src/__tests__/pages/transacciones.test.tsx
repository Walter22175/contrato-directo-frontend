/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import api from '@/lib/api';
import TransaccionesPage from '@/app/dashboard/transacciones/page';

const txBase = (overrides: Record<string, unknown> = {}) => ({
  id_transaccion: 'tx-1',
  id_cliente: 'test-user-id',
  id_proveedor: 'prov-1',
  id_servicio: 1,
  descripcion: 'Trabajo de plomería',
  monto_acordado: 1000,
  moneda: 'ARS',
  comision_porcentaje: 8,
  comision_monto: 80,
  estado: 'en_custodia',
  tipo_transaccion: 'servicio',
  fecha_creacion: '2026-10-01T10:00:00Z',
  cliente: { id_usuario: 'test-user-id' },
  proveedor: { id_usuario: 'prov-1' },
  servicio: { nombre: 'Plomería' },
  fecha_fin_servicio: null,
  fecha_conformidad: null,
  fondos_retenidos: false,
  fecha_inicio_servicio_cliente: null,
  fecha_inicio_servicio_proveedor: null,
  fecha_inicio_servicio_at: null,
  fecha_liberacion_anticipada_at: null,
  fecha_fin_estimada: '2026-10-20T10:00:00Z',
  ...overrides,
});

const mockearLista = (lista: unknown[]) => {
  (api.get as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      data: { statusCode: 200, timestamp: '', data: lista },
    }),
  );
};

describe('TransaccionesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockearLista([]);
  });

  it('renders the page title', async () => {
    await act(async () => {
      render(<TransaccionesPage />);
    });
    expect(screen.getByText('Mis Transacciones')).toBeInTheDocument();
  });

  it('renders filter buttons', async () => {
    await act(async () => {
      render(<TransaccionesPage />);
    });
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
    expect(screen.getByText('completada')).toBeInTheDocument();
  });

  it('shows empty state initially', async () => {
    await act(async () => {
      render(<TransaccionesPage />);
    });
    expect(screen.getByText('Sin transacciones')).toBeInTheDocument();
  });

  it('ofrece notificar el comienzo del servicio al cliente en custodia', async () => {
    mockearLista([txBase()]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    expect(
      screen.getByRole('button', { name: /notificar comienzo del servicio/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/¿cómo funciona el comienzo del servicio\?/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /saber más/i }),
    ).toBeInTheDocument();
  });

  it('no muestra el banner informativo sin transacciones en custodia', async () => {
    mockearLista([]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    expect(
      screen.queryByText(/¿cómo funciona el comienzo del servicio\?/i),
    ).not.toBeInTheDocument();
  });

  it('muestra espera de la otra parte cuando el cliente ya notificó el inicio', async () => {
    mockearLista([
      txBase({
        fecha_inicio_servicio_cliente: '2026-10-15T12:00:00Z',
      }),
    ]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    expect(
      screen.getByText(/comienzo notificado — esperando la confirmación/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /notificar comienzo/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra la liberación anticipada del 30% cuando el inicio está confirmado', async () => {
    mockearLista([
      txBase({
        fecha_inicio_servicio_cliente: '2026-10-15T12:00:00Z',
        fecha_inicio_servicio_proveedor: '2026-10-15T14:00:00Z',
        fecha_inicio_servicio_at: '2026-10-15T14:00:00Z',
      }),
    ]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    expect(
      screen.getByText(/servicio iniciado el/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el 30% se liberará el/i),
    ).toBeInTheDocument();
  });

  it('puede enviar la notificación de comienzo al backend', async () => {
    mockearLista([txBase()]);
    (api.post as jest.Mock).mockResolvedValue({ data: {} });
    await act(async () => {
      render(<TransaccionesPage />);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /notificar comienzo del servicio/i }),
    );

    await act(async () => {
      expect(api.post).toHaveBeenCalledWith(
        '/transacciones/tx-1/inicio-servicio',
        undefined,
      );
    });
  });

  it('muestra el modal de bienvenida del comienzo al detectar custodia', async () => {
    mockearLista([txBase()]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    expect(
      screen.getByText(/el nuevo flujo del comienzo del servicio ya está activo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /entendido/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ver la ayuda completa/i }),
    ).toHaveAttribute('href', '/ayuda/comienzo-del-servicio');
  });

  it('no repite el modal de bienvenida una vez cerrado', async () => {
    mockearLista([txBase()]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    fireEvent.click(screen.getByRole('button', { name: /entendido/i }));

    expect(
      screen.queryByText(/el nuevo flujo del comienzo del servicio ya está activo/i),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem('cd_modal_comienzo_visto')).toBe('1');
  });

  it('no muestra el modal sin transacciones en custodia', async () => {
    mockearLista([]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    expect(
      screen.queryByText(/el nuevo flujo del comienzo del servicio ya está activo/i),
    ).not.toBeInTheDocument();
  });

  it('muestra el tooltip de liberación junto al botón de comienzo', async () => {
    mockearLista([txBase()]);
    await act(async () => {
      render(<TransaccionesPage />);
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Ambas partes deben notificar. El 30% se libera a las 72 h calendario.',
    );
  });
});
