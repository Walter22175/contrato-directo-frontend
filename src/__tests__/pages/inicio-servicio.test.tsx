/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import api from '@/lib/api';
import { obtenerDashboardMercadoPago } from '@/lib/mercadopago';
import InicioServicioPage from '@/app/dashboard/inicio-servicio/page';

jest.mock('@/lib/mercadopago', () => ({
  obtenerDashboardMercadoPago: jest.fn(() =>
    Promise.resolve({
      generado_en: '2026-10-17T10:00:00Z',
      pagos_en_curso: {
        autorizados: 2,
        retenidos: 1,
        capturados: 3,
        cancelados: 0,
        auto_capturas_programadas: 1,
      },
      retenciones: [],
      alertas: [],
    }),
  ),
}));

const txBase = (overrides: Record<string, unknown> = {}) => ({
  id_transaccion: 'tx-1',
  id_cliente: 'cliente-1',
  id_proveedor: 'test-user-id',
  id_servicio: 1,
  descripcion: 'Trabajo de electricidad',
  monto_acordado: 1000,
  moneda: 'ARS',
  comision_porcentaje: 8,
  comision_monto: 80,
  estado: 'en_custodia',
  tipo_transaccion: 'servicio',
  fecha_creacion: '2026-10-01T10:00:00Z',
  servicio: { nombre: 'Electricidad' },
  fecha_fin_servicio: null,
  fecha_conformidad: null,
  fondos_retenidos: false,
  fecha_inicio_servicio_cliente: null,
  fecha_inicio_servicio_proveedor: null,
  fecha_inicio_servicio_at: null,
  fecha_liberacion_anticipada_at: null,
  fecha_fin_estimada: '2026-10-25T10:00:00Z',
  ...overrides,
});

const mockearLista = (lista: unknown[]) => {
  (api.get as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      data: { statusCode: 200, timestamp: '', data: lista },
    }),
  );
};

describe('InicioServicioPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockearLista([]);
  });

  it('renderiza el título y el link a condiciones legales', async () => {
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      screen.getByRole('heading', {
        name: /inicio del servicio y anticipo del 30%/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /condiciones legales/i }),
    ).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay servicios en curso', async () => {
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      screen.getByText(/no tenés servicios en curso/i),
    ).toBeInTheDocument();
  });

  it('ofrece notificar el comienzo cuando nadie notificó', async () => {
    mockearLista([txBase()]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      screen.getByText('Pendiente de notificar'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /notificar comienzo del servicio/i }),
    ).toBeInTheDocument();
  });

  it('muestra el botón activo cuando el cliente ya notificó y el proveedor no', async () => {
    mockearLista([
      txBase({ fecha_inicio_servicio_cliente: '2026-10-15T12:00:00Z' }),
    ]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      screen.getByText('Notificado por el cliente'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /notificar comienzo del servicio/i }),
    ).toBeInTheDocument();
  });

  it('oculta el botón y avisa si el proveedor ya notificó', async () => {
    mockearLista([
      txBase({ fecha_inicio_servicio_proveedor: '2026-10-15T12:00:00Z' }),
    ]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(screen.getByText('Notificado por vos')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /notificar comienzo del servicio/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/ya notificaste el comienzo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/falta que el cliente confirme el inicio/i),
    ).toBeInTheDocument();
  });

  it('muestra fechas y mensaje cuando ambos confirmaron el inicio', async () => {
    mockearLista([
      txBase({
        fecha_inicio_servicio_cliente: '2026-10-15T12:00:00Z',
        fecha_inicio_servicio_proveedor: '2026-10-15T14:00:00Z',
        fecha_inicio_servicio_at: '2026-10-15T14:00:00Z',
      }),
    ]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      screen.getByText('Ambos confirmaron el inicio'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el 30% se liberará automáticamente en horario bancario hábil/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el anticipo se liberará en horario bancario hábil/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /notificar comienzo del servicio/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra bruto, comisión y neto del anticipo', async () => {
    mockearLista([txBase()]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(screen.getByText('Bruto (30%)')).toBeInTheDocument();
    expect(screen.getByText('Comisión (8%)')).toBeInTheDocument();
    expect(screen.getByText('Neto (27,6%)')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('indica que no hay anticipo en servicios de menos de 3 días', async () => {
    mockearLista([
      txBase({
        fecha_fin_estimada: '2026-10-03T10:00:00Z',
      }),
    ]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      screen.getByText(/no corresponde anticipo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el servicio dura menos de 3 días: no hay anticipo/i),
    ).toBeInTheDocument();
    expect(screen.getByText('No aplica a este servicio')).toBeInTheDocument();
  });

  it('muestra el anticipo como liberado cuando ya se liberó', async () => {
    mockearLista([
      txBase({
        fecha_inicio_servicio_cliente: '2026-10-15T12:00:00Z',
        fecha_inicio_servicio_proveedor: '2026-10-15T14:00:00Z',
        fecha_inicio_servicio_at: '2026-10-15T14:00:00Z',
        fecha_liberacion_anticipada_at: '2026-10-18T15:00:00Z',
      }),
    ]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      screen.getByText(/anticipo liberado el/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el anticipo ya fue liberado/i),
    ).toBeInTheDocument();
  });

  it('muestra los pagos en curso y el link al panel de Mercado Pago', async () => {
    await act(async () => {
      render(<InicioServicioPage />);
    });
    expect(
      await screen.findByText('Pagos en curso'),
    ).toBeInTheDocument();
    expect(screen.getByText('Autorizados')).toBeInTheDocument();
    expect(screen.getByText('Auto-capturas')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ver detalle en mercado pago/i }),
    ).toBeInTheDocument();
    expect(obtenerDashboardMercadoPago).toHaveBeenCalledWith('test-user-id');
  });

  it('puede notificar el comienzo hacia el backend', async () => {
    mockearLista([txBase()]);
    await act(async () => {
      render(<InicioServicioPage />);
    });
    fireEvent.click(
      screen.getByRole('button', { name: /notificar comienzo del servicio/i }),
    );
    await act(async () => {
      expect(api.post).toHaveBeenCalledWith('/transacciones/tx-1/inicio-servicio');
    });
  });
});
