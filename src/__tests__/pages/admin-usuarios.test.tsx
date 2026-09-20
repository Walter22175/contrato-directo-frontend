/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AdminUsuariosPage from '@/app/dashboard/admin/usuarios/page';

describe('AdminUsuariosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<AdminUsuariosPage />);
    });
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<AdminUsuariosPage />);
    });
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Verificados')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<AdminUsuariosPage />);
    });
    expect(screen.getByPlaceholderText('Buscar por nombre o email...')).toBeInTheDocument();
  });
});
