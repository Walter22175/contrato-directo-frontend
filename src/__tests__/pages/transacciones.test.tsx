/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import TransaccionesPage from '@/app/dashboard/transacciones/page';

describe('TransaccionesPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<TransaccionesPage />);
    });
    expect(screen.getByText('Mis Transacciones')).toBeInTheDocument();
  });

  it('renders filter buttons', async () => {
    await act(async () => {
      render(<TransaccionesPage />);
    });
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
    expect(screen.getByText('completada')).toBeInTheDocument();
  });

  it('shows empty state initially', async () => {
    await act(async () => {
      render(<TransaccionesPage />);
    });
    expect(screen.getByText('Sin transacciones')).toBeInTheDocument();
  });
});
