/**
 * @jest-environment jsdom
 */
import '../pages/setup';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth';

describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders navigation links for cliente role', () => {
    render(<Sidebar />);
    expect(screen.getByText('Mis Transacciones')).toBeInTheDocument();
    expect(screen.getByText('Mis Contratos')).toBeInTheDocument();
    expect(screen.getByText('Mis Valoraciones')).toBeInTheDocument();
    expect(screen.getByText('Soporte')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Centro de Ayuda')).toBeInTheDocument();
  });

  it('renders the admin Mercado Pago and internal manual links', () => {
    const authStore = useAuthStore as unknown as jest.Mock;
    const implementacionOriginal = authStore.getMockImplementation();

    authStore.mockImplementation(
      (selector?: (state: unknown) => unknown) => {
        const state = {
          user: {
            usuario_roles: [{ activo: true, rol: { nombre: 'super_admin' } }],
          },
          logout: jest.fn(),
        };
        return selector ? selector(state) : state;
      },
    );

    try {
      render(<Sidebar role="admin" />);
      expect(
        screen.getByRole('link', { name: /mercado pago/i }),
      ).toHaveAttribute('href', '/dashboard/admin/mercado-pago');
      expect(
        screen.getByRole('link', { name: /manual de soporte/i }),
      ).toHaveAttribute('href', '/ayuda/interno/manual-soporte');
    } finally {
      if (implementacionOriginal) {
        authStore.mockImplementation(implementacionOriginal);
      }
    }
  });
});
