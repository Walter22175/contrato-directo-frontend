/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ValoracionesPage from '@/app/dashboard/valoraciones/page';

describe('ValoracionesPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ValoracionesPage />);
    });
    expect(screen.getByText('Mis Valoraciones')).toBeInTheDocument();
  });

  it('renders tabs for recibidas and dadas', async () => {
    await act(async () => {
      render(<ValoracionesPage />);
    });
    expect(screen.getByText('Recibidas')).toBeInTheDocument();
    expect(screen.getByText('Dadas')).toBeInTheDocument();
  });

  it('shows rating stats card', async () => {
    await act(async () => {
      render(<ValoracionesPage />);
    });
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });
});
