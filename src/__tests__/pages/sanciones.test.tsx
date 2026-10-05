/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

  it('abre el formulario con tipos válidos y sin fecha de inicio', async () => {
    await act(async () => {
      render(<SancionesPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Nueva Sanción'));
    });

    expect(screen.queryByText(/Fecha de Inicio/)).not.toBeInTheDocument();
    expect(screen.getByText('Amonestación escrita')).toBeInTheDocument();
    expect(screen.getByText('Fecha de Fin (opcional)')).toBeInTheDocument();
  });
});
