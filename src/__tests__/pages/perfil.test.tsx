/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import PerfilPage from '@/app/perfil/page';

describe('PerfilPage', () => {
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
    expect(screen.getByText('cliente')).toBeInTheDocument();
  });
});
