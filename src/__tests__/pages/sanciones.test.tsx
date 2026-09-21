/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import SancionesPage from '@/app/dashboard/sanciones/page';

describe('SancionesPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<SancionesPage />);
    });
    expect(screen.getByText('Sanciones')).toBeInTheDocument();
  });

  it('renders new sanction button', async () => {
    await act(async () => {
      render(<SancionesPage />);
    });
    expect(screen.getByText('Nueva Sanción')).toBeInTheDocument();
  });

  it('renders filter buttons', async () => {
    await act(async () => {
      render(<SancionesPage />);
    });
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Activas')).toBeInTheDocument();
    expect(screen.getByText('Inactivas')).toBeInTheDocument();
  });
});
