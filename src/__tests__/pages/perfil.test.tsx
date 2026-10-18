/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import PerfilPage from '@/app/perfil/page';

const authStore: {
  user: {
    usuario_roles?: Array<{ activo: boolean; rol: { nombre: string } }>;
  } | null;
} = jest.requireMock('@/store/auth').useAuthStore.getState();

const rolesOriginales = authStore.user?.usuario_roles;

describe('PerfilPage', () => {
  afterEach(() => {
    if (authStore.user) {
      authStore.user.usuario_roles = rolesOriginales;
    }
  });

  it('renders the page title', async () => {
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
  });

  it('shows user name', async () => {
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows user email', async () => {
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.getAllByText('test@test.com').length).toBeGreaterThanOrEqual(1);
  });

  it('has edit link to configuracion', async () => {
    await act(async () => {
      render(<PerfilPage />);
    });
    const editLink = screen.getByText('Editar');
    expect(editLink.closest('a')).toHaveAttribute('href', '/dashboard/configuracion');
  });

  it('shows user role', async () => {
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

  it('shows convert CTA for cliente without provider role', async () => {
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.getByText('Convertirme en Proveedor')).toBeInTheDocument();
  });

  it('muestra los roles adicionales del usuario', async () => {
    if (authStore.user) {
      authStore.user.usuario_roles = [
        { activo: true, rol: { nombre: 'cliente' } },
        { activo: true, rol: { nombre: 'super_admin' } },
        { activo: true, rol: { nombre: 'mediador' } },
      ];
    }
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.getByText('super admin')).toBeInTheDocument();
    expect(screen.getByText('mediador')).toBeInTheDocument();
  });

  it('no muestra roles inactivos', async () => {
    if (authStore.user) {
      authStore.user.usuario_roles = [
        { activo: true, rol: { nombre: 'cliente' } },
        { activo: false, rol: { nombre: 'super_admin' } },
      ];
    }
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.queryByText('super admin')).not.toBeInTheDocument();
  });

  it('no muestra "Sin rol" cuando el usuario tiene roles adicionales sin cliente/proveedor', async () => {
    if (authStore.user) {
      authStore.user.usuario_roles = [
        { activo: true, rol: { nombre: 'super_admin' } },
      ];
    }
    await act(async () => {
      render(<PerfilPage />);
    });
    expect(screen.getByText('super admin')).toBeInTheDocument();
    expect(screen.queryByText('Sin rol')).not.toBeInTheDocument();
  });
});
