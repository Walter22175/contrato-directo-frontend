/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AdminPage from '@/app/dashboard/admin/page';

describe('AdminPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<AdminPage />);
    });
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    await act(async () => {
      render(<AdminPage />);
    });
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Transacciones')).toBeInTheDocument();
  });

  it('renders quick links', async () => {
    await act(async () => {
      render(<AdminPage />);
    });
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Servicios')).toBeInTheDocument();
    expect(screen.getByText('Reportes Agregados')).toBeInTheDocument();
  });

  it('muestra el banner del nuevo flujo de inicio del servicio', async () => {
    await act(async () => {
      render(<AdminPage />);
    });
    expect(
      screen.getByText(/el nuevo flujo de inicio del servicio ya está activo/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /revisá las métricas/i })).toHaveAttribute(
      'href',
      '/dashboard/admin/metricas',
    );
  });

  it('incluye el link al manual interno de soporte', async () => {
    await act(async () => {
      render(<AdminPage />);
    });
    expect(
      screen.getByRole('link', { name: /manual de soporte/i }),
    ).toHaveAttribute('href', '/ayuda/interno/manual-soporte');
  });
});
