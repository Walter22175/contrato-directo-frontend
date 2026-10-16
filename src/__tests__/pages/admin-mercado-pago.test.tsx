/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import api from '@/lib/api';
import MercadoPagoAdminPage from '@/app/dashboard/admin/mercado-pago/page';

const metricasMock = {
  generado_en: '2026-10-14T15:00:00Z',
  cuentas: {
    total: 10,
    conectadas: 6,
    habilitadas_marketplace: 4,
    token_invalido: 1,
  },
  pagos: {
    por_mp_status: { authorized: 3, captured: 5, cancelled: 1 },
    capturados: 5,
    cancelados: 1,
    capturas_solicitadas: 2,
    auto_capturas_disparadas: 1,
  },
  fallas_token: {
    ultimas_24h: 0,
    ultimos_30d: 2,
    por_tipo: { capture: 1, cancel: 1 },
  },
  alertas: {
    token_invalido: [
      {
        id_usuario: 'u1',
        mp_user_id: 'mp-1',
        email: 'prov1@example.com',
        nombre: 'Ana Paz',
        marketplace_habilitado: true,
      },
    ],
    sin_refresh_token: [
      {
        id_usuario: 'u2',
        mp_user_id: 'mp-2',
        email: 'prov2@example.com',
        nombre: 'Luis Gómez',
        marketplace_habilitado: false,
      },
    ],
    habilitado_token_roto: [
      {
        id_usuario: 'u1',
        mp_user_id: 'mp-1',
        email: 'prov1@example.com',
        nombre: 'Ana Paz',
        marketplace_habilitado: true,
      },
    ],
  },
};

const mockearMetricas = (metricas: unknown = metricasMock) => {
  (api.get as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      data: { statusCode: 200, timestamp: '', data: metricas },
    }),
  );
};

describe('MercadoPagoAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockearMetricas();
  });

  it('muestra las secciones del panel y las métricas de cuentas', async () => {
    await act(async () => {
      render(<MercadoPagoAdminPage />);
    });

    expect(
      screen.getByText('Mercado Pago — Marketplace'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cuentas')).toBeInTheDocument();
    expect(screen.getByText('Pagos')).toBeInTheDocument();
    expect(screen.getByText('Fallas de token')).toBeInTheDocument();
    expect(screen.getByText('Alertas de cuentas')).toBeInTheDocument();
    expect(screen.getByText('Distribución')).toBeInTheDocument();
    expect(screen.getAllByText('Conectadas').length).toBeGreaterThan(0);
    expect(screen.getByText('Habilitadas marketplace')).toBeInTheDocument();
    expect(screen.getByText('Con token inválido')).toBeInTheDocument();
  });

  it('marca la salud como crítica cuando hay cuentas con token inválido', async () => {
    await act(async () => {
      render(<MercadoPagoAdminPage />);
    });

    expect(screen.getByText(/problemas? crítico/)).toBeInTheDocument();
  });

  it('muestra los pagos por estado y los KPIs de capturas', async () => {
    await act(async () => {
      render(<MercadoPagoAdminPage />);
    });

    expect(screen.getByText('Por estado (mp_status)')).toBeInTheDocument();
    expect(screen.getByText('Capturados')).toBeInTheDocument();
    expect(screen.getByText('Cancelados')).toBeInTheDocument();
    expect(screen.getByText('Capturas solicitadas')).toBeInTheDocument();
    expect(screen.getByText('Auto-capturas')).toBeInTheDocument();
    expect(screen.getByText('Autorizado')).toBeInTheDocument();
    expect(screen.getByText('Capturado')).toBeInTheDocument();
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('muestra las fallas de token y el detalle por tipo', async () => {
    await act(async () => {
      render(<MercadoPagoAdminPage />);
    });

    expect(screen.getByText('Últimas 24 h')).toBeInTheDocument();
    expect(screen.getByText('Últimos 30 días')).toBeInTheDocument();
    expect(screen.getByText('Por tipo (30 días)')).toBeInTheDocument();
    expect(screen.getByText('Capturas')).toBeInTheDocument();
    expect(screen.getByText('Cancelaciones')).toBeInTheDocument();
  });

  it('lista las cuentas de las alertas con su email y estado', async () => {
    await act(async () => {
      render(<MercadoPagoAdminPage />);
    });

    expect(screen.getAllByText('prov1@example.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Habilitada').length).toBeGreaterThan(0);
    expect(screen.getByText('Token inválido')).toBeInTheDocument();
    expect(screen.getByText('Sin refresh token')).toBeInTheDocument();
    expect(
      screen.getByText('Habilitadas con token roto'),
    ).toBeInTheDocument();
  });

  it('aplica el rango de fechas y vuelve a pedir las métricas con desde/hasta', async () => {
    await act(async () => {
      render(<MercadoPagoAdminPage />);
    });

    fireEvent.change(screen.getByLabelText('Fallas de token desde'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText('hasta'), {
      target: { value: '2026-10-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: /aplicar rango/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/pagos/mercadopago/metricas', {
        params: {
          desde: '2026-10-01T00:00:00.000Z',
          hasta: '2026-10-15T23:59:59.999Z',
        },
      });
    });
  });

  it('muestra la sección de rango cuando el backend devuelve fallas_token.rango', async () => {
    mockearMetricas({
      ...metricasMock,
      fallas_token: {
        ...metricasMock.fallas_token,
        rango: {
          desde: '2026-10-01T00:00:00.000Z',
          hasta: '2026-10-15T23:59:59.999Z',
          total: 3,
          por_tipo: { capture: 3 },
        },
      },
    });
    await act(async () => {
      render(<MercadoPagoAdminPage />);
    });

    expect(screen.getByText('Rango seleccionado')).toBeInTheDocument();
    expect(screen.getByText('3 fallas')).toBeInTheDocument();
  });
});
