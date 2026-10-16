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

describe('MercadoPagoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: estadoConectado },
    });
  });

  it('muestra el título y el estado de conexión', async () => {
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(screen.getByText('Mercado Pago')).toBeInTheDocument();
    expect(screen.getByText('Conectada')).toBeInTheDocument();
    expect(screen.getAllByText(/987654/).length).toBeGreaterThan(0);
    expect(screen.getByText('Cobro directo activo')).toBeInTheDocument();
  });

  it('muestra el botón de reconectar y el estado del token', async () => {
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(
      screen.getByRole('button', { name: /volver a conectar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Token operativo')).toBeInTheDocument();
  });

  it('muestra el texto principal de onboarding y las secciones informativas', async () => {
    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(
      screen.getByText(/podés revocar el acceso cuando quieras/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('¿Qué permisos estás otorgando?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('¿Por qué es necesario conectarla?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('¿Qué pasa si no conecto mi cuenta?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/72 horas hábiles/)).toBeInTheDocument();
    expect(
      screen.getByText(/No accedemos a tu saldo/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/modo de cobro directo \(marketplace\) queda deshabilitado/),
    ).toBeInTheDocument();
  });

  it('muestra estado no conectada con botón de conectar', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '',
        data: {
          conectado: false,
          mp_user_id: null,
          mp_scopes: null,
          mp_token_expires_at: null,
          marketplace_habilitado: false,
          token_valido: null,
          ultimo_error_token: null,
        },
      },
    });

    await act(async () => {
      render(<MercadoPagoPage />);
    });

    expect(screen.getByText('No conectada')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /conectar con mercado pago/i }),
    ).toBeInTheDocument();
  });
});
