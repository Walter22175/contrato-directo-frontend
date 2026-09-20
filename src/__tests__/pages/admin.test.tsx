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
});
