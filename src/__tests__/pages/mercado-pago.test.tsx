/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import api from '@/lib/api';
import MercadoPagoPage from '@/app/dashboard/mercado-pago/page';

const estadoConectado = {
  conectado: true,
  mp_user_id: '987654',
  mp_scopes: 'read write',
  mp_token_expires_at: '2099-01-01T00:00:00Z',
  marketplace_habilitado: true,
  token_valido: true,
  ultimo_error_token: null,
};

const dashboardOk = {
  generado_en: '2026-10-14T15:00:00Z',
  pagos_en_curso: {
    autorizados: 2,
    retenidos: 1,
    capturados: 5,
    cancelados: 0,
    auto_capturas_programadas: 1,
  },
  retenciones: [
    {
      id_pago: 'p1',
      monto: 15000,
      mp_status: 'authorized',
      entrega_proveedor_at: '2026-10-13T13:00:00Z',
      liberacion_estimada: '2026-10-16T13:00:00Z',
      minutos_habiles_restantes: 600,
      estado_cron: 'en_plazo',
    },
  ],
  alertas: [],
};

const mockear = (
  estado: unknown,
  dashboard: unknown = dashboardOk,
) => {
  (api.get as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/mercadopago/dashboard')) {
      return Promise.resolve({
        data: { statusCode: 200, timestamp: '', data: dashboard },
      });
    }
    return Promise.resolve({
      data: { statusCode: 200, timestamp: '', data: estado },
    });
  });
};

describe('MercadoPagoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el semáforo verde y el estado de conexión', async () => {
    mockear(estadoConectado);
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(screen.getByText('Mercado Pago')).toBeInTheDocument();
    expect(screen.getByText('Todo operativo')).toBeInTheDocument();
    expect(screen.getByText('Conectada')).toBeInTheDocument();
    expect(screen.getAllByText(/987654/).length).toBeGreaterThan(0);
    expect(screen.getByText('Habilitado')).toBeInTheDocument();
    expect(screen.getByText('Operativo')).toBeInTheDocument();
  });

  it('muestra la conexión activa sin botón cuando todo está OK', async () => {
    mockear(estadoConectado);
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(
      screen.getByText(/Conexión activa — el token se renueva solo/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /conectar mercado pago/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra semáforo ámbar cuando no está habilitado el marketplace', async () => {
    mockear(
      { ...estadoConectado, marketplace_habilitado: false },
      {
        ...dashboardOk,
        alertas: [
          {
            tipo: 'marketplace_deshabilitado',
            mensaje:
              'Tu cuenta está conectada pero el cobro directo aún no está habilitado: los pagos se abonan desde la cuenta de la plataforma.',
          },
        ],
      },
    );
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(
      screen.getByText('Conectada — cobro directo pendiente'),
    ).toBeInTheDocument();
    expect(screen.getByText('Pendiente de habilitar')).toBeInTheDocument();
    expect(
      screen.getByText(/cobro directo aún no está habilitado/),
    ).toBeInTheDocument();
  });

  it('muestra semáforo rojo, alerta de token y botón de reconectar', async () => {
    mockear(
      {
        ...estadoConectado,
        token_valido: false,
        ultimo_error_token: 'invalid_token',
      },
      {
        ...dashboardOk,
        alertas: [
          {
            tipo: 'token_invalido',
            mensaje:
              'Tu conexión con Mercado Pago tiene problemas (invalid_token). Volvé a conectar tu cuenta.',
          },
        ],
      },
    );
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(screen.getByText('Requiere atención')).toBeInTheDocument();
    expect(screen.getByText('Con problemas')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reconectar con mercado pago/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Volvé a conectar tu cuenta/),
    ).toBeInTheDocument();
  });

  it('muestra los contadores de pagos en curso', async () => {
    mockear(estadoConectado);
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(screen.getByText('Pagos en curso')).toBeInTheDocument();
    expect(screen.getByText('Autorizados')).toBeInTheDocument();
    expect(screen.getByText('Retenidos')).toBeInTheDocument();
    expect(screen.getByText('Capturados')).toBeInTheDocument();
    expect(screen.getByText('Cancelados')).toBeInTheDocument();
    expect(screen.getByText('Auto-capturas')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('muestra las retenciones con tiempo hábil restante y estado del cron', async () => {
    mockear(estadoConectado);
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(
      screen.getByText('Retenciones y liberaciones'),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$\s?15\.000/)).toBeInTheDocument();
    expect(screen.getByText(/10 h 0 min/)).toBeInTheDocument();
    expect(screen.getByText('En plazo')).toBeInTheDocument();
  });

  it('muestra las secciones informativas', async () => {
    mockear(estadoConectado);
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(
      screen.getByText('¿Qué permisos estás otorgando?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('¿Por qué es necesario conectarla?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('¿Qué pasa si no conecto mi cuenta?'),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/72 horas hábiles/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/No accedemos a tu saldo/),
    ).toBeInTheDocument();
  });

  it('muestra estado no conectada con botón de conectar', async () => {
    mockear({
      conectado: false,
      mp_user_id: null,
      mp_scopes: null,
      mp_token_expires_at: null,
      marketplace_habilitado: false,
      token_valido: null,
      ultimo_error_token: null,
    });
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(screen.getAllByText('No conectada').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /conectar mercado pago/i }),
    ).toBeInTheDocument();
  });
});
