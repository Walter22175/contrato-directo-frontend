/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import Header, { esVentanaLanzamiento } from '@/components/layout/Header';
import DashboardPage from '@/app/dashboard/page';

jest.mock('@/hooks/useNotificationsSocket', () => ({
  useNotificationsSocket: () => ({ isConnected: false }),
}));

const authStore: { user: Record<string, unknown> | null } = jest.requireMock(
  '@/store/auth',
).useAuthStore.getState();

describe('esVentanaLanzamiento', () => {
  it('es true del 1 al 5 de cada mes', () => {
    expect(esVentanaLanzamiento(new Date('2026-03-01T12:00:00'))).toBe(true);
    expect(esVentanaLanzamiento(new Date('2026-03-03T12:00:00'))).toBe(true);
    expect(esVentanaLanzamiento(new Date('2026-01-01T12:00:00'))).toBe(true);
    expect(esVentanaLanzamiento(new Date('2026-01-05T12:00:00'))).toBe(true);
  });

  it('es false fuera de la ventana', () => {
    expect(esVentanaLanzamiento(new Date('2026-03-06T12:00:00'))).toBe(false);
    expect(esVentanaLanzamiento(new Date('2026-10-15T12:00:00'))).toBe(false);
    expect(esVentanaLanzamiento(new Date('2026-12-31T23:59:59'))).toBe(false);
    expect(esVentanaLanzamiento(new Date('2026-02-28T12:00:00'))).toBe(false);
  });
});

describe('Header banner de lanzamiento', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-03-03T12:00:00') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('muestra el banner del 30% dentro de la ventana', async () => {
    await act(async () => {
      render(<Header />);
    });
    const banner = screen.getByRole('link', {
      name: /anticipo del 30% para servicios largos/i,
    });
    expect(banner).toHaveAttribute('href', '/novedades/anticipo-30');
    expect(screen.getByText(/más información/i)).toBeInTheDocument();
  });

  it('no muestra el banner fuera de la ventana', async () => {
    jest.setSystemTime(new Date('2026-03-10T12:00:00'));
    await act(async () => {
      render(<Header />);
    });
    expect(
      screen.queryByRole('link', { name: /anticipo del 30% para servicios largos/i }),
    ).not.toBeInTheDocument();
  });
});

describe('Chip del dashboard del proveedor', () => {
  afterEach(() => {
    authStore.user = {
      id_usuario: 'test-user-id',
      nombre: 'Test',
      usuario_roles: [{ activo: true, rol: { nombre: 'cliente' } }],
    };
  });

  it('muestra el chip cuando el usuario es proveedor', async () => {
    authStore.user = {
      id_usuario: 'test-user-id',
      nombre: 'Test',
      usuario_roles: [{ activo: true, rol: { nombre: 'proveedor' } }],
    };
    await act(async () => {
      render(<DashboardPage />);
    });
    const chip = screen.getByText(/nuevo: anticipo del 30% disponible/i);
    expect(chip).toBeInTheDocument();
    expect(chip.closest('a')).toHaveAttribute('href', '/novedades/anticipo-30');
  });

  it('no muestra el chip para clientes', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(
      screen.queryByText(/anticipo del 30% disponible/i),
    ).not.toBeInTheDocument();
  });
});
